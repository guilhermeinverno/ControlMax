import { describe, expect, it } from 'vitest';
import { hasAdminAccess } from './operational';

describe('hasAdminAccess', () => {
  it('concede acesso para admin', () => {
    expect(hasAdminAccess('admin', false)).toBe(true);
  });

  it('concede acesso para superadmin via flag', () => {
    expect(hasAdminAccess('collector', true)).toBe(true);
  });

  it('nega acesso para collector sem flag superadmin', () => {
    expect(hasAdminAccess('collector', false)).toBe(false);
    expect(hasAdminAccess('supervisor', false)).toBe(false);
  });
});
