export interface UserWithPermissions {
  role: string;
  permissions?: Record<string, boolean> | string[] | any;
}

/**
 * Checks if a given user has a specific permission.
 * - Gerente and Supervisor with permission are allowed critical operations (like confirming boxes).
 * - Fallbacks are provided to ensure default access for standard actions.
 */
export function hasPermission(
  user: UserWithPermissions | null | undefined,
  permission: string
): boolean {
  if (!user) return false;

  const roleLower = String(user.role || '').toLowerCase();

  // Roles that correspond to Managers or Supervisors
  const isManagerOrSupervisor =
    roleLower === 'admin' ||
    roleLower === 'gerente' ||
    roleLower === 'supervisor' ||
    roleLower === 'director' ||
    roleLower === 'coordinador';

  // Explicit permission check from the permissions object/array (JSONB style)
  if (user.permissions) {
    if (Array.isArray(user.permissions)) {
      if (user.permissions.includes(permission)) return true;
    } else if (typeof user.permissions === 'object') {
      if (user.permissions[permission] === true) return true;
    }
  }

  // Ações críticas (ex: 'caja:confirmar' ou 'caja:auditar')
  if (permission === 'caja:confirmar' || permission === 'caja:auditar') {
    // Only 'Gerente' or 'Supervisor' (which in our system are admin/supervisor) with explicit or role default
    return isManagerOrSupervisor;
  }

  // Operadores e Cobradores comuns só podem visualizar, abrir e fechar os caixas
  if (
    permission === 'caja:visualizar' ||
    permission === 'caja:abrir' ||
    permission === 'caja:fechar' ||
    permission === 'caja:operar'
  ) {
    return true;
  }

  return false;
}
