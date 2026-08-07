import { describe, expect, it } from 'vitest';
import {
  mapRoleFromFirestore,
  resolveDefaultTenantId,
} from '../hooks/useTenantHelpers';

describe('useTenantHelpers', () => {
  it('resolve tenant padrão por e-mail ou impersonated', () => {
    expect(resolveDefaultTenantId('user@test.com', 'tenant_x')).toBe('tenant_x');
    expect(resolveDefaultTenantId('user@test.com', null)).toBe('');
  });

  it('mapeia role admin do Firestore', () => {
    const mapped = mapRoleFromFirestore('admin', 'user@test.com');
    expect(mapped.role).toBe('admin');
    expect(mapped.isSuperAdmin).toBe(false);
  });

  it('mapeia role superadmin do Firestore', () => {
    const mapped = mapRoleFromFirestore('superadmin', 'user@test.com', true);
    expect(mapped.role).toBe('admin');
    expect(mapped.isSuperAdmin).toBe(true);
  });
});

