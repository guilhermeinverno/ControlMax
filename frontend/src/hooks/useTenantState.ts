import { User } from 'firebase/auth';
import { UserRole } from '../types';
import {
  getAdminBypassConfig,
  isAdminBypassEmail,
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
}

export function applyExistingUserDoc(
  user: User,
  emailLower: string,
  data: Record<string, unknown>,
  setters: TenantSetters
): void {
  const impersonated =
    emailLower === 'maildojg@gmail.com' ? localStorage.getItem('controlmax_impersonated_tenant') : null;
  const hasAdminBypass = isAdminBypassEmail(emailLower);
  const { role: userRole, isSuperAdmin: isSuper } = mapRoleFromFirestore(
    data.role,
    emailLower,
    data.isSuperAdmin as boolean | undefined
  );

  setters.setTenantId(
    impersonated || String(data.tenantId || '') || resolveDefaultTenantId(emailLower, impersonated)
  );
  setters.setIsSuperAdmin(isSuper);
  setters.setRole(hasAdminBypass ? 'admin' : userRole);
  setters.setUserName(
    impersonated
      ? `Super Admin (${impersonated})`
      : String(data.userName || data.name || user.displayName || user.email?.split('@')[0] || '')
  );
  setters.setError(null);
  setters.setLoading(false);
}

export function applyBypassState(
  emailLower: string,
  setters: TenantSetters
): boolean {
  const bypass = getAdminBypassConfig(emailLower);
  if (!bypass) return false;

  setters.setTenantId(bypass.tenantId);
  setters.setRole(bypass.role);
  setters.setUserName(bypass.userName);
  setters.setIsSuperAdmin(bypass.isSuperAdmin);
  setters.setError(null);
  setters.setLoading(false);
  return true;
}

export function applyGuestState(
  user: User,
  emailLower: string,
  hasAdminBypass: boolean,
  setters: TenantSetters
): void {
  const impersonated =
    emailLower === 'maildojg@gmail.com' ? localStorage.getItem('controlmax_impersonated_tenant') : null;

  setters.setTenantId(resolveDefaultTenantId(emailLower, impersonated));
  setters.setRole(hasAdminBypass ? 'admin' : 'collector');
  setters.setIsSuperAdmin(emailLower === 'maildojg@gmail.com');
  setters.setUserName(
    impersonated ? `Super Admin (${impersonated})` : (user.displayName || user.email?.split('@')[0] || '')
  );
  setters.setError(null);
  setters.setLoading(false);
}
