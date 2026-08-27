import { Router, Response } from "express";
import { adminDb, AuthenticatedRequest } from "./authMiddleware";
import { checkIdempotency, registerIdempotencySuccess, requireIdempotencyKey } from "./idempotency";
import { FieldValue } from "firebase-admin/firestore";
import { assertUnitAssignedToUser, getUserAssignedUnits, isPrivilegedUnitRole } from "./userUnitAccess";

const router = Router();

// Helper para validar permissão de confirmação
function hasConfirmPermission(role: string, permissions: any): boolean {
  const roleLower = String(role).toLowerCase();
  const isGerenteOrSupervisor = ['gerente', 'supervisor', 'admin', 'superadmin', 'director', 'coordinador'].includes(roleLower);
  
  if (permissions) {
    if (Array.isArray(permissions) && permissions.includes('caja:confirmar')) return true;
    if (typeof permissions === 'object' && permissions['caja:confirmar'] === true) return true;
  }
  
  return isGerenteOrSupervisor;
}

// Helper para validar valor numérico não negativo (permitindo 0 para caixas zerados)
function isValidBoxAmount(val: any): boolean {
  const n = Number(val);
  return Number.isFinite(n) && !isNaN(n) && n >= 0;
}

function statusFromErrorMessage(message: string): number {
  return message.includes("Acesso negado") ? 403 : 400;
}

// 1. Abertura de Caixa
router.post("/open", async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Não autenticado." });

  const idempotencyKey = requireIdempotencyKey(req, res);
  if (!idempotencyKey) return;

  const { unitId, unitName, cnId, cnName, initialAmount, observation, date } = req.body;
  const { tenantId, uid: userId, name: userName, role } = req.user;

  if (!unitId || !cnId || !date || initialAmount === undefined) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes." });
  }

  if (!isValidBoxAmount(initialAmount)) {
    return res.status(400).json({ error: "Valor inicial inválido (deve ser um número maior ou igual a zero)." });
  }

  try {
    const result = await adminDb.runTransaction(async (transaction) => {
      // Validar idempotência
      if (idempotencyKey) {
        const cached = await checkIdempotency(transaction, idempotencyKey, userId, tenantId);
        if (cached) {
          if (cached.status === "completed") return { cached: true, response: cached.response };
          throw new Error("Chave de idempotência em processamento.");
        }
      }

      // CTX-02: escopo de unidade
      const userRef = adminDb.collection("users").doc(userId);
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists) {
        if (!isPrivilegedUnitRole(role)) {
          throw new Error("Acesso negado: Perfil de usuário não encontrado.");
        }
      } else {
        assertUnitAssignedToUser(userSnap.data() || {}, String(unitId), role);
      }

      // Verificar se já existe caixa para esta Unidade nesta data
      const boxesRef = adminDb.collection("boxes");
      const activeCheckQuery = boxesRef
        .where("tenantId", "==", tenantId)
        .where("unitId", "==", unitId)
        .where("date", "==", date)
        .where("status", "in", ["open", "closed", "confirmed"]);

      const checkSnap = await transaction.get(activeCheckQuery);
      if (!checkSnap.empty) {
        throw new Error("Já existe um caixa aberto, fechado ou confirmado para esta Unidade nesta data.");
      }

      const boxRef = boxesRef.doc();
      const amountInCents = Math.round(Number(initialAmount));

      const boxPayload = {
        tenantId,
        unitId,
        unitName,
        cnId,
        cnName,
        userId,
        userName,
        status: "open",
        openedAt: FieldValue.serverTimestamp(),
        date,
        initialAmount: amountInCents,
        observation: observation || "",
        totalIncomes: 0,
        totalExpenses: 0,
        totalSales: 0,
        totalCollections: 0,
        totalTransfers: 0,
        finalAmount: amountInCents,
        expectedFinalAmount: amountInCents,
        difference: 0,
      };

      transaction.set(boxRef, boxPayload);

      const responsePayload = { success: true, boxId: boxRef.id };

      if (idempotencyKey) {
        registerIdempotencySuccess(transaction, idempotencyKey, responsePayload, userId, tenantId);
      }

      return { cached: false, response: responsePayload };
    });

    return res.status(201).json(result.response);
  } catch (error: any) {
    console.error("Erro ao abrir caixa:", error);
    const message = error.message || "Erro ao abrir o caixa.";
    return res.status(statusFromErrorMessage(message)).json({ error: message });
  }
});

// 2. Fechamento de Caixa
router.post("/close", async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Não autenticado." });

  const idempotencyKey = requireIdempotencyKey(req, res);
  if (!idempotencyKey) return;

  const { boxId, realFinalAmount } = req.body;
  const { tenantId, uid: userId } = req.user;

  if (!boxId || realFinalAmount === undefined) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes." });
  }

  if (!isValidBoxAmount(realFinalAmount)) {
    return res.status(400).json({ error: "Valor final real inválido (deve ser um número maior ou igual a zero)." });
  }

  try {
    const result = await adminDb.runTransaction(async (transaction) => {
      // Validar idempotência
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
        throw new Error("Acesso negado: Inconsistência de Tenant.");
      }

      if (boxData.status !== "open") {
        throw new Error("Caixa não está aberta.");
      }

      // Buscar somatórios
      const incomesQuery = adminDb.collection("incomes").where("boxId", "==", boxId).where("tenantId", "==", tenantId);
      const expensesQuery = adminDb.collection("expenses").where("boxId", "==", boxId).where("tenantId", "==", tenantId).where("status", "in", ["approved", "pending"]);
      const salesQuery = adminDb.collection("sales").where("boxId", "==", boxId).where("tenantId", "==", tenantId);
      const collectionsQuery = adminDb.collection("collections").where("boxId", "==", boxId).where("tenantId", "==", tenantId);
      const transfersQuery = adminDb.collection("transfers").where("boxId", "==", boxId).where("tenantId", "==", tenantId);

      const [incomesSnap, expensesSnap, salesSnap, collectionsSnap, transfersSnap] = await Promise.all([
        transaction.get(incomesQuery),
        transaction.get(expensesQuery),
        transaction.get(salesQuery),
        transaction.get(collectionsQuery),
        transaction.get(transfersQuery),
      ]);

      const totalIncomes = incomesSnap.docs.reduce((s, d) => s + (d.data().amount || 0), 0);
      const totalExpenses = expensesSnap.docs.reduce((s, d) => s + (d.data().amount || 0), 0);
      const totalSales = salesSnap.docs.reduce((s, d) => s + (d.data().amount || 0), 0);
      const totalCollections = collectionsSnap.docs.reduce((s, d) => s + (d.data().amount || 0), 0);
      const totalTransfers = transfersSnap.docs.reduce((s, d) => s + (d.data().amount || 0), 0);

      const expectedFinalAmount =
        boxData.initialAmount +
        totalCollections +
        totalIncomes -
        totalExpenses -
        totalSales -
        totalTransfers;

      const difference = Number(realFinalAmount) - expectedFinalAmount;

      transaction.update(boxRef, {
        status: "closed",
        closedAt: FieldValue.serverTimestamp(),
        totalIncomes,
        totalExpenses,
        totalSales,
        totalCollections,
        totalTransfers,
        finalAmount: Number(realFinalAmount),
        expectedFinalAmount,
        difference,
      });

      const responsePayload = { success: true };

      if (idempotencyKey) {
        registerIdempotencySuccess(transaction, idempotencyKey, responsePayload, userId, tenantId);
      }

      return { cached: false, response: responsePayload };
    });

    return res.json(result.response);
  } catch (error: any) {
    console.error("Erro ao fechar caixa:", error);
    return res.status(400).json({ error: error.message || "Erro ao fechar o caixa." });
  }
});

// 3. Confirmação de Caixa
export async function confirmBoxHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: "Não autenticado." });

  const idempotencyKey = requireIdempotencyKey(req, res);
  if (!idempotencyKey) return;
  const { boxId } = req.body;
  const { tenantId, uid: userId } = req.user;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const ip_origem = Array.isArray(ip) ? ip[0] : ip;

  if (!boxId) {
    return res.status(400).json({ error: "Parâmetro obrigatório ausente (boxId)." });
  }

  try {
    const result = await adminDb.runTransaction(async (transaction) => {
      // Validar idempotência
      if (idempotencyKey) {
        const cached = await checkIdempotency(transaction, idempotencyKey, userId, tenantId);
        if (cached) {
          if (cached.status === "completed") return { cached: true, response: cached.response };
          throw new Error("Chave de idempotência em processamento.");
        }
      }

      // Buscar perfil do usuário
      const userRef = adminDb.collection("users").doc(userId);
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists) {
        const secLogDoc = adminDb.collection("security_logs").doc();
        transaction.set(secLogDoc, {
          timestamp: new Date().toISOString(),
          tenantId,
          usuario_id: userId,
          operador_role: 'unknown',
          acao: 'CONFIRM_BOX',
          unidad_id: 'unknown',
          ip_origem,
          status: 'DENIED'
        });
        throw new Error("Acesso negado: Usuário não cadastrado.");
      }

      const userData = userSnap.data() || {};
      if (userData.tenantId !== tenantId) {
        const secLogDoc = adminDb.collection("security_logs").doc();
        transaction.set(secLogDoc, {
          timestamp: new Date().toISOString(),
          tenantId,
          usuario_id: userId,
          operador_role: userData.role || 'unknown',
          acao: 'CONFIRM_BOX',
          unidad_id: 'unknown',
          ip_origem,
          status: 'DENIED'
        });
        throw new Error("Acesso negado: Inconsistência de Tenant.");
      }

      const role = userData.role || '';
      const permissions = userData.permissions || {};

      if (!hasConfirmPermission(role, permissions)) {
        const secLogDoc = adminDb.collection("security_logs").doc();
        transaction.set(secLogDoc, {
          timestamp: new Date().toISOString(),
          tenantId,
          usuario_id: userId,
          operador_role: role,
          acao: 'CONFIRM_BOX',
          unidad_id: 'unknown',
          ip_origem,
          status: 'DENIED'
        });
        throw new Error("Acesso negado: Permissão insuficiente (caja:confirmar).");
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

      const boxUnitId = boxData.unitId || '';
      const userUnits = getUserAssignedUnits(userData);
      if (!boxUnitId || !userUnits.includes(boxUnitId)) {
        const secLogDoc = adminDb.collection("security_logs").doc();
        transaction.set(secLogDoc, {
          timestamp: new Date().toISOString(),
          tenantId,
          usuario_id: userId,
          operador_role: role,
          acao: 'CONFIRM_BOX',
          unidad_id: boxUnitId || 'unknown',
          ip_origem,
          status: 'DENIED'
        });
        throw new Error("Acesso negado: O caixa pertence a uma unidade ausente ou não atribuída a este usuário.");
      }

      if (boxData.status !== "closed") {
        throw new Error("Apenas caixas fechadas podem ser confirmadas.");
      }

      transaction.update(boxRef, {
        status: 'confirmed',
        confirmedAt: FieldValue.serverTimestamp(),
        confirmedBy: userId
      });

      const secLogDoc = adminDb.collection("security_logs").doc();
      transaction.set(secLogDoc, {
        timestamp: new Date().toISOString(),
        tenantId,
        usuario_id: userId,
        operador_role: role,
        acao: 'CONFIRM_BOX',
        unidad_id: boxUnitId || 'unknown',
        ip_origem,
        status: 'SUCCESS'
      });

      const responsePayload = { success: true };

      if (idempotencyKey) {
        registerIdempotencySuccess(transaction, idempotencyKey, responsePayload, userId, tenantId);
      }

      return { cached: false, response: responsePayload };
    });

    return res.json(result.response);
  } catch (error: any) {
    console.error("Erro ao confirmar caixa:", error);
    return res.status(400).json({ error: error.message || "Erro ao confirmar o caixa." });
  }
}

router.post("/confirm", confirmBoxHandler);

function isManagerRole(role: string): boolean {
  const roleLower = String(role).toLowerCase();
  return ["gerente", "supervisor", "admin", "superadmin", "director", "coordinador"].includes(roleLower);
}

/** P1-04 — abertura massiva (gestor) via Admin SDK */
router.post("/open-batch", async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Não autenticado." });

  const idempotencyKey = requireIdempotencyKey(req, res);
  if (!idempotencyKey) return;

  const { tenantId, uid: userId, role } = req.user;
  if (!isManagerRole(role)) {
    return res.status(403).json({ error: "Acesso negado: apenas gestores podem abrir caixas em massa." });
  }

  const { date, items, observation } = req.body as {
    date?: string;
    observation?: string;
    items?: Array<{
      userId: string;
      userName?: string;
      unitId: string;
      unitName?: string;
      cnId: string;
      cnName?: string;
      initialAmount: number;
    }>;
  };

  if (!date || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Campos obrigatórios: date e items[]." });
  }
  if (items.length > 200) {
    return res.status(400).json({ error: "Máximo de 200 caixas por lote." });
  }

  try {
    const cached = await adminDb.runTransaction(async (transaction) => {
      const hit = await checkIdempotency(transaction, idempotencyKey, userId, tenantId);
      if (hit?.status === "completed") return hit.response;
      if (hit) throw new Error("Chave de idempotência em processamento.");
      return null;
    });
    if (cached) return res.status(201).json(cached);

    const createdIds: string[] = [];
    const skipped: Array<{ userId: string; reason: string }> = [];
    const batch = adminDb.batch();
    let ops = 0;

    for (const item of items) {
      if (!item?.userId || !item?.unitId || !item?.cnId || item.initialAmount === undefined) {
        skipped.push({ userId: String(item?.userId || ""), reason: "Campos incompletos." });
        continue;
      }
      if (!isValidBoxAmount(item.initialAmount)) {
        skipped.push({ userId: item.userId, reason: "Valor inicial inválido." });
        continue;
      }

      const existing = await adminDb
        .collection("boxes")
        .where("tenantId", "==", tenantId)
        .where("unitId", "==", item.unitId)
        .where("date", "==", date)
        .where("status", "in", ["open", "closed", "confirmed"])
        .limit(1)
        .get();

      if (!existing.empty) {
        skipped.push({ userId: item.userId, reason: "Já existe caixa nesta unidade/data." });
        continue;
      }

      const amountInCents = Math.round(Number(item.initialAmount));
      const boxRef = adminDb.collection("boxes").doc();
      batch.set(boxRef, {
        tenantId,
        unitId: item.unitId,
        unitName: item.unitName || "",
        cnId: item.cnId,
        cnName: item.cnName || "",
        userId: item.userId,
        userName: item.userName || "",
        status: "open",
        openedAt: FieldValue.serverTimestamp(),
        date,
        initialAmount: amountInCents,
        observation: observation || "",
        totalIncomes: 0,
        totalExpenses: 0,
        totalSales: 0,
        totalCollections: 0,
        totalTransfers: 0,
        finalAmount: amountInCents,
        expectedFinalAmount: amountInCents,
        difference: 0,
        openedByManagerId: userId,
      });
      createdIds.push(boxRef.id);
      ops += 1;
    }

    if (ops > 0) {
      await batch.commit();
    }

    const responsePayload = {
      success: true,
      createdCount: createdIds.length,
      createdIds,
      skipped,
    };

    await adminDb.runTransaction(async (transaction) => {
      registerIdempotencySuccess(transaction, idempotencyKey, responsePayload, userId, tenantId);
    });

    return res.status(201).json(responsePayload);
  } catch (error: any) {
    console.error("Erro open-batch:", error);
    return res.status(400).json({ error: error.message || "Erro na abertura massiva." });
  }
});

/** P1-04 — fechamento massivo (gestor) */
router.post("/close-batch", async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Não autenticado." });

  const idempotencyKey = requireIdempotencyKey(req, res);
  if (!idempotencyKey) return;

  const { tenantId, uid: userId, role } = req.user;
  if (!isManagerRole(role)) {
    return res.status(403).json({ error: "Acesso negado: apenas gestores podem fechar caixas em massa." });
  }

  const { items } = req.body as {
    items?: Array<{ boxId: string; realFinalAmount?: number }>;
  };

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Informe items[] com boxId." });
  }
  if (items.length > 100) {
    return res.status(400).json({ error: "Máximo de 100 caixas por lote." });
  }

  try {
    const cached = await adminDb.runTransaction(async (transaction) => {
      const hit = await checkIdempotency(transaction, idempotencyKey, userId, tenantId);
      if (hit?.status === "completed") return hit.response;
      if (hit) throw new Error("Chave de idempotência em processamento.");
      return null;
    });
    if (cached) return res.json(cached);

    const closed: string[] = [];
    const failed: Array<{ boxId: string; error: string }> = [];

    for (const item of items) {
      const boxId = String(item?.boxId || "");
      if (!boxId) {
        failed.push({ boxId: "", error: "boxId ausente." });
        continue;
      }

      try {
        await adminDb.runTransaction(async (transaction) => {
          const boxRef = adminDb.collection("boxes").doc(boxId);
          const boxSnap = await transaction.get(boxRef);
          if (!boxSnap.exists) throw new Error("Caixa não encontrada.");

          const boxData = boxSnap.data() || {};
          if (boxData.tenantId !== tenantId) throw new Error("Acesso negado: Inconsistência de Tenant.");
          if (boxData.status !== "open") throw new Error("Caixa não está aberta.");

          const incomesQuery = adminDb.collection("incomes").where("boxId", "==", boxId).where("tenantId", "==", tenantId);
          const expensesQuery = adminDb
            .collection("expenses")
            .where("boxId", "==", boxId)
            .where("tenantId", "==", tenantId)
            .where("status", "in", ["approved", "pending"]);
          const salesQuery = adminDb.collection("sales").where("boxId", "==", boxId).where("tenantId", "==", tenantId);
          const collectionsQuery = adminDb
            .collection("collections")
            .where("boxId", "==", boxId)
            .where("tenantId", "==", tenantId);
          const transfersQuery = adminDb
            .collection("transfers")
            .where("boxId", "==", boxId)
            .where("tenantId", "==", tenantId);

          const [incomesSnap, expensesSnap, salesSnap, collectionsSnap, transfersSnap] = await Promise.all([
            transaction.get(incomesQuery),
            transaction.get(expensesQuery),
            transaction.get(salesQuery),
            transaction.get(collectionsQuery),
            transaction.get(transfersQuery),
          ]);

          const totalIncomes = incomesSnap.docs.reduce((s, d) => s + (d.data().amount || 0), 0);
          const totalExpenses = expensesSnap.docs.reduce((s, d) => s + (d.data().amount || 0), 0);
          const totalSales = salesSnap.docs.reduce((s, d) => s + (d.data().amount || 0), 0);
          const totalCollections = collectionsSnap.docs.reduce((s, d) => s + (d.data().amount || 0), 0);
          const totalTransfers = transfersSnap.docs.reduce((s, d) => s + (d.data().amount || 0), 0);

          const expectedFinalAmount =
            boxData.initialAmount + totalCollections + totalIncomes - totalExpenses - totalSales - totalTransfers;

          const realFinal =
            item.realFinalAmount !== undefined && item.realFinalAmount !== null
              ? Number(item.realFinalAmount)
              : expectedFinalAmount;

          if (!isValidBoxAmount(realFinal)) {
            throw new Error("Valor final real inválido.");
          }

          transaction.update(boxRef, {
            status: "closed",
            closedAt: FieldValue.serverTimestamp(),
            closedByManagerId: userId,
            totalIncomes,
            totalExpenses,
            totalSales,
            totalCollections,
            totalTransfers,
            finalAmount: realFinal,
            expectedFinalAmount,
            difference: realFinal - expectedFinalAmount,
          });
        });
        closed.push(boxId);
      } catch (err: any) {
        failed.push({ boxId, error: err?.message || "Falha ao fechar." });
      }
    }

    const responsePayload = {
      success: failed.length === 0,
      closedCount: closed.length,
      closed,
      failed,
    };

    await adminDb.runTransaction(async (transaction) => {
      registerIdempotencySuccess(transaction, idempotencyKey, responsePayload, userId, tenantId);
    });

    return res.json(responsePayload);
  } catch (error: any) {
    console.error("Erro close-batch:", error);
    return res.status(400).json({ error: error.message || "Erro no fechamento massivo." });
  }
});

export default router;
