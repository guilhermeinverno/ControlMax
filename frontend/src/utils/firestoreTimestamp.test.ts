import { describe, expect, it } from 'vitest';
import { formatFirestoreDate, pickJsDate, toJsDate } from './firestoreTimestamp';

describe('toJsDate', () => {
  it('retorna fallback para null/undefined', () => {
    const fallback = new Date('2020-01-01');
    expect(toJsDate(null, fallback)).toBe(fallback);
    expect(toJsDate(undefined, fallback)).toBe(fallback);
  });

  it('converte Timestamp com toDate()', () => {
    const expected = new Date('2024-06-15T12:00:00Z');
    const ts = { toDate: () => expected };
    expect(toJsDate(ts)).toBe(expected);
  });

  it('converte objeto com seconds', () => {
    const ts = { seconds: 1_700_000_000 };
    expect(toJsDate(ts).getTime()).toBe(1_700_000_000_000);
  });
});

describe('pickJsDate', () => {
  it('retorna a primeira data válida', () => {
    const d = new Date('2023-05-01');
    expect(pickJsDate(null, undefined, d)).toBe(d);
  });
});

describe('formatFirestoreDate', () => {
  it('retorna string vazia para valor nulo', () => {
    expect(formatFirestoreDate(null, 'pt-BR')).toBe('');
  });

  it('formata data com locale', () => {
    const d = new Date('2024-01-15T15:30:00');
    const formatted = formatFirestoreDate(d, 'pt-BR', { dateStyle: 'short' });
    expect(formatted).toContain('2024');
  });
});
