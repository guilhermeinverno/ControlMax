import { Router, Response } from "express";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, AuthenticatedRequest } from "./authMiddleware";
import { assertPermission } from "./roleRoutes";
import { logAuditEvent } from "./services/auditService";

const router = Router();

const CUSTOMER_EDITABLE_FIELDS = [
  "name",
  "apellidos",
  "secondName",
  "secondApellidos",
  "apodo",
  "email",
  "documentType",
  "documentNumber",
  "document2",
  "birthDate",
  "address",
  "barrio",
  "phone",
  "celularPrefix",
  "celular",
  "comentario",
  "actividadEconomica",
  "active",
  "latitude",
  "longitude",
] as const;

/** PUT /api/customers/:id — edição com auditoria */
router.put("/:id", async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Não autenticado." });

  if (!assertPermission(req.user, "customers", "edit")) {
    return res.status(403).json({
      error: "Você não possui permissão para editar este registro.",
      code: "PERMISSION_DENIED",
    });
  }

  const customerId = String(req.params.id || "");
  if (!customerId) return res.status(400).json({ error: "id inválido." });

  const { tenantId, uid: userId, email: userEmail } = req.user;
  const reason = req.body?.reason ? String(req.body.reason) : undefined;

  try {
    const ref = adminDb.collection("customers").doc(customerId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "Cliente não encontrado." });

    const oldData = snap.data() || {};
    if (oldData.tenantId !== tenantId && !req.user.isSuperAdmin) {
      return res.status(403).json({ error: "Acesso negado: cliente de outro tenant." });
    }

    const patch: Record<string, unknown> = {};
    for (const field of CUSTOMER_EDITABLE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, field)) {
        patch[field] = req.body[field];
      }
    }

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ error: "Nenhum campo editável informado." });
    }

    patch.updatedAt = FieldValue.serverTimestamp();
    await ref.update(patch);

    const newSnap = await ref.get();
    const newData = newSnap.data() || {};

    await logAuditEvent({
      tenantId,
      userId,
      userEmail: userEmail || "",
      action: "UPDATE",
      entity: "customers",
      entityId: customerId,
      oldData: oldData as Record<string, unknown>,
      newData: newData as Record<string, unknown>,
      reason,
    });

    return res.json({ success: true, id: customerId, customer: { id: customerId, ...newData } });
  } catch (error: any) {
    console.error("Erro PUT /customers:", error);
    return res.status(500).json({ error: error.message || "Erro ao atualizar cliente." });
  }
});

export default router;
