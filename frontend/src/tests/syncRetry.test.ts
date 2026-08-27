import { beforeEach, describe, expect, it } from 'vitest';
import { isRetryableSyncError, MAX_SYNC_RETRIES } from '../utils/sync/syncRetry';

describe('ENT-05 isRetryableSyncError', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { onLine: true },
    });
  });

  it('trata falhas de rede como retryáveis', () => {
    expect(isRetryableSyncError(new Error('Failed to fetch'))).toBe(true);
    expect(isRetryableSyncError(new Error('NetworkError when attempting to fetch'))).toBe(true);
    const abort = new Error('The operation was aborted');
    abort.name = 'AbortError';
    expect(isRetryableSyncError(abort)).toBe(true);
  });

  it('trata HTTP 5xx / 408 / 429 como retryáveis', () => {
    expect(isRetryableSyncError(new Error('HTTP 500: Server Error'))).toBe(true);
    expect(isRetryableSyncError(new Error('HTTP 503: Unavailable'))).toBe(true);
    expect(isRetryableSyncError(new Error('HTTP 429: Too Many Requests'))).toBe(true);
    expect(isRetryableSyncError(new Error('HTTP 408: Timeout'))).toBe(true);
  });

  it('não retenta 4xx de cliente (exceto 408/429)', () => {
    expect(isRetryableSyncError(new Error('HTTP 400: Bad Request'))).toBe(false);
    expect(isRetryableSyncError(new Error('HTTP 409: Conflict'))).toBe(false);
    expect(isRetryableSyncError(new Error('HTTP 403: Forbidden'))).toBe(false);
    expect(isRetryableSyncError(new Error('Validation Error: amountCents'))).toBe(false);
  });

  it('exporta teto de retries', () => {
    expect(MAX_SYNC_RETRIES).toBeGreaterThanOrEqual(3);
  });
});
