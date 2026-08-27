import { Router, Response, NextFunction } from "express";
import { adminDb, AuthenticatedRequest } from "./authMiddleware";
import {
  defaultSystemRoleTemplates,
  emptyPermissionMatrix,
  fullPermissionMatrix,
  hasMatrixPermission,
  mergePermissionMatrix,
  PermissionModule,
  PermissionMatrix,
} from "./permissionMatrix";
import { logAuditEvent } from "./services/auditService";

const router = Router();

function canManageRoles(req: AuthenticatedRequest): boolean {
  const u = req.user;
  if (!u) return false;
  if (u.isSuperAdmin) return true;
  const role = String(u.role || "").toLowerCase();
  if (["admin", "superadmin"].includes(role)) return true;
  return hasMatrixPermission(u.permissions, "platform", "manageRoles");
}

function canListRoles(req: AuthenticatedRequest): boolean {
  if (canManageRoles(req)) return true;
  const u = req.user;
  if (!u) return false;
  if (u.isSuperAdmin) return true;
  // Gestores de usuários precisam listar roles no select
  if (hasMatrixPermission(u.permissions, "platform", "manageUsers")) return true;
  const role = String(u.role || "").toLowerCase();
  return ["admin", "supervisor", "gerente", "director", "coordinador"].includes(role);
}

async function ensureSystemRoles(tenantId: string): Promise<void> {
  const existing = await adminDb
    .collection("tenant_roles")
    .where("tenantId", "==", tenantId)
    .limit(1)
    .get();
  if (!existing.empty) return;

  const batch = adminDb.batch();
  for (const tpl of defaultSystemRoleTemplates(tenantId)) {
    const ref = adminDb.collection("tenant_roles").doc();
    batch.set(ref, { ...tpl, id: ref.id });
  }
  await batch.commit();
}

/** GET /api/admin/roles */
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Não autenticado." });
  if (!canListRoles(req)) {
    return res.status(403).json({ error: "Acesso negado: sem permissão para listar perfis." });
  }

  const { tenantId } = req.user;
  try {
    await ensureSystemRoles(tenantId);
    const snap = await adminDb
      .collection("tenant_roles")
      .where("tenantId", "==", tenantId)
      .get();

    const roles = snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          tenantId: data.tenantId,
          name: data.name,
          description: data.description || "",
          isSystemRole: Boolean(data.isSystemRole),
          legacyRole: data.legacyRole || "",
          permissions: mergePermissionMatrix(data.permissions),
          createdAt: data.createdAt || "",
          updatedAt: data.updatedAt || "",
        };
      })
      .sort((a, b) => String(a.name).localeCompare(String(b.name), "pt-BR"));

    return res.json({ success: true, roles });
  } catch (error: any) {
    console.error("Erro ao listar roles:", error);
    return res.status(500).json({ error: error.message || "Erro ao listar roles." });
  }
});

/** POST /api/admin/roles */
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Não autenticado." });
  if (!canManageRoles(req)) {
    return res.status(403).json({ error: "Acesso negado: sem permissão para gerenciar perfis." });
  }

  const { tenantId } = req.user;
  const { name, description, permissions, legacyRole } = req.body || {};

  if (!name || String(name).trim().length < 2) {
    return res.status(400).json({ error: "Nome do perfil é obrigatório (mín. 2 caracteres)." });
  }

  try {
    const now = new Date().toISOString();
    const ref = adminDb.collection("tenant_roles").doc();
    const payload = {
      id: ref.id,
      tenantId,
      name: String(name).trim(),
      description: String(description || "").trim(),
      isSystemRole: false,
      legacyRole: legacyRole ? String(legacyRole) : "",
      permissions: mergePermissionMatrix(permissions || emptyPermissionMatrix()),
      createdAt: now,
      updatedAt: now,
    };

    await ref.set(payload);
    return res.status(201).json({ success: true, role: payload });
  } catch (error: any) {
    console.error("Erro ao criar role:", error);
    return res.status(500).json({ error: error.message || "Erro ao criar role." });
  }
});

/** PUT /api/admin/roles/:id */
router.put("/:id", async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Não autenticado." });
  if (!canManageRoles(req)) {
    return res.status(403).json({ error: "Acesso negado: sem permissão para gerenciar perfis." });
  }

  const { tenantId } = req.user;
  const roleId = String(req.params.id || "");
  if (!roleId) return res.status(400).json({ error: "id inválido." });

  try {
    const ref = adminDb.collection("tenant_roles").doc(roleId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "Perfil não encontrado." });

    const data = snap.data() || {};
    if (data.tenantId !== tenantId && !req.user.isSuperAdmin) {
      return res.status(403).json({ error: "Acesso negado: perfil de outro tenant." });
    }

    const { name, description, permissions } = req.body || {};
    const update: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (trimmed.length < 2) {
        return res.status(400).json({ error: "Nome do perfil inválido." });
      }
      update.name = trimmed;
    }
    if (description !== undefined) {
      update.description = String(description).trim();
    }
    if (permissions !== undefined) {
      update.permissions = mergePermissionMatrix(permissions);
    }

    // Não permitir remover flag isSystemRole via update
    await ref.update(update);
    const updated = await ref.get();
    const out = updated.data() || {};

    await logAuditEvent({
      tenantId,
      userId: req.user.uid,
      userEmail: req.user.email || "",
      action: "UPDATE",
      entity: "roles",
      entityId: roleId,
      oldData: data as Record<string, unknown>,
      newData: out as Record<string, unknown>,
      reason: req.body?.reason ? String(req.body.reason) : "Atualização de perfil RBAC",
    });

    return res.json({
      success: true,
      role: {
        id: roleId,
        ...out,
        permissions: mergePermissionMatrix(out.permissions),
      },
    });
  } catch (error: any) {
    console.error("Erro ao atualizar role:", error);
    return res.status(500).json({ error: error.message || "Erro ao atualizar role." });
  }
});

/** DELETE /api/admin/roles/:id */
router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Não autenticado." });
  if (!canManageRoles(req)) {
    return res.status(403).json({ error: "Acesso negado: sem permissão para gerenciar perfis." });
  }

  const { tenantId } = req.user;
  const roleId = String(req.params.id || "");
  if (!roleId) return res.status(400).json({ error: "id inválido." });

  try {
    const ref = adminDb.collection("tenant_roles").doc(roleId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "Perfil não encontrado." });

    const data = snap.data() || {};
    if (data.tenantId !== tenantId && !req.user.isSuperAdmin) {
      return res.status(403).json({ error: "Acesso negado: perfil de outro tenant." });
    }
    if (data.isSystemRole === true) {
      return res.status(400).json({
        error: "Perfis de sistema não podem ser excluídos. Clone para customizar.",
      });
    }

    const linked = await adminDb
      .collection("users")
      .where("tenantId", "==", tenantId)
      .where("roleId", "==", roleId)
      .limit(1)
      .get();

    if (!linked.empty) {
      return res.status(409).json({
        error: "Há usuários vinculados a este perfil. Reatribua-os antes de excluir.",
      });
    }

    await ref.delete();
    return res.json({ success: true, id: roleId });
  } catch (error: any) {
    console.error("Erro ao excluir role:", error);
    return res.status(500).json({ error: error.message || "Erro ao excluir role." });
  }
});

export default router;

function legacyAllows(role: string, module: PermissionModule, action: string): boolean {
  const roleLower = String(role || "").toLowerCase();
  if (["admin", "superadmin"].includes(roleLower)) return true;
  if (["supervisor", "gerente", "director", "coordinador"].includes(roleLower)) {
    if (module === "platform" && action === "manageRoles") return false;
    if (module === "platform" && action === "manageSettings") return false;
    return true;
  }
  if (roleLower === "collector" || roleLower === "cajero") {
    const allowed: Record<string, string[]> = {
      sales: ["read", "create"],
      collections: ["read", "create"],
      boxes: ["read", "open", "close"],
      customers: ["read", "create"],
      reports: ["viewDashboard"],
    };
    return (allowed[module] || []).includes(action);
  }
  return false;
}

/**
 * Middleware factory: exige permissão na matriz (admin/superadmin bypass).
 * Uso: router.post('/sale', requirePermission('sales', 'create'), handler)
 */
export function requirePermission(module: PermissionModule, action: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const u = req.user;
    if (!u) {
      return res.status(401).json({ error: "Não autenticado." });
    }
    if (u.isSuperAdmin) return next();

    const role = String(u.role || "").toLowerCase();
    if (role === "admin" || role === "superadmin") return next();

    if (u.permissions && hasMatrixPermission(u.permissions as PermissionMatrix, module, action)) {
      return next();
    }

    // Sem matriz no req.user (ex.: testes ou middleware parcial): fallback legado
    if (!u.permissions && legacyAllows(role, module, action)) {
      return next();
    }

    return res.status(403).json({
      error: `Acesso negado: requer ${module}.${action}.`,
      code: "PERMISSION_DENIED",
      module,
      action,
    });
  };
}

/** Utilitário para handlers que já autenticaram. */
export function assertPermission(
  user: AuthenticatedRequest["user"],
  module: PermissionModule,
  action: string
): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  const role = String(user.role || "").toLowerCase();
  if (role === "admin" || role === "superadmin") return true;
  if (user.permissions && hasMatrixPermission(user.permissions, module, action)) return true;
  if (!user.permissions) return legacyAllows(role, module, action);
  return false;
}
