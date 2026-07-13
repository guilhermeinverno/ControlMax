import { describe, expect, it } from 'vitest';
import {
  isAdminBypassEmail,
  mapRoleFromFirestore,
  resolveDefaultTenantId,
} from '../hooks/useTenantHelpers';

describe('useTenantHelpers', () => {
  it('identifica e-mails de bypass admin', () => {
    expect(isAdminBypassEmail('gringoeletronica@gmail.com')).toBe(true);
    expect(isAdminBypassEmail('qa@controlmax.dev')).toBe(true);
    expect(isAdminBypassEmail('outro@test.com')).toBe(false);
  });

  it('resolve tenant padrão por e-mail', () => {
    expect(resolveDefaultTenantId('legnotebooks@gmail.com', null)).toBe('leg_notebooks');
    expect(resolveDefaultTenantId('qa@controlmax.dev', null)).toBe('tenant_qa');
    expect(resolveDefaultTenantId('user@test.com', 'tenant_x')).toBe('tenant_x');
  });

  it('mapeia role admin do Firestore', () => {
    const mapped = mapRoleFromFirestore('admin', 'user@test.com');
    expect(mapped.role).toBe('admin');
  });
});
