import { useCallback, useMemo } from 'react';
import { useTenant } from './useTenant';
import type { PermissionMatrix, PermissionModule } from '../types/rbac';
import { hasMatrixPermission } from '../utils/permissionMatrix';

/**
 * Hook de checagem RBAC dinâmico.
 * Admin / superadmin → sempre true.
 * Demais: PermissionMatrix do tenant (via useTenant.permissions quando estruturada).
 */
export function useHasPermission() {
  const { role, isSuperAdmin, permissions } = useTenant();

  const matrix = useMemo(() => {
    if (!permissions || typeof permissions !== 'object' || Array.isArray(permissions)) {
      return null;
    }
    const keys = Object.keys(permissions);
    if (keys.some((k) => ['sales', 'collections', 'boxes', 'customers', 'reports', 'platform'].includes(k))) {
      return permissions as PermissionMatrix;
    }
    return null;
  }, [permissions]);

  const can = useCallback(
    (module: PermissionModule, action: string): boolean => {
      if (isSuperAdmin) return true;
      const roleLower = String(role || '').toLowerCase();
      if (roleLower === 'admin' || roleLower === 'superadmin') return true;
      return hasMatrixPermission(matrix, module, action);
    },
    [isSuperAdmin, role, matrix]
  );

  return { can, matrix };
}
