import { describe, expect, it } from 'vitest';
import { resolveOperationalUnit } from './resolveOperationalUnit';

describe('resolveOperationalUnit', () => {
  it('exige tenantId', () => {
    const result = resolveOperationalUnit({});
    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.error).toMatch(/tenant/i);
  });

  it('prioriza caixa aberta', () => {
    const result = resolveOperationalUnit({
      tenantId: 't1',
      activeBox: { id: 'b1', unitId: 'U-01', unitName: 'Rota 1', cnId: 'CN-1' },
      usuarioUnidades: ['U-99'],
      selectedUnitId: 'U-88',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.context.unitId).toBe('U-01');
      expect(result.context.boxId).toBe('b1');
      expect(result.context.cnId).toBe('CN-1');
    }
  });

  it('usa seletor global quando não há caixa', () => {
    const result = resolveOperationalUnit({
      tenantId: 't1',
      selectedUnitId: 'U-02',
      selectedCnId: 'CN-2',
      usuarioUnidades: ['U-02', 'U-03'],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.context.unitId).toBe('U-02');
      expect(result.context.cnId).toBe('CN-2');
    }
  });

  it('usa única unidade atribuída', () => {
    const result = resolveOperationalUnit({
      tenantId: 't1',
      usuarioUnidades: ['U-05'],
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.context.unitId).toBe('U-05');
  });

  it('bloqueia múltiplas unidades sem seleção', () => {
    const result = resolveOperationalUnit({
      tenantId: 't1',
      usuarioUnidades: ['U-01', 'U-02'],
    });
    expect(result.ok).toBe(false);
  });

  it('bloqueia ausência total de unidade', () => {
    const result = resolveOperationalUnit({ tenantId: 't1' });
    expect(result.ok).toBe(false);
  });
});
