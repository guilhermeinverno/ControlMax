import { Router, Response } from "express";
import { adminDb, adminAuth, AuthenticatedRequest } from "./authMiddleware";
import { FieldValue } from "firebase-admin/firestore";
import { syncUserCustomClaims } from "./customClaims";
import { logAuditEvent } from "./services/auditService";
import { assertPermission } from "./roleRoutes";
import { parseMonthlyPriceCents } from "./saasBillingRoutes";

const router = Router();

// POST /api/admin/users - Criação/Atualização administrativa de usuários via Admin SDK
router.post("/users", async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Não autenticado." });

  const operator = req.user;
  const isSuper = operator.isSuperAdmin === true || operator.role === "superadmin";
  const isAdmin = operator.role === "admin";

  if (!isSuper && !isAdmin) {
    return res.status(403).json({ error: "Acesso negado: Apenas administradores podem gerenciar usuários." });
  }

  const {
    email,
    password,
    name,
    role,
    roleId,
    tenantId: reqTenantId,
    active,
    usuario_unidades,
    permissions,
    phone,
    document,
  } = req.body;

  if (!email) {
    return res.status(400).json({ error: "O e-mail é obrigatório." });
  }

  const emailLower = String(email).trim().toLowerCase();
  const targetTenantId = isSuper ? (reqTenantId || operator.tenantId) : operator.tenantId;

  if (!targetTenantId) {
    return res.status(400).json({ error: "tenantId é obrigatório." });
  }

  // Admins de tenant não podem criar admins/superadmins nem conceder isSuperAdmin
  let targetRole = role || "collector";
  let targetIsSuper = false;

  if (!isSuper) {
    if (["admin", "superadmin"].includes(String(targetRole).toLowerCase())) {
      return res.status(403).json({ error: "Admins de tenant não podem criar ou promover usuários para papéis administrativos." });
    }
  } else {
    if (req.body.isSuperAdmin === true || String(role).toLowerCase() === "superadmin") {
      targetIsSuper = true;
      targetRole = "superadmin";
    }
  }

  try {
    let uid: string;
    try {
      const existingAuthUser = await adminAuth.getUserByEmail(emailLower);
      uid = existingAuthUser.uid;
    } catch {
      // Se não existir, criar usuário no Auth se senha fornecida ou aleatória
      const newAuthUser = await adminAuth.createUser({
        email: emailLower,
        password: password || Math.random().toString(36).slice(-10) + "A1!",
        displayName: name || emailLower.split("@")[0],
      });
      uid = newAuthUser.uid;
    }

    const userDocRef = adminDb.collection("users").doc(uid);

    let matrixPermissions = permissions || {};
    if (roleId) {
      try {
        const roleSnap = await adminDb.collection("tenant_roles").doc(String(roleId)).get();
        if (roleSnap.exists) {
          const roleData = roleSnap.data() || {};
          if (roleData.tenantId === targetTenantId || isSuper) {
            matrixPermissions = roleData.permissions || matrixPermissions;
            if (roleData.legacyRole) {
              targetRole = String(roleData.legacyRole);
            }
          }
        }
      } catch (roleErr) {
        console.error("Falha ao resolver roleId no create user:", roleErr);
      }
    }

    if (!isSuper && ["admin", "superadmin"].includes(String(targetRole).toLowerCase())) {
      return res.status(403).json({
        error: "Admins de tenant não podem criar ou promover usuários para papéis administrativos.",
      });
    }

    const userPayload = {
      uid,
      email: emailLower,
      name: name || emailLower.split("@")[0],
      userName: name || emailLower.split("@")[0],
      role: targetRole,
      roleId: roleId ? String(roleId) : "",
      tenantId: targetTenantId,
      active: active !== undefined ? Boolean(active) : true,
      isSuperAdmin: targetIsSuper,
      usuario_unidades: Array.isArray(usuario_unidades) ? usuario_unidades : [],
      permissions: matrixPermissions,
      phone: phone || "",
      document: document || "",
      updatedAt: FieldValue.serverTimestamp(),
    };

    await userDocRef.set(userPayload, { merge: true });

    // AUTH-01: sincroniza Custom Claims (role/tenantId) — fonte de verdade do BFF
    try {
      await syncUserCustomClaims(uid, {
        role: targetRole,
        tenantId: targetTenantId,
        isSuperAdmin: targetIsSuper,
      });
    } catch (claimsErr) {
      console.error("Falha ao sincronizar Custom Claims (usuário salvo no Firestore):", claimsErr);
    }

    return res.status(201).json({
      success: true,
      uid,
      user: { ...userPayload, id: uid },
      claimsSynced: true,
    });
  } catch (error: any) {
    console.error("Erro na criação administrativa de usuário:", error);
    return res.status(500).json({ error: error.message || "Erro ao criar usuário via backend." });
  }
});

/** PUT /api/admin/users/:id — atualização administrativa com auditoria */
router.put("/users/:id", async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Não autenticado." });

  const operator = req.user;
  const isSuper = operator.isSuperAdmin === true || operator.role === "superadmin";
  const canManage =
    isSuper ||
    operator.role === "admin" ||
    assertPermission(operator, "platform", "manageUsers");

  if (!canManage) {
    return res.status(403).json({
      error: "Você não possui permissão para editar este registro.",
      code: "PERMISSION_DENIED",
    });
  }

  const targetUid = String(req.params.id || "");
  if (!targetUid) return res.status(400).json({ error: "id inválido." });

  try {
    const userDocRef = adminDb.collection("users").doc(targetUid);
    const snap = await userDocRef.get();
    if (!snap.exists) return res.status(404).json({ error: "Usuário não encontrado." });

    const oldData = snap.data() || {};
    if (oldData.tenantId !== operator.tenantId && !isSuper) {
      return res.status(403).json({ error: "Acesso negado: usuário de outro tenant." });
    }

    const allowed = [
      "name",
      "userName",
      "role",
      "roleId",
      "active",
      "usuario_unidades",
      "permissions",
      "phone",
      "document",
    ] as const;

    const patch: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
    for (const field of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, field)) {
        if (field === "usuario_unidades") {
          patch.usuario_unidades = Array.isArray(req.body.usuario_unidades)
            ? req.body.usuario_unidades.map((id: unknown) => String(id)).filter(Boolean)
            : [];
        } else {
          patch[field] = req.body[field];
        }
      }
    }

    if (patch.roleId) {
      const roleSnap = await adminDb.collection("tenant_roles").doc(String(patch.roleId)).get();
      if (roleSnap.exists) {
        const roleData = roleSnap.data() || {};
        if (roleData.tenantId === (oldData.tenantId || operator.tenantId) || isSuper) {
          patch.permissions = roleData.permissions || patch.permissions;
          if (roleData.legacyRole) patch.role = roleData.legacyRole;
        }
      }
    }

    if (!isSuper && ["admin", "superadmin"].includes(String(patch.role || "").toLowerCase())) {
      return res.status(403).json({
        error: "Admins de tenant não podem promover usuários a papéis administrativos.",
      });
    }

    await userDocRef.set(patch, { merge: true });
    const newSnap = await userDocRef.get();
    const newData = newSnap.data() || {};

    try {
      await syncUserCustomClaims(targetUid, {
        role: String(newData.role || "collector"),
        tenantId: String(newData.tenantId || operator.tenantId),
        isSuperAdmin: newData.isSuperAdmin === true,
      });
    } catch (claimsErr) {
      console.error("Falha claims no PUT users:", claimsErr);
    }

    await logAuditEvent({
      tenantId: String(newData.tenantId || operator.tenantId),
      userId: operator.uid,
      userEmail: operator.email || "",
      action: "UPDATE",
      entity: "users",
      entityId: targetUid,
      oldData: oldData as Record<string, unknown>,
      newData: newData as Record<string, unknown>,
      reason: req.body?.reason ? String(req.body.reason) : "Atualização administrativa de usuário",
    });

    return res.json({ success: true, uid: targetUid, user: { id: targetUid, ...newData } });
  } catch (error: any) {
    console.error("Erro PUT /admin/users:", error);
    return res.status(500).json({ error: error.message || "Erro ao atualizar usuário." });
  }
});

// POST /api/admin/tenants - Criação de Inquilinos (SuperAdmin apenas)
router.post("/tenants", async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Não autenticado." });

  const operator = req.user;
  const isSuper = operator.isSuperAdmin === true || operator.role === "superadmin";

  if (!isSuper) {
    return res.status(403).json({ error: "Acesso negado: Apenas SuperAdmins podem criar tenants." });
  }

  const { tenantId, name, ownerName, plan, active, monthlyPrice, monthlyPriceCents, billingStatus, billingMethod } =
    req.body;

  if (!tenantId || !name) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes (tenantId, name)." });
  }

  const cleanTenantId = String(tenantId).trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");

  try {
    const priceCents =
      parseMonthlyPriceCents(monthlyPriceCents ?? monthlyPrice) ?? 19900;
    const status = ["active", "past_due", "suspended"].includes(String(billingStatus || ""))
      ? String(billingStatus)
      : "active";
    const method = ["pix", "boleto", "contrato"].includes(String(billingMethod || ""))
      ? String(billingMethod)
      : "pix";

    const tenantDocRef = adminDb.collection("tenants").doc(cleanTenantId);
    const tenantPayload = {
      id: cleanTenantId,
      name: name.trim(),
      ownerName: ownerName || name.trim(),
      plan: plan || "Completo",
      active: active !== undefined ? Boolean(active) : true,
      monthlyPrice: priceCents,
      billingStatus: status,
      billingMethod: method,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await tenantDocRef.set(tenantPayload, { merge: true });

    return res.status(201).json({
      success: true,
      tenantId: cleanTenantId,
      tenant: tenantPayload,
    });
  } catch (error: any) {
    console.error("Erro na criação de tenant:", error);
    return res.status(500).json({ error: error.message || "Erro ao criar tenant." });
  }
});

function canManageBlacklist(role: string, isSuperAdmin?: boolean): boolean {
  if (isSuperAdmin) return true;
  const r = String(role || "").toLowerCase();
  return ["admin", "supervisor", "gerente", "director", "coordinador", "superadmin"].includes(r);
}

/** P1-01 — adicionar cliente à lista negra */
router.post("/blacklist", async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Não autenticado." });

  const { tenantId, uid, name, role, isSuperAdmin } = req.user;
  if (!canManageBlacklist(role, isSuperAdmin)) {
    return res.status(403).json({ error: "Acesso negado." });
  }

  const { clientId, clientName, docNumber, reason } = req.body;
  if (!clientId) {
    return res.status(400).json({ error: "clientId é obrigatório." });
  }

  try {
    const existing = await adminDb
      .collection("customer_blacklist")
      .where("tenantId", "==", tenantId)
      .where("clientId", "==", String(clientId))
      .where("active", "==", true)
      .limit(1)
      .get();

    if (!existing.empty) {
      return res.status(409).json({ error: "Cliente já está na lista negra.", id: existing.docs[0].id });
    }

    const ref = adminDb.collection("customer_blacklist").doc();
    const payload = {
      tenantId,
      clientId: String(clientId),
      clientName: String(clientName || ""),
      docNumber: String(docNumber || ""),
      reason: String(reason || "").trim(),
      active: true,
      createdBy: uid,
      createdByName: name || "",
      createdAt: FieldValue.serverTimestamp(),
    };
    await ref.set(payload);

    return res.status(201).json({ success: true, id: ref.id, entry: payload });
  } catch (error: any) {
    console.error("Erro blacklist add:", error);
    return res.status(500).json({ error: error.message || "Erro ao adicionar à lista negra." });
  }
});

/** P1-01 — remover (desativar) da lista negra */
router.post("/blacklist/remove", async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Não autenticado." });

  const { tenantId, uid, name, role, isSuperAdmin } = req.user;
  if (!canManageBlacklist(role, isSuperAdmin)) {
    return res.status(403).json({ error: "Acesso negado." });
  }

  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "id é obrigatório." });

  try {
    const ref = adminDb.collection("customer_blacklist").doc(String(id));
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "Registro não encontrado." });
    const data = snap.data() || {};
    if (data.tenantId !== tenantId && !isSuperAdmin) {
      return res.status(403).json({ error: "Acesso negado: outro tenant." });
    }

    await ref.update({
      active: false,
      removedBy: uid,
      removedByName: name || "",
      removedAt: FieldValue.serverTimestamp(),
    });

    return res.json({ success: true, id });
  } catch (error: any) {
    console.error("Erro blacklist remove:", error);
    return res.status(500).json({ error: error.message || "Erro ao remover da lista negra." });
  }
});

export default router;
