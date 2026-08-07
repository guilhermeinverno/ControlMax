import { User } from 'firebase/auth';
import { UserRole } from '../types';
import {
  mapRoleFromFirestore,
  resolveDefaultTenantId,
} from './useTenantHelpers';

export interface TenantSetters {
  setTenantId: (v: string) => void;
  setRole: (v: UserRole) => void;
  setUserName: (v: string) => void;
  setIsSuperAdmin: (v: boolean) => void;
  setLoading: (v: boolean) => void;
  setError: (v: string | null) => void;
  setUserId: (v: string) => void;
  setUsuarioUnidades: (v: string[]) => void;
  setPermissions: (v: any) => void;
}

export function applyExistingUserDoc(
  user: User,
  emailLower: string,
  data: Record<string, unknown>,
  setters: TenantSetters
): void {
  const impersonated = data.isSuperAdmin ? localStorage.getItem('controlmax_impersonated_tenant') : null;
  const { role: userRole, isSuperAdmin: isSuper } = mapRoleFromFirestore(
    data.role,
    emailLower,
    data.isSuperAdmin as boolean | undefined
  );

  setters.setTenantId(
    impersonated || String(data.tenantId || '') || resolveDefaultTenantId(emailLower, impersonated)
  );
  setters.setIsSuperAdmin(isSuper);
  setters.setRole(userRole);
  setters.setUserName(
    impersonated
      ? `Super Admin (${impersonated})`
      : String(data.userName || data.name || user.displayName || user.email?.split('@')[0] || '')
  );
  setters.setUserId(user.uid);
  
  // Resolve units
  const rawUnits = data.usuario_unidades || data.usuarioUnidades || [];
  const resolvedUnits = Array.isArray(rawUnits) ? rawUnits : [];
  setters.setUsuarioUnidades(resolvedUnits);

  // Resolve permissions
  const rawPermissions = data.permissions || {};
  setters.setPermissions(rawPermissions);

  setters.setError(null);
  setters.setLoading(false);
}

export function applyGuestState(
  user: User,
  emailLower: string,
  _hasAdminBypass: boolean,
  setters: TenantSetters
): void {
  setters.setTenantId(resolveDefaultTenantId(emailLower, null));
  setters.setRole('collector');
  setters.setIsSuperAdmin(false);
  setters.setUserName(user.displayName || user.email?.split('@')[0] || '');
  setters.setUserId(user.uid);
  setters.setUsuarioUnidades([]);
  setters.setPermissions({});
  setters.setError(null);
  setters.setLoading(false);
}

