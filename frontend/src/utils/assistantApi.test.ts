import { describe, expect, it } from 'vitest';
import { formatAssistantError } from './assistantApi';

describe('formatAssistantError', () => {
  it('returns abort message for AbortError', () => {
    const err = new DOMException('timeout', 'AbortError');
    const message = formatAssistantError(err, 'pt', 'fallback');
    expect(message).toContain('expirou');
  });

  it('returns fallback when error has no message', () => {
    expect(formatAssistantError(new Error(''), 'es', 'fallback')).toBe('fallback');
  });

  it('returns error message when available', () => {
    expect(formatAssistantError(new Error('falha na rede'), 'pt', 'fallback')).toBe('falha na rede');
  });
});
