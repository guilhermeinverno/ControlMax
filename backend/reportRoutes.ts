import { Router, Response } from "express";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, AuthenticatedRequest } from "./authMiddleware";
import { assertPermission } from "./roleRoutes";

const router = Router();

export type ReportJobType = "period_summary" | "finance_snapshot" | "box_day";
export type ReportJobStatus = "queued" | "running" | "completed" | "failed";

const ALLOWED_TYPES: ReportJobType[] = ["period_summary", "finance_snapshot", "box_day"];

async function processReportJob(jobId: string): Promise<void> {
  const ref = adminDb.collection("report_jobs").doc(jobId);
  const snap = await ref.get();
  if (!snap.exists) return;

  const job = snap.data() || {};
  const tenantId = String(job.tenantId || "");
  const type = String(job.type || "") as ReportJobType;

  await ref.set(
    {
      status: "running" satisfies ReportJobStatus,
      startedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  try {
    let rows: Record<string, unknown>[] = [];
    let summary: Record<string, unknown> = {};

    if (type === "period_summary" || type === "finance_snapshot") {
      const startIso = job.params?.startDate ? String(job.params.startDate) : null;
      const endIso = job.params?.endDate ? String(job.params.endDate) : null;
      const start = startIso ? new Date(`${startIso}T00:00:00`) : new Date(Date.now() - 7 * 86400000);
      const end = endIso ? new Date(`${endIso}T23:59:59`) : new Date();

      const boxesSnap = await adminDb
        .collection("boxes")
        .where("tenantId", "==", tenantId)
        .where("openedAt", ">=", start)
        .where("openedAt", "<=", end)
        .get();

      let totalSales = 0;
      let totalCollections = 0;
      let totalExpenses = 0;
      let totalIncomes = 0;

      boxesSnap.docs.forEach((d) => {
        const b = d.data();
        totalSales += Number(b.totalSales || 0);
        totalCollections += Number(b.totalCollections || 0);
        totalExpenses += Number(b.totalExpenses || 0);
        totalIncomes += Number(b.totalIncomes || 0);
        rows.push({
          boxId: d.id,
          userName: b.userName || "",
          unitId: b.unitId || "",
          status: b.status || "",
          totalSales: Number(b.totalSales || 0),
          totalCollections: Number(b.totalCollections || 0),
          totalExpenses: Number(b.totalExpenses || 0),
          totalIncomes: Number(b.totalIncomes || 0),
        });
      });

      summary = {
        boxes: boxesSnap.size,
        totalSalesCents: totalSales,
        totalCollectionsCents: totalCollections,
        totalExpensesCents: totalExpenses,
        totalIncomesCents: totalIncomes,
        range: { start: start.toISOString(), end: end.toISOString() },
      };
    } else if (type === "box_day") {
      const day = job.params?.date ? String(job.params.date) : new Date().toISOString().slice(0, 10);
      const start = new Date(`${day}T00:00:00`);
      const end = new Date(`${day}T23:59:59`);
      const boxesSnap = await adminDb
        .collection("boxes")
        .where("tenantId", "==", tenantId)
        .where("openedAt", ">=", start)
        .where("openedAt", "<=", end)
        .get();

      rows = boxesSnap.docs.map((d) => {
        const b = d.data();
        return {
          boxId: d.id,
          userName: b.userName || "",
          unitId: b.unitId || "",
          status: b.status || "",
          finalAmount: Number(b.finalAmount || 0),
        };
      });
      summary = { date: day, boxes: rows.length };
    }

    // CSV simples (centavos como inteiros) — download via data URL no client
    const headers = rows.length > 0 ? Object.keys(rows[0]) : ["empty"];
    const csvLines = [
      headers.join(","),
      ...rows.map((row) => headers.map((h) => JSON.stringify(row[h] ?? "")).join(",")),
    ];
    const csv = csvLines.join("\n");
    const csvBase64 = Buffer.from(csv, "utf8").toString("base64");

    await ref.set(
      {
        status: "completed" satisfies ReportJobStatus,
        completedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        result: {
          format: "csv",
          fileName: `${type}_${tenantId}_${Date.now()}.csv`,
          summary,
          rowCount: rows.length,
          contentBase64: csvBase64,
        },
        error: FieldValue.delete(),
      },
      { merge: true }
    );
  } catch (err: any) {
    await ref.set(
      {
        status: "failed" satisfies ReportJobStatus,
        updatedAt: FieldValue.serverTimestamp(),
        error: err?.message || "Falha ao processar relatório",
      },
      { merge: true }
    );
  }
}

/** POST /api/reports/jobs — enfileira job assíncrono */
router.post("/jobs", async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Não autenticado." });

  if (!assertPermission(req.user, "reports", "exportExcel")) {
    // fallback: admin/supervisor/superadmin via assertPermission já cobre roles; collectors sem export
    return res.status(403).json({
      error: "Você não possui permissão para gerar relatórios.",
      code: "PERMISSION_DENIED",
    });
  }

  const type = String(req.body?.type || "") as ReportJobType;
  if (!ALLOWED_TYPES.includes(type)) {
    return res.status(400).json({
      error: `type inválido. Use: ${ALLOWED_TYPES.join(", ")}`,
    });
  }

  const { tenantId, uid: userId, email: userEmail } = req.user;
  const params = req.body?.params && typeof req.body.params === "object" ? req.body.params : {};

  try {
    const ref = adminDb.collection("report_jobs").doc();
    await ref.set({
      tenantId,
      userId,
      userEmail: userEmail || "",
      type,
      params,
      status: "queued" satisfies ReportJobStatus,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Processamento assíncrono (mesmo processo; não bloqueia a resposta)
    setImmediate(() => {
      void processReportJob(ref.id).catch((e) =>
        console.error("report job failed:", ref.id, e)
      );
    });

    return res.status(202).json({ success: true, jobId: ref.id, status: "queued" });
  } catch (error: any) {
    console.error("Erro POST /reports/jobs:", error);
    return res.status(500).json({ error: error.message || "Erro ao enfileirar relatório." });
  }
});

/** GET /api/reports/jobs — lista recente do tenant */
router.get("/jobs", async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Não autenticado." });

  if (!assertPermission(req.user, "reports", "viewDashboard")) {
    return res.status(403).json({ error: "Sem permissão para listar relatórios." });
  }

  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const snap = await adminDb
      .collection("report_jobs")
      .where("tenantId", "==", req.user.tenantId)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const jobs = snap.docs.map((d) => {
      const data = d.data();
      // Não devolver base64 na listagem (payload grande)
      const result = data.result
        ? {
            format: data.result.format,
            fileName: data.result.fileName,
            summary: data.result.summary,
            rowCount: data.result.rowCount,
          }
        : undefined;
      return { id: d.id, ...data, result };
    });

    return res.json({ jobs });
  } catch (error: any) {
    console.error("Erro GET /reports/jobs:", error);
    return res.status(500).json({ error: error.message || "Erro ao listar jobs." });
  }
});

/** GET /api/reports/jobs/:id — detalhe (inclui CSV base64 se completed) */
router.get("/jobs/:id", async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Não autenticado." });

  if (!assertPermission(req.user, "reports", "viewDashboard")) {
    return res.status(403).json({ error: "Sem permissão." });
  }

  try {
    const snap = await adminDb.collection("report_jobs").doc(String(req.params.id)).get();
    if (!snap.exists) return res.status(404).json({ error: "Job não encontrado." });
    const data = snap.data() || {};
    if (data.tenantId !== req.user.tenantId && !req.user.isSuperAdmin) {
      return res.status(403).json({ error: "Acesso negado." });
    }
    return res.json({ id: snap.id, ...data });
  } catch (error: any) {
    console.error("Erro GET /reports/jobs/:id:", error);
    return res.status(500).json({ error: error.message || "Erro ao buscar job." });
  }
});

export default router;
