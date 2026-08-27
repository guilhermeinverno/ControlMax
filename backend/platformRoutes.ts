import { Router, Response } from "express";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, AuthenticatedRequest } from "./authMiddleware";
import { assertPermission } from "./roleRoutes";
import { logAuditEvent } from "./services/auditService";

const router = Router();

/** PUT /api/platform/settings — configurações do tenant com auditoria */
router.put("/settings", async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Não autenticado." });

  if (!assertPermission(req.user, "platform", "manageSettings")) {
    return res.status(403).json({
      error: "Você não possui permissão para editar este registro.",
      code: "PERMISSION_DENIED",
    });
  }

  const { tenantId, uid: userId, email: userEmail } = req.user;
  const settings = req.body?.settings && typeof req.body.settings === "object" ? req.body.settings : req.body;
  if (!settings || typeof settings !== "object") {
    return res.status(400).json({ error: "Payload de settings inválido." });
  }

  try {
    const ref = adminDb.collection("platform_settings").doc(tenantId);
    const snap = await ref.get();
    const oldData = (snap.exists ? snap.data() : {}) || {};

    const payload = {
      ...(settings as Record<string, unknown>),
      tenantId,
      updatedAt: FieldValue.serverTimestamp(),
    };

    await ref.set(payload, { merge: true });

    if (settings.platformName) {
      await adminDb
        .collection("tenants")
        .doc(tenantId)
        .set({ name: String(settings.platformName) }, { merge: true })
        .catch(() => undefined);
    }

    const newSnap = await ref.get();
    const newData = newSnap.data() || {};

    await logAuditEvent({
      tenantId,
      userId,
      userEmail: userEmail || "",
      action: "UPDATE",
      entity: "platform_settings",
      entityId: tenantId,
      oldData: oldData as Record<string, unknown>,
      newData: newData as Record<string, unknown>,
      reason: req.body?.reason ? String(req.body.reason) : "Atualização de configuração da plataforma",
    });

    return res.json({ success: true, settings: newData });
  } catch (error: any) {
    console.error("Erro PUT /platform/settings:", error);
    return res.status(500).json({ error: error.message || "Erro ao salvar configurações." });
  }
});

export default router;
