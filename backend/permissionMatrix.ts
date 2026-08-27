/**
 * Espelho tipado da PermissionMatrix no backend (sem dependência do frontend).
 */

export interface PermissionMatrix {
  sales: { read: boolean; create: boolean; update: boolean; cancel: boolean };
  collections: { read: boolean; create: boolean; confirm: boolean };
  boxes: { read: boolean; open: boolean; close: boolean; viewSummary: boolean };
  customers: { read: boolean; create: boolean; edit: boolean; delete: boolean };
  reports: { viewDashboard: boolean; exportExcel: boolean };
  platform: { manageSettings: boolean; manageUsers: boolean; manageRoles: boolean };
}

export type PermissionModule = keyof PermissionMatrix;

export function emptyPermissionMatrix(): PermissionMatrix {
  return {
    sales: { read: false, create: false, update: false, cancel: false },
    collections: { read: false, create: false, confirm: false },
    boxes: { read: false, open: false, close: false, viewSummary: false },
    customers: { read: false, create: false, edit: false, delete: false },
    reports: { viewDashboard: false, exportExcel: false },
    platform: { manageSettings: false, manageUsers: false, manageRoles: false },
  };
}

export function fullPermissionMatrix(): PermissionMatrix {
  return {
    sales: { read: true, create: true, update: true, cancel: true },
    collections: { read: true, create: true, confirm: true },
    boxes: { read: true, open: true, close: true, viewSummary: true },
    customers: { read: true, create: true, edit: true, delete: true },
    reports: { viewDashboard: true, exportExcel: true },
    platform: { manageSettings: true, manageUsers: true, manageRoles: true },
  };
}

export function mergePermissionMatrix(raw: unknown): PermissionMatrix {
  const base = emptyPermissionMatrix();
  if (!raw || typeof raw !== "object") return base;
  const src = raw as Record<string, Record<string, boolean>>;
  (Object.keys(base) as PermissionModule[]).forEach((mod) => {
    const modSrc = src[mod];
    if (!modSrc || typeof modSrc !== "object") return;
    (Object.keys(base[mod]) as string[]).forEach((action) => {
      if (typeof modSrc[action] === "boolean") {
        (base[mod] as Record<string, boolean>)[action] = modSrc[action];
      }
    });
  });
  return base;
}

export function hasMatrixPermission(
  matrix: PermissionMatrix | undefined | null,
  module: PermissionModule,
  action: string
): boolean {
  if (!matrix) return false;
  const mod = matrix[module] as Record<string, boolean> | undefined;
  if (!mod) return false;
  return mod[action] === true;
}

export function defaultSystemRoleTemplates(tenantId: string) {
  const now = new Date().toISOString();
  const collectorPerms = emptyPermissionMatrix();
  collectorPerms.sales = { read: true, create: true, update: false, cancel: false };
  collectorPerms.collections = { read: true, create: true, confirm: false };
  collectorPerms.boxes = { read: true, open: true, close: true, viewSummary: false };
  collectorPerms.customers = { read: true, create: true, edit: false, delete: false };
  collectorPerms.reports = { viewDashboard: true, exportExcel: false };

  const supervisorPerms = fullPermissionMatrix();
  supervisorPerms.platform = {
    manageSettings: false,
    manageUsers: true,
    manageRoles: false,
  };

  return [
    {
      tenantId,
      name: "Administrador",
      description: "Acesso total ao tenant (perfil de sistema).",
      isSystemRole: true,
      legacyRole: "admin",
      permissions: fullPermissionMatrix(),
      createdAt: now,
      updatedAt: now,
    },
    {
      tenantId,
      name: "Supervisor",
      description: "Operação e usuários; sem gestão de roles/plataforma.",
      isSystemRole: true,
      legacyRole: "supervisor",
      permissions: supervisorPerms,
      createdAt: now,
      updatedAt: now,
    },
    {
      tenantId,
      name: "Cobrador",
      description: "Campo: vendas, cobranças e caixa próprios.",
      isSystemRole: true,
      legacyRole: "collector",
      permissions: collectorPerms,
      createdAt: now,
      updatedAt: now,
    },
  ];
}
