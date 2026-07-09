import { describe, expect, it } from 'vitest';
import { selectValue } from './selectState';

describe('selectValue', () => {
  it('faz cast seguro para union de strings', () => {
    expect(selectValue<'a' | 'b'>('a')).toBe('a');
  });
});
