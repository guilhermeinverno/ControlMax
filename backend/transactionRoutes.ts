import { Router, Response } from "express";
import { adminDb, AuthenticatedRequest } from "./authMiddleware";
import { checkIdempotency, registerIdempotencySuccess, requireIdempotencyKey } from "./idempotency";
import { FieldValue } from "firebase-admin/firestore";

const router = Router();

// Helper para validar cargo de gerência
function isManager(role: string): boolean {
  const roleLower = String(role).toLowerCase();
  return ['gerente', 'supervisor', 'admin', 'superadmin', 'director', 'coordinador'].includes(roleLower);
}

// Helper para validar valor monetário em centavos
function isValidAmount(val: any): boolean {
  const n = Number(val);
  return Number.isFinite(n) && n > 0;
}

// 1. Registro de Venda (Sale)
router.post("/sale", async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Não autenticado." });

  const idempotencyKey = requireIdempotencyKey(req, res);
  if (!idempotencyKey) return;

  const { 
    clientId, 
    clientName, 
    amountCents, 
    installmentAmountCents, 
    totalInstallments, 
    date, 
    notes,
    photoUrl,
    photoName,
    frequency
  } = req.body;
  const { tenantId, uid: userId, name: userName } = req.user;

  if (!clientId || !clientName || amountCents === undefined || installmentAmountCents === undefined || !totalInstallments || !date) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes." });
  }

  if (!isValidAmount(amountCents) || !isValidAmount(installmentAmountCents)) {
    return res.status(400).json({ error: "Valores monetários inválidos. Devem ser números finitos maiores que zero." });
  }

  const parsedTotalInstallments = Number(totalInstallments);
  if (!Number.isInteger(parsedTotalInstallments) || parsedTotalInstallments <= 0) {
    return res.status(400).json({ error: "Quantidade de parcelas inválida." });
  }

  try {
    const result = await adminDb.runTransaction(async (transaction) => {
      if (idempotencyKey) {
        const cached = await checkIdempotency(transaction, idempotencyKey, userId, tenantId);
        if (cached) {
          if (cached.status === "completed") return { cached: true, response: cached.response };
          throw new Error("Chave de idempotência em processamento.");
        }
      }

      // Buscar caixa aberta do cobrador para este tenant na data
      const boxesQuery = adminDb.collection("boxes")
        .where("userId", "==", userId)
        .where("tenantId", "==", tenantId)
        .where("status", "==", "open");

      const boxesSnap = await transaction.get(boxesQuery);
      if (boxesSnap.empty) {
        throw new Error("Nenhum caixa aberto encontrado para registrar a venda.");
      }

      const boxDoc = boxesSnap.docs[0];
      const boxData = boxDoc.data();
      const boxId = boxDoc.id;

      const saleRef = adminDb.collection("sales").doc();
      const parsedAmount = Math.round(Number(amountCents));
      const parsedInstallmentAmount = Math.round(Number(installmentAmountCents));

      const salePayload = {
        tenantId,
        unitId: boxData.unitId || "",
        unitName: boxData.unitName || "",
        clientId,
        clientName,
        amount: parsedAmount,
        balance: parsedAmount,
        saldoPendienteCents: parsedAmount,
        installmentAmount: parsedInstallmentAmount,
        installments: parsedTotalInstallments,
        totalInstallments: parsedTotalInstallments,
        paidInstallments: 0,
        status: "active",
        date,
        createdAt: FieldValue.serverTimestamp(),
        boxId,
        userId,
        userName,
        notes: notes || "",
        photoUrl: photoUrl || "",
        photoName: photoName || "",
        frequency: frequency || "diaria"
      };

      transaction.set(saleRef, salePayload);

      // Atualizar totais de venda do caixa
      const newTotalSales = (boxData.totalSales || 0) + parsedAmount;
      const newFinalAmount =
        (boxData.initialAmount || 0) +
        (boxData.totalCollections || 0) +
        (boxData.totalIncomes || 0) -
        (boxData.totalExpenses || 0) -
        newTotalSales -
        (boxData.totalTransfers || 0);

      transaction.update(boxDoc.ref, {
        totalSales: newTotalSales,
        finalAmount: newFinalAmount,
      });

      const responsePayload = { success: true, saleId: saleRef.id };

      if (idempotencyKey) {
        registerIdempotencySuccess(transaction, idempotencyKey, responsePayload, userId, tenantId);
      }

      return { cached: false, response: responsePayload };
    });

    return res.status(201).json(result.response);
  } catch (error: any) {
    console.error("Erro ao registrar venda:", error);
    return res.status(400).json({ error: error.message || "Erro ao registrar venda." });
  }
});

// 2. Registro de Recebimento (Collection)
router.post("/collection", async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Não autenticado." });

  const idempotencyKey = requireIdempotencyKey(req, res);
  if (!idempotencyKey) return;

  const { saleId, amountCents, paymentMethod, comment } = req.body;
  const { tenantId, uid: userId, name: userName } = req.user;

  if (!saleId || amountCents === undefined || !paymentMethod) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes para recebimento." });
  }

  const parsedAmount = Math.round(Number(amountCents));
  // Permite 0 para visita sem pagamento (no-payment); rejeita apenas valores inválidos/negativos.
  if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
    return res.status(400).json({ error: "Valor monetário inválido. Deve ser um número finito maior ou igual a zero." });
  }

  try {
    const result = await adminDb.runTransaction(async (transaction) => {
      if (idempotencyKey) {
        const cached = await checkIdempotency(transaction, idempotencyKey, userId, tenantId);
        if (cached) {
          if (cached.status === "completed") return { cached: true, response: cached.response };
          throw new Error("Chave de idempotência em processamento.");
        }
      }

      // Buscar caixa aberta
      const boxesQuery = adminDb.collection("boxes")
        .where("userId", "==", userId)
        .where("tenantId", "==", tenantId)
        .where("status", "==", "open");

      const boxesSnap = await transaction.get(boxesQuery);
      if (boxesSnap.empty) {
        throw new Error("Nenhum caixa aberto encontrado para registrar o pagamento.");
      }

      const boxDoc = boxesSnap.docs[0];
      const boxData = boxDoc.data();
      const boxId = boxDoc.id;

      // Buscar venda
      const saleRef = adminDb.collection("sales").doc(saleId);
      const saleSnap = await transaction.get(saleRef);
      if (!saleSnap.exists) {
        throw new Error("Venda não encontrada.");
      }

      const saleData = saleSnap.data() || {};
      if (saleData.tenantId !== tenantId) {
        throw new Error("Acesso negado: Inconsistência de Tenant na venda.");
      }

      const currentBalance = saleData.saldoPendienteCents || 0;
      const computedNewBalance = Math.max(0, currentBalance - parsedAmount);

      const newTotalCollections = (boxData.totalCollections || 0) + parsedAmount;
      const newFinalAmount =
        (boxData.initialAmount || 0) +
        newTotalCollections +
        (boxData.totalIncomes || 0) -
        (boxData.totalExpenses || 0) -
        (boxData.totalSales || 0) -
        (boxData.totalTransfers || 0);

      const collectionRef = adminDb.collection("collections").doc();
      const collectionPayload = {
        tenantId,
        unitId: boxData.unitId || saleData.unitId || "",
        unitName: boxData.unitName || saleData.unitName || "",
        boxId,
        boxName: boxData.userName || userName,
        userId,
        userName,
        clientId: saleData.clientId || "",
        clientName: saleData.clientName || "",
        saleId,
        amount: parsedAmount,
        type: "collection",
        paymentMethod,
        comment: (comment || "").trim(),
        registeredBy: userName,
        registeredById: userId,
        createdAt: FieldValue.serverTimestamp(),
      };

      transaction.set(collectionRef, collectionPayload);

      const instAmt = Number(saleData.installmentAmountCents || saleData.installmentAmount || 12000);
      let additionalPaid = 0;
      if (parsedAmount > 0 && instAmt > 0) {
        additionalPaid = Math.max(1, Math.round(parsedAmount / instAmt));
      }
      const newPaidInstallments = (saleData.paidInstallments || 0) + additionalPaid;

      transaction.update(saleRef, {
        saldoPendienteCents: computedNewBalance,
        paidInstallments: newPaidInstallments,
        lastPaymentAt: FieldValue.serverTimestamp(),
        status: computedNewBalance <= 0 ? "completed" : (saleData.status || "active"),
      });

      if (parsedAmount > 0) {
        transaction.update(boxDoc.ref, {
          totalCollections: newTotalCollections,
          finalAmount: newFinalAmount,
        });
      }

      const responsePayload = { success: true, collectionId: collectionRef.id };


      if (idempotencyKey) {
        registerIdempotencySuccess(transaction, idempotencyKey, responsePayload, userId, tenantId);
      }

      return { cached: false, response: responsePayload };
    });

    return res.status(201).json(result.response);
  } catch (err: any) {
    console.error("Erro na transação de collection:", err);
    if (err.message && err.message.includes("Missing or insufficient permissions")) {
      return res.status(500).json({ error: "O Backend não tem permissão para acessar o Firestore. Verifique se o Service Account (GOOGLE_APPLICATION_CREDENTIALS) tem o papel 'Datastore User' ou 'Owner' no Google Cloud IAM." });
    }
    return res.status(500).json({ error: err.message || "Erro ao registrar recebimento." });
  }
});

// 3. Ajuste de Caixa (Income/Expense Administrativo)
router.post("/adjustment", async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Não autenticado." });

  const idempotencyKey = requireIdempotencyKey(req, res);
  if (!idempotencyKey) return;

  const { boxId, type, amountCents, reason } = req.body;
  const { tenantId, uid: userId, name: userName, role } = req.user;

  if (!boxId || !type || amountCents === undefined || !reason) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes (boxId, type, amountCents, reason)." });
  }

  if (!isValidAmount(amountCents)) {
    return res.status(400).json({ error: "Valor monetário de ajuste inválido. Deve ser um número finito maior que zero." });
  }

  if (!isManager(role)) {
    return res.status(403).json({ error: "Acesso negado: Apenas supervisores ou administradores podem ajustar caixas." });
  }

  try {
    const result = await adminDb.runTransaction(async (transaction) => {
      if (idempotencyKey) {
        const cached = await checkIdempotency(transaction, idempotencyKey, userId, tenantId);
        if (cached) {
          if (cached.status === "completed") return { cached: true, response: cached.response };
          throw new Error("Chave de idempotência em processamento.");
        }
      }

      const boxRef = adminDb.collection("boxes").doc(boxId);
      const boxSnap = await transaction.get(boxRef);

      if (!boxSnap.exists) {
        throw new Error("Caixa não encontrada.");
      }

      const boxData = boxSnap.data() || {};
      if (boxData.tenantId !== tenantId) {
        throw new Error("Acesso negado: Caixa pertence a outro tenant.");
      }

      if (boxData.status === "confirmed") {
        throw new Error("Ajuste negado: Caixa já foi confirmada e auditada.");
      }

      const parsedAmount = Math.round(Number(amountCents));

      if (type === "income") {
        const incomeRef = adminDb.collection("incomes").doc();
        transaction.set(incomeRef, {
          tenantId,
          boxId,
          boxName: boxData.userName || "Caja",
          cnId: boxData.cnId || "",
          cnName: boxData.cnName || "",
          type: "income",
          incomeType: "Ajuste de caixa",
          amount: parsedAmount,
          comment: reason.trim(),
          description: "Ajuste administrativo",
          userId,
          userName,
          registeredBy: userName,
          registeredById: userId,
          createdAt: FieldValue.serverTimestamp(),
        });

        const newTotalIncomes = (boxData.totalIncomes || 0) + parsedAmount;
        const newFinalAmount =
          (boxData.initialAmount || 0) +
          (boxData.totalCollections || 0) +
          newTotalIncomes -
          (boxData.totalExpenses || 0) -
          (boxData.totalSales || 0) -
          (boxData.totalTransfers || 0);

        transaction.update(boxRef, {
          totalIncomes: newTotalIncomes,
          finalAmount: newFinalAmount,
        });
      } else if (type === "expense") {
        const expenseRef = adminDb.collection("expenses").doc();
        transaction.set(expenseRef, {
          tenantId,
          boxId,
          boxName: boxData.userName || "Caja",
          cnId: boxData.cnId || "",
          cnName: boxData.cnName || "",
          type: "expense",
          expenseType: "Ajuste de caixa",
          amount: parsedAmount,
          comment: reason.trim(),
          description: "Ajuste administrativo",
          status: "approved",
          userId,
          userName,
          requestedBy: userName,
          requestedById: userId,
          createdAt: FieldValue.serverTimestamp(),
        });

        const newTotalExpenses = (boxData.totalExpenses || 0) + parsedAmount;
        const newFinalAmount =
          (boxData.initialAmount || 0) +
          (boxData.totalCollections || 0) +
          (boxData.totalIncomes || 0) -
          newTotalExpenses -
          (boxData.totalSales || 0) -
          (boxData.totalTransfers || 0);

        transaction.update(boxRef, {
          totalExpenses: newTotalExpenses,
          finalAmount: newFinalAmount,
        });
      } else {
        throw new Error("Tipo de ajuste inválido (apenas 'income' ou 'expense').");
      }

      // Registrar Auditoria
      const auditRef = adminDb.collection("audit_logs").doc();
      transaction.set(auditRef, {
        tenantId,
        timestamp: FieldValue.serverTimestamp(),
        userId,
        userName,
        action: "BOX_ADJUSTMENT",
        boxId,
        type,
        amountCents: parsedAmount,
        reason: reason.trim(),
      });

      const responsePayload = { success: true };

      if (idempotencyKey) {
        registerIdempotencySuccess(transaction, idempotencyKey, responsePayload, userId, tenantId);
      }

      return { cached: false, response: responsePayload };
    });

    return res.status(201).json(result.response);
  } catch (error: any) {
    console.error("Erro ao realizar ajuste de caixa:", error);
    return res.status(400).json({ error: error.message || "Erro ao realizar ajuste de caixa." });
  }
});

// 4. Estorno (Reversal)
router.post("/reversal", async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Não autenticado." });

  const idempotencyKey = requireIdempotencyKey(req, res);
  if (!idempotencyKey) return;

  const { originalTransactionId, reason } = req.body;
  const { tenantId, uid: userId, name: userName, role } = req.user;

  if (!originalTransactionId || !reason) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes (originalTransactionId, reason)." });
  }

  if (!isManager(role)) {
    return res.status(403).json({ error: "Acesso negado: Apenas supervisores ou administradores podem estornar transações." });
  }

  try {
    const result = await adminDb.runTransaction(async (transaction) => {
      if (idempotencyKey) {
        const cached = await checkIdempotency(transaction, idempotencyKey, userId, tenantId);
        if (cached) {
          if (cached.status === "completed") return { cached: true, response: cached.response };
          throw new Error("Chave de idempotência em processamento.");
        }
      }

      const collectionRef = adminDb.collection("collections").doc(originalTransactionId);
      const collectionSnap = await transaction.get(collectionRef);

      if (!collectionSnap.exists) {
        throw new Error("Transação original não encontrada.");
      }

      const collectionData = collectionSnap.data() || {};
      if (collectionData.tenantId !== tenantId) {
        throw new Error("Acesso negado: Transação pertence a outro tenant.");
      }

      if (collectionData.status === "reversed") {
        throw new Error("Conflito: Esta transação já foi estornada.");
      }

      const amountToReverse = collectionData.amount || 0;
      const boxId = collectionData.boxId;
      const saleId = collectionData.saleId;

      if (!boxId || !saleId) {
        throw new Error("Transação malformada: Falta vínculo de caixa ou venda.");
      }

      // Buscar caixa associada
      const boxRef = adminDb.collection("boxes").doc(boxId);
      const boxSnap = await transaction.get(boxRef);
      if (!boxSnap.exists) {
        throw new Error("Caixa associada à transação não encontrada.");
      }
      const boxData = boxSnap.data() || {};
      if (boxData.status === "confirmed") {
        throw new Error("Estorno negado: O caixa desta transação já foi confirmada e auditada.");
      }

      // Buscar venda associada
      const saleRef = adminDb.collection("sales").doc(saleId);
      const saleSnap = await transaction.get(saleRef);
      if (!saleSnap.exists) {
        throw new Error("Venda associada à transação não encontrada.");
      }
      const saleData = saleSnap.data() || {};

      // Reverter somas no caixa
      const newTotalCollections = (boxData.totalCollections || 0) - amountToReverse;
      const newFinalAmount =
        (boxData.initialAmount || 0) +
        newTotalCollections +
        (boxData.totalIncomes || 0) -
        (boxData.totalExpenses || 0) -
        (boxData.totalSales || 0) -
        (boxData.totalTransfers || 0);

      // Reverter saldo da venda
      const newSaleBalance = (saleData.saldoPendienteCents || 0) + amountToReverse;

      // Aplicar updates atômicos
      transaction.update(collectionRef, {
        status: "reversed",
        reversedAt: FieldValue.serverTimestamp(),
        reversedBy: userId,
        reversalReason: reason.trim(),
      });

      transaction.update(boxRef, {
        totalCollections: newTotalCollections,
        finalAmount: newFinalAmount,
      });

      transaction.update(saleRef, {
        saldoPendienteCents: newSaleBalance,
        status: "active", // Reativa a venda se estava concluída
      });

      // Gravar log de auditoria
      const auditRef = adminDb.collection("audit_logs").doc();
      transaction.set(auditRef, {
        tenantId,
        timestamp: FieldValue.serverTimestamp(),
        userId,
        userName,
        action: "TRANSACTION_REVERSAL",
        originalTransactionId,
        reason: reason.trim(),
      });

      const responsePayload = { success: true };

      if (idempotencyKey) {
        registerIdempotencySuccess(transaction, idempotencyKey, responsePayload, userId, tenantId);
      }

      return { cached: false, response: responsePayload };
    });

    return res.status(201).json(result.response);
  } catch (error: any) {
    console.error("Erro ao realizar estorno:", error);
    return res.status(400).json({ error: error.message || "Erro ao realizar estorno." });
  }
});

function mapExpenseTypeToBcCategory(type: string): string {
  const normalized = String(type || "").toLowerCase();
  if (normalized.includes("sueldo")) return "salary";
  if (normalized.includes("arriendo")) return "rent";
  if (
    normalized.includes("gasolina") ||
    normalized.includes("aceite") ||
    normalized.includes("moto") ||
    normalized.includes("pinchada")
  ) {
    return "transport";
  }
  if (
    normalized.includes("almuerzo") ||
    normalized.includes("recarga") ||
    normalized.includes("internet") ||
    normalized.includes("cel") ||
    normalized.includes("factura") ||
    normalized.includes("varios")
  ) {
    return "supplies";
  }
  return "other";
}

function resolveExpenseStatus(role: string): "approved" | "pending" {
  return isManager(role) ? "approved" : "pending";
}

function computeBoxFinalAmount(boxData: Record<string, any>, overrides: {
  totalCollections?: number;
  totalIncomes?: number;
  totalExpenses?: number;
  totalSales?: number;
  totalTransfers?: number;
}): number {
  return (
    (boxData.initialAmount || 0) +
    (overrides.totalCollections ?? boxData.totalCollections ?? 0) +
    (overrides.totalIncomes ?? boxData.totalIncomes ?? 0) -
    (overrides.totalExpenses ?? boxData.totalExpenses ?? 0) -
    (overrides.totalSales ?? boxData.totalSales ?? 0) -
    (overrides.totalTransfers ?? boxData.totalTransfers ?? 0)
  );
}

// 5. Despesa / retiro (expense | bc_expense)
router.post("/expense", async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Não autenticado." });

  const idempotencyKey = requireIdempotencyKey(req, res);
  if (!idempotencyKey) return;

  const {
    mode,
    boxId,
    boxName,
    cnId,
    cnName,
    expenseType,
    amountCents,
    comment,
    description,
    attachmentName,
    attachmentUrl,
    category,
  } = req.body;
  const { tenantId, uid: userId, name: userName, role } = req.user;

  const resolvedMode = mode === "retiro" || mode === "bc" ? "retiro" : "gasto";

  if (!cnId || !expenseType || amountCents === undefined || !comment || !description) {
    return res.status(400).json({
      error: "Campos obrigatórios ausentes (cnId, expenseType, amountCents, comment, description).",
    });
  }

  if (resolvedMode === "gasto" && !boxId) {
    return res.status(400).json({ error: "boxId é obrigatório para gasto de caixa." });
  }

  if (!isValidAmount(amountCents)) {
    return res.status(400).json({ error: "Valor monetário inválido. Deve ser um número finito maior que zero." });
  }

  const parsedAmount = Math.round(Number(amountCents));
  const status = resolveExpenseStatus(role);

  try {
    const result = await adminDb.runTransaction(async (transaction) => {
      if (idempotencyKey) {
        const cached = await checkIdempotency(transaction, idempotencyKey, userId, tenantId);
        if (cached) {
          if (cached.status === "completed") return { cached: true, response: cached.response };
          throw new Error("Chave de idempotência em processamento.");
        }
      }

      if (resolvedMode === "gasto") {
        const boxRef = adminDb.collection("boxes").doc(boxId);
        const boxSnap = await transaction.get(boxRef);
        if (!boxSnap.exists) throw new Error("Caixa não encontrada.");

        const boxData = boxSnap.data() || {};
        if (boxData.tenantId !== tenantId) {
          throw new Error("Acesso negado: Caixa pertence a outro tenant.");
        }
        if (boxData.status === "confirmed") {
          throw new Error("Operação bloqueada: Caixa já confirmada e auditada.");
        }

        const expenseRef = adminDb.collection("expenses").doc();
        transaction.set(expenseRef, {
          tenantId,
          boxId,
          boxName: boxName || boxData.userName || "Caja",
          cnId,
          cnName: cnName || boxData.cnName || "",
          type: "expense",
          expenseType,
          amount: parsedAmount,
          comment: String(comment).trim(),
          description: String(description).trim(),
          attachmentName: attachmentName || "",
          attachmentUrl: attachmentUrl || "",
          status,
          userId,
          userName,
          requestedBy: userName,
          requestedById: userId,
          createdAt: FieldValue.serverTimestamp(),
        });

        // Só atualiza totais do caixa quando já aprovado (gestor).
        if (status === "approved") {
          const newTotalExpenses = (boxData.totalExpenses || 0) + parsedAmount;
          transaction.update(boxRef, {
            totalExpenses: newTotalExpenses,
            finalAmount: computeBoxFinalAmount(boxData, { totalExpenses: newTotalExpenses }),
          });
        }

        const responsePayload = { success: true, expenseId: expenseRef.id, status, mode: "gasto" };
        if (idempotencyKey) {
          registerIdempotencySuccess(transaction, idempotencyKey, responsePayload, userId, tenantId);
        }
        return { cached: false, response: responsePayload };
      }

      // Retiro de CN → bc_expenses
      const bcExpenseRef = adminDb.collection("bc_expenses").doc();
      transaction.set(bcExpenseRef, {
        tenantId,
        cnId,
        cnName: cnName || "",
        userId,
        userName,
        amount: parsedAmount,
        description: String(description).trim(),
        comment: String(comment).trim(),
        category: category || mapExpenseTypeToBcCategory(expenseType),
        expenseType,
        status,
        attachmentName: attachmentName || "",
        attachmentUrl: attachmentUrl || "",
        createdAt: FieldValue.serverTimestamp(),
      });

      const responsePayload = { success: true, expenseId: bcExpenseRef.id, status, mode: "retiro" };
      if (idempotencyKey) {
        registerIdempotencySuccess(transaction, idempotencyKey, responsePayload, userId, tenantId);
      }
      return { cached: false, response: responsePayload };
    });

    return res.status(201).json(result.response);
  } catch (error: any) {
    console.error("Erro ao registrar despesa:", error);
    return res.status(400).json({ error: error.message || "Erro ao registrar despesa." });
  }
});

// 6. Receita (income | bc_income)
router.post("/income", async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Não autenticado." });

  const idempotencyKey = requireIdempotencyKey(req, res);
  if (!idempotencyKey) return;

  const {
    mode,
    boxId,
    boxName,
    cnId,
    cnName,
    incomeType,
    amountCents,
    comment,
    description,
    attachmentName,
    attachmentUrl,
    saleId,
    saleClientName,
    category,
  } = req.body;
  const { tenantId, uid: userId, name: userName, role } = req.user;

  const resolvedMode = mode === "bc" ? "bc" : "box";

  if (amountCents === undefined || !comment) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes (amountCents, comment)." });
  }

  if (!isValidAmount(amountCents)) {
    return res.status(400).json({ error: "Valor monetário inválido. Deve ser um número finito maior que zero." });
  }

  const parsedAmount = Math.round(Number(amountCents));

  try {
    const result = await adminDb.runTransaction(async (transaction) => {
      if (idempotencyKey) {
        const cached = await checkIdempotency(transaction, idempotencyKey, userId, tenantId);
        if (cached) {
          if (cached.status === "completed") return { cached: true, response: cached.response };
          throw new Error("Chave de idempotência em processamento.");
        }
      }

      if (resolvedMode === "bc") {
        if (!cnId || !description) {
          throw new Error("cnId e description são obrigatórios para ingresso de CN.");
        }
        const status = resolveExpenseStatus(role);
        const bcIncomeRef = adminDb.collection("bc_incomes").doc();
        transaction.set(bcIncomeRef, {
          tenantId,
          cnId,
          cnName: cnName || "",
          userId,
          userName,
          amount: parsedAmount,
          description: String(description).trim(),
          category: category || "deposit",
          status,
          createdAt: FieldValue.serverTimestamp(),
        });

        const responsePayload = { success: true, incomeId: bcIncomeRef.id, status, mode: "bc" };
        if (idempotencyKey) {
          registerIdempotencySuccess(transaction, idempotencyKey, responsePayload, userId, tenantId);
        }
        return { cached: false, response: responsePayload };
      }

      if (!boxId || !incomeType) {
        throw new Error("boxId e incomeType são obrigatórios para ingresso de caixa.");
      }

      const boxRef = adminDb.collection("boxes").doc(boxId);
      const boxSnap = await transaction.get(boxRef);
      if (!boxSnap.exists) throw new Error("Caixa não encontrada.");

      const boxData = boxSnap.data() || {};
      if (boxData.tenantId !== tenantId) {
        throw new Error("Acesso negado: Caixa pertence a outro tenant.");
      }
      if (boxData.status === "confirmed") {
        throw new Error("Operação bloqueada: Caixa já confirmada e auditada.");
      }

      const incomeRef = adminDb.collection("incomes").doc();
      const incomePayload: Record<string, unknown> = {
        tenantId,
        boxId,
        boxName: boxName || boxData.userName || "Caja",
        cnId: cnId || boxData.cnId || "",
        cnName: cnName || boxData.cnName || "",
        type: "income",
        incomeType,
        amount: parsedAmount,
        comment: String(comment).trim(),
        description: String(description || "").trim(),
        attachmentName: attachmentName || "",
        attachmentUrl: attachmentUrl || "",
        userId,
        userName,
        registeredBy: userName,
        registeredById: userId,
        createdAt: FieldValue.serverTimestamp(),
      };
      if (saleId) {
        incomePayload.saleId = saleId;
        incomePayload.saleClientName = saleClientName || "";
      }

      transaction.set(incomeRef, incomePayload);

      const newTotalIncomes = (boxData.totalIncomes || 0) + parsedAmount;
      transaction.update(boxRef, {
        totalIncomes: newTotalIncomes,
        finalAmount: computeBoxFinalAmount(boxData, { totalIncomes: newTotalIncomes }),
      });

      const responsePayload = { success: true, incomeId: incomeRef.id, mode: "box" };
      if (idempotencyKey) {
        registerIdempotencySuccess(transaction, idempotencyKey, responsePayload, userId, tenantId);
      }
      return { cached: false, response: responsePayload };
    });

    return res.status(201).json(result.response);
  } catch (error: any) {
    console.error("Erro ao registrar receita:", error);
    return res.status(400).json({ error: error.message || "Erro ao registrar receita." });
  }
});

// 7. Aprovação/rejeição (expenses, bc_expenses, bc_incomes)
router.post("/approval", async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Não autenticado." });

  const idempotencyKey = requireIdempotencyKey(req, res);
  if (!idempotencyKey) return;

  const { resourceType, resourceId, status } = req.body;
  const { tenantId, uid: userId, name: userName, role } = req.user;

  if (!resourceType || !resourceId || !status) {
    return res.status(400).json({
      error: "Campos obrigatórios ausentes (resourceType, resourceId, status).",
    });
  }

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "status inválido (approved | rejected)." });
  }

  if (!isManager(role)) {
    return res.status(403).json({ error: "Acesso negado: apenas gestores podem aprovar/rejeitar." });
  }

  const collectionName =
    resourceType === "expense"
      ? "expenses"
      : resourceType === "bc_expense"
        ? "bc_expenses"
        : resourceType === "bc_income"
          ? "bc_incomes"
          : null;

  if (!collectionName) {
    return res.status(400).json({
      error: "resourceType inválido (expense | bc_expense | bc_income).",
    });
  }

  try {
    const result = await adminDb.runTransaction(async (transaction) => {
      if (idempotencyKey) {
        const cached = await checkIdempotency(transaction, idempotencyKey, userId, tenantId);
        if (cached) {
          if (cached.status === "completed") return { cached: true, response: cached.response };
          throw new Error("Chave de idempotência em processamento.");
        }
      }

      const resourceRef = adminDb.collection(collectionName).doc(resourceId);
      const resourceSnap = await transaction.get(resourceRef);
      if (!resourceSnap.exists) throw new Error("Registro não encontrado.");

      const data = resourceSnap.data() || {};
      if (data.tenantId !== tenantId) {
        throw new Error("Acesso negado: registro de outro tenant.");
      }

      if (data.status && data.status !== "pending") {
        throw new Error(`Registro já está com status '${data.status}'.`);
      }

      transaction.update(resourceRef, {
        status,
        approvedBy: userName,
        approvedAt: FieldValue.serverTimestamp(),
      });

      // Ao aprovar gasto de caixa pendente, aplica efeito no caixa.
      if (collectionName === "expenses" && status === "approved" && data.boxId) {
        const boxRef = adminDb.collection("boxes").doc(data.boxId);
        const boxSnap = await transaction.get(boxRef);
        if (boxSnap.exists) {
          const boxData = boxSnap.data() || {};
          if (boxData.tenantId === tenantId && boxData.status !== "confirmed") {
            const amount = Math.round(Number(data.amount || 0));
            const newTotalExpenses = (boxData.totalExpenses || 0) + amount;
            transaction.update(boxRef, {
              totalExpenses: newTotalExpenses,
              finalAmount: computeBoxFinalAmount(boxData, { totalExpenses: newTotalExpenses }),
            });
          }
        }
      }

      const responsePayload = { success: true, resourceId, status };
      if (idempotencyKey) {
        registerIdempotencySuccess(transaction, idempotencyKey, responsePayload, userId, tenantId);
      }
      return { cached: false, response: responsePayload };
    });

    return res.status(200).json(result.response);
  } catch (error: any) {
    console.error("Erro ao processar aprovação:", error);
    return res.status(400).json({ error: error.message || "Erro ao processar aprovação." });
  }
});

export default router;


