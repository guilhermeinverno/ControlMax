import type { PermissionMatrix, PermissionModule } from '../types/rbac';

export function hasMatrixPermission(
  matrix: PermissionMatrix | null | undefined,
  module: PermissionModule,
  action: string
): boolean {
  if (!matrix) return false;
  const mod = matrix[module] as unknown as Record<string, boolean> | undefined;
  if (!mod) return false;
  return mod[action] === true;
}
