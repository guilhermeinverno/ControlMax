import { describe, expect, it } from 'vitest';
import { parseFirestoreDate } from './financeMovements';

describe('parseFirestoreDate', () => {
  it('retorna Date para objeto com toDate', () => {
    const date = new Date('2026-01-15T10:00:00Z');
    const field = { toDate: () => date };
    expect(parseFirestoreDate(field)).toEqual(date);
  });

  it('retorna data atual para valor vazio', () => {
    const result = parseFirestoreDate(null);
    expect(result).toBeInstanceOf(Date);
  });
});
