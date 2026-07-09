import { describe, expect, it } from 'vitest';
import { getErrorMessage } from './errorMessage';

describe('getErrorMessage', () => {
  it('retorna message de Error', () => {
    expect(getErrorMessage(new Error('falha'))).toBe('falha');
  });

  it('converte valores não-Error em string', () => {
    expect(getErrorMessage('texto')).toBe('texto');
  });
});
