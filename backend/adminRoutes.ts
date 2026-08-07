import { Router, Response } from "express";
import { adminDb, adminAuth, AuthenticatedRequest } from "./authMiddleware";
import { FieldValue } from "firebase-admin/firestore";

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

    const userPayload = {
      uid,
      email: emailLower,
      name: name || emailLower.split("@")[0],
      userName: name || emailLower.split("@")[0],
      role: targetRole,
      tenantId: targetTenantId,
      active: active !== undefined ? Boolean(active) : true,
      isSuperAdmin: targetIsSuper,
      usuario_unidades: Array.isArray(usuario_unidades) ? usuario_unidades : [],
      permissions: permissions || {},
      phone: phone || "",
      document: document || "",
      updatedAt: FieldValue.serverTimestamp(),
    };

    await userDocRef.set(userPayload, { merge: true });

    return res.status(201).json({
      success: true,
      uid,
      user: { ...userPayload, id: uid },
    });
  } catch (error: any) {
    console.error("Erro na criação administrativa de usuário:", error);
    return res.status(500).json({ error: error.message || "Erro ao criar usuário via backend." });
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

  const { tenantId, name, ownerName, plan, active } = req.body;

  if (!tenantId || !name) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes (tenantId, name)." });
  }

  const cleanTenantId = String(tenantId).trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");

  try {
    const tenantDocRef = adminDb.collection("tenants").doc(cleanTenantId);
    const tenantPayload = {
      id: cleanTenantId,
      name: name.trim(),
      ownerName: ownerName || name.trim(),
      plan: plan || "pro",
      active: active !== undefined ? Boolean(active) : true,
      createdAt: FieldValue.serverTimestamp(),
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

export default router;
