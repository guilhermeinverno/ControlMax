import { Router, Response } from "express";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, AuthenticatedRequest } from "./authMiddleware";

const router = Router();

export type SaasBillingStatus = "active" | "past_due" | "suspended";
export type SaasBillingMethod = "pix" | "boleto" | "contrato";
export type SaasInvoiceStatus = "open" | "paid" | "canceled";

function requireSuperAdmin(req: AuthenticatedRequest, res: Response): boolean {
  if (!req.user) {
    res.status(401).json({ error: "Não autenticado." });
    return false;
  }
  const isSuper = req.user.isSuperAdmin === true || req.user.role === "superadmin";
  if (!isSuper) {
    res.status(403).json({ error: "Acesso negado: apenas SuperAdmin." });
    return false;
  }
  return true;
}

function parseMonthlyPriceCents(raw: unknown): number | null {
  if (raw === undefined || raw === null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  // Aceita cents já inteiros ou valor major (ex.: 199.00) se vier com ponto e < 1000 sem ser cents tipico
  if (Number.isInteger(n) && n >= 100) return Math.round(n);
  return Math.round(n * 100);
}

function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** PUT /api/admin/tenants/:id/billing — mensalidade + status de cobrança */
router.put("/tenants/:id/billing", async (req: AuthenticatedRequest, res: Response) => {
  if (!requireSuperAdmin(req, res)) return;

  const tenantId = String(req.params.id || "").trim();
  if (!tenantId) return res.status(400).json({ error: "id inválido." });

  try {
    const ref = adminDb.collection("tenants").doc(tenantId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "Tenant não encontrado." });

    const patch: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };

    if (Object.prototype.hasOwnProperty.call(req.body || {}, "monthlyPrice")) {
      const cents = parseMonthlyPriceCents(req.body.monthlyPrice);
      if (cents === null) return res.status(400).json({ error: "monthlyPrice inválido." });
      patch.monthlyPrice = cents;
    }
    if (Object.prototype.hasOwnProperty.call(req.body || {}, "monthlyPriceCents")) {
      const cents = parseMonthlyPriceCents(req.body.monthlyPriceCents);
      if (cents === null) return res.status(400).json({ error: "monthlyPriceCents inválido." });
      patch.monthlyPrice = cents;
    }
    if (req.body?.billingStatus) {
      const st = String(req.body.billingStatus) as SaasBillingStatus;
      if (!["active", "past_due", "suspended"].includes(st)) {
        return res.status(400).json({ error: "billingStatus inválido." });
      }
      patch.billingStatus = st;
      if (st === "suspended") patch.active = false;
      if (st === "active" && req.body?.reactivate === true) patch.active = true;
    }
    if (req.body?.billingMethod) {
      const m = String(req.body.billingMethod) as SaasBillingMethod;
      if (!["pix", "boleto", "contrato"].includes(m)) {
        return res.status(400).json({ error: "billingMethod inválido." });
      }
      patch.billingMethod = m;
    }
    if (req.body?.plan) patch.plan = String(req.body.plan);
    if (typeof req.body?.active === "boolean") patch.active = req.body.active;

    await ref.set(patch, { merge: true });
    const next = (await ref.get()).data() || {};
    return res.json({ success: true, tenantId, tenant: { id: tenantId, ...next } });
  } catch (error: any) {
    console.error("Erro PUT tenants billing:", error);
    return res.status(500).json({ error: error.message || "Erro ao atualizar billing." });
  }
});

/** GET /api/admin/saas-invoices */
router.get("/saas-invoices", async (req: AuthenticatedRequest, res: Response) => {
  if (!requireSuperAdmin(req, res)) return;

  try {
    const tenantId = req.query.tenantId ? String(req.query.tenantId) : "";
    const limit = Math.min(Number(req.query.limit) || 50, 100);

    let snap;
    if (tenantId) {
      try {
        snap = await adminDb
          .collection("saas_invoices")
          .where("tenantId", "==", tenantId)
          .orderBy("createdAt", "desc")
          .limit(limit)
          .get();
      } catch {
        snap = await adminDb
          .collection("saas_invoices")
          .where("tenantId", "==", tenantId)
          .limit(limit)
          .get();
      }
    } else {
      try {
        snap = await adminDb
          .collection("saas_invoices")
          .orderBy("createdAt", "desc")
          .limit(limit)
          .get();
      } catch {
        snap = await adminDb.collection("saas_invoices").limit(limit).get();
      }
    }

    const invoices = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.json({ invoices });
  } catch (error: any) {
    console.error("Erro GET saas-invoices:", error);
    return res.status(500).json({ error: error.message || "Erro ao listar faturas." });
  }
});

/** POST /api/admin/saas-invoices — criar fatura manual (PIX/boleto/contrato) */
router.post("/saas-invoices", async (req: AuthenticatedRequest, res: Response) => {
  if (!requireSuperAdmin(req, res)) return;

  const tenantId = String(req.body?.tenantId || "").trim();
  if (!tenantId) return res.status(400).json({ error: "tenantId é obrigatório." });

  try {
    const tenantSnap = await adminDb.collection("tenants").doc(tenantId).get();
    if (!tenantSnap.exists) return res.status(404).json({ error: "Tenant não encontrado." });
    const tenant = tenantSnap.data() || {};

    const amountCents =
      parseMonthlyPriceCents(req.body?.amountCents ?? req.body?.amount) ??
      (typeof tenant.monthlyPrice === "number" ? Math.round(tenant.monthlyPrice) : null);
    if (amountCents === null || amountCents <= 0) {
      return res.status(400).json({ error: "amountCents inválido (ou tenant sem monthlyPrice)." });
    }

    const method = (req.body?.method || tenant.billingMethod || "pix") as SaasBillingMethod;
    if (!["pix", "boleto", "contrato"].includes(method)) {
      return res.status(400).json({ error: "method inválido." });
    }

    const period = String(req.body?.period || currentPeriod());
    const ref = adminDb.collection("saas_invoices").doc();
    const payload = {
      tenantId,
      tenantName: String(tenant.name || tenantId),
      period,
      amountCents,
      status: "open" as SaasInvoiceStatus,
      method,
      dueAt: req.body?.dueAt || null,
      paidAt: null,
      externalRef: req.body?.externalRef ? String(req.body.externalRef) : "",
      notes: req.body?.notes ? String(req.body.notes) : "",
      createdBy: req.user!.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    await ref.set(payload);

    // Em atraso se criou fatura open e status era active → past_due opcional
    if (req.body?.markPastDue === true) {
      await adminDb.collection("tenants").doc(tenantId).set(
        { billingStatus: "past_due", updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
    }

    return res.status(201).json({ success: true, id: ref.id, invoice: { id: ref.id, ...payload } });
  } catch (error: any) {
    console.error("Erro POST saas-invoices:", error);
    return res.status(500).json({ error: error.message || "Erro ao criar fatura." });
  }
});

/** POST /api/admin/saas-invoices/:id/mark-paid */
router.post("/saas-invoices/:id/mark-paid", async (req: AuthenticatedRequest, res: Response) => {
  if (!requireSuperAdmin(req, res)) return;

  const id = String(req.params.id || "");
  if (!id) return res.status(400).json({ error: "id inválido." });

  try {
    const ref = adminDb.collection("saas_invoices").doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "Fatura não encontrada." });
    const inv = snap.data() || {};

    await ref.set(
      {
        status: "paid" satisfies SaasInvoiceStatus,
        paidAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        externalRef: req.body?.externalRef
          ? String(req.body.externalRef)
          : inv.externalRef || "",
        notes: req.body?.notes ? String(req.body.notes) : inv.notes || "",
      },
      { merge: true }
    );

    // Reativa billingStatus se estava past_due
    if (inv.tenantId) {
      await adminDb
        .collection("tenants")
        .doc(String(inv.tenantId))
        .set(
          {
            billingStatus: "active",
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
    }

    const next = (await ref.get()).data() || {};
    return res.json({ success: true, id, invoice: { id, ...next } });
  } catch (error: any) {
    console.error("Erro mark-paid:", error);
    return res.status(500).json({ error: error.message || "Erro ao marcar fatura como paga." });
  }
});

/** GET /api/admin/saas-billing/summary — MRR contratado + faturas do mês */
router.get("/saas-billing/summary", async (req: AuthenticatedRequest, res: Response) => {
  if (!requireSuperAdmin(req, res)) return;

  try {
    const tenantsSnap = await adminDb.collection("tenants").get();
    let mrrCents = 0;
    let activeLicenses = 0;
    let pastDue = 0;
    let suspended = 0;

    tenantsSnap.docs.forEach((d) => {
      const t = d.data() || {};
      const status = String(t.billingStatus || (t.active === false ? "suspended" : "active"));
      if (t.active !== false && status === "active") {
        activeLicenses += 1;
        mrrCents += Math.round(Number(t.monthlyPrice || 0));
      }
      if (status === "past_due") pastDue += 1;
      if (status === "suspended" || t.active === false) suspended += 1;
    });

    const period = currentPeriod();
    const invSnap = await adminDb
      .collection("saas_invoices")
      .where("period", "==", period)
      .get()
      .catch(() => null);

    let openCents = 0;
    let paidCents = 0;
    let openCount = 0;
    let paidCount = 0;
    if (invSnap) {
      invSnap.docs.forEach((d) => {
        const inv = d.data();
        const amt = Math.round(Number(inv.amountCents || 0));
        if (inv.status === "paid") {
          paidCents += amt;
          paidCount += 1;
        } else if (inv.status === "open") {
          openCents += amt;
          openCount += 1;
        }
      });
    }

    return res.json({
      period,
      mrrCents,
      activeLicenses,
      pastDue,
      suspended,
      invoices: { openCents, paidCents, openCount, paidCount },
    });
  } catch (error: any) {
    console.error("Erro saas-billing summary:", error);
    return res.status(500).json({ error: error.message || "Erro no resumo de billing." });
  }
});

export { parseMonthlyPriceCents };
export default router;
