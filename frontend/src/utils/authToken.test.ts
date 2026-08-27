import { describe, expect, it } from 'vitest';
import { CLAIMS_STALE_CODE, isClaimsStaleResponse } from '../utils/authToken';

describe('ENT-04 authToken helpers', () => {
  it('detecta CLAIMS_STALE em 401', () => {
    expect(isClaimsStaleResponse(401, { code: CLAIMS_STALE_CODE })).toBe(true);
    expect(isClaimsStaleResponse(401, { code: 'TOKEN_REVOKED' })).toBe(true);
    expect(isClaimsStaleResponse(401, { code: 'USER_DISABLED' })).toBe(true);
  });

  it('ignora outros status/códigos', () => {
    expect(isClaimsStaleResponse(403, { code: CLAIMS_STALE_CODE })).toBe(false);
    expect(isClaimsStaleResponse(401, { code: 'OTHER' })).toBe(false);
    expect(isClaimsStaleResponse(401, null)).toBe(false);
  });
});
