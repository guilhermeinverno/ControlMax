/**
 * RBAC dinâmico — matriz de permissões por módulo (ControlMax).
 * Coleção Firestore: `tenant_roles` (sempre filtrar por tenantId).
 */

export interface SalesPermissions {
  read: boolean;
  create: boolean;
  update: boolean;
  cancel: boolean;
}

export interface CollectionsPermissions {
  read: boolean;
  create: boolean;
  confirm: boolean;
}

export interface BoxesPermissions {
  read: boolean;
  open: boolean;
  close: boolean;
  viewSummary: boolean;
}

export interface CustomersPermissions {
  read: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export interface ReportsPermissions {
  viewDashboard: boolean;
  exportExcel: boolean;
}

export interface PlatformPermissions {
  manageSettings: boolean;
  manageUsers: boolean;
  manageRoles: boolean;
}

export interface PermissionMatrix {
  sales: SalesPermissions;
  collections: CollectionsPermissions;
  boxes: BoxesPermissions;
  customers: CustomersPermissions;
  reports: ReportsPermissions;
  platform: PlatformPermissions;
}

export type PermissionModule = keyof PermissionMatrix;

export type PermissionAction<M extends PermissionModule> = keyof PermissionMatrix[M] & string;

export interface TenantRole {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  /** true para Admin / Supervisor / Collector padronizados */
  isSystemRole?: boolean;
  /** Código legado opcional (admin | supervisor | collector) */
  legacyRole?: string;
  permissions: PermissionMatrix;
  createdAt: string;
  updatedAt: string;
}

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

/** Perfis de sistema sugeridos na primeira carga do tenant. */
export function defaultSystemRoleTemplates(tenantId: string): Omit<TenantRole, 'id'>[] {
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
      name: 'Administrador',
      description: 'Acesso total ao tenant (perfil de sistema).',
      isSystemRole: true,
      legacyRole: 'admin',
      permissions: fullPermissionMatrix(),
      createdAt: now,
      updatedAt: now,
    },
    {
      tenantId,
      name: 'Supervisor',
      description: 'Operação e usuários; sem gestão de roles/plataforma.',
      isSystemRole: true,
      legacyRole: 'supervisor',
      permissions: supervisorPerms,
      createdAt: now,
      updatedAt: now,
    },
    {
      tenantId,
      name: 'Cobrador',
      description: 'Campo: vendas, cobranças e caixa próprios.',
      isSystemRole: true,
      legacyRole: 'collector',
      permissions: collectorPerms,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

/** Labels da matriz para a UI de gestão. */
export const PERMISSION_MATRIX_LABELS: {
  module: PermissionModule;
  title: string;
  actions: Array<{ key: string; label: string }>;
}[] = [
  {
    module: 'sales',
    title: 'Ventas',
    actions: [
      { key: 'read', label: 'Ler' },
      { key: 'create', label: 'Criar' },
      { key: 'update', label: 'Editar' },
      { key: 'cancel', label: 'Cancelar' },
    ],
  },
  {
    module: 'collections',
    title: 'Cobranças',
    actions: [
      { key: 'read', label: 'Ler' },
      { key: 'create', label: 'Registrar' },
      { key: 'confirm', label: 'Confirmar' },
    ],
  },
  {
    module: 'boxes',
    title: 'Caixas',
    actions: [
      { key: 'read', label: 'Ler' },
      { key: 'open', label: 'Abrir' },
      { key: 'close', label: 'Fechar' },
      { key: 'viewSummary', label: 'Resumo' },
    ],
  },
  {
    module: 'customers',
    title: 'Clientes',
    actions: [
      { key: 'read', label: 'Ler' },
      { key: 'create', label: 'Criar' },
      { key: 'edit', label: 'Editar' },
      { key: 'delete', label: 'Excluir' },
    ],
  },
  {
    module: 'reports',
    title: 'Relatórios',
    actions: [
      { key: 'viewDashboard', label: 'Dashboard' },
      { key: 'exportExcel', label: 'Exportar Excel' },
    ],
  },
  {
    module: 'platform',
    title: 'Plataforma',
    actions: [
      { key: 'manageSettings', label: 'Configurações' },
      { key: 'manageUsers', label: 'Usuários' },
      { key: 'manageRoles', label: 'Perfis / Roles' },
    ],
  },
];
