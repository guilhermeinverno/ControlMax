import { describe, expect, it } from 'vitest';
import { pickUnitInCenter, resolveDefaultCnUnitSelection } from './businessCenterSelection';
import { incomeTypeLabel, isSaleIncomeType } from './incomeTypeLabels';
import { validateIncomeForm } from './incomeSave';

describe('businessCenterSelection', () => {
  it('seleciona primeira unidade do CN', () => {
    const selection = pickUnitInCenter({
      id: 'cn1',
      name: 'CN 1',
      linkedUnits: [{ id: 'u1', name: 'Unidade 1' }],
    });

    expect(selection).toEqual({ cnId: 'cn1', unitId: 'u1', unitName: 'Unidade 1' });
  });

  it('resolve CN padrão pelo activeBox', () => {
    const selection = resolveDefaultCnUnitSelection(
      [
        {
          id: 'cn1',
          name: 'CN 1',
          linkedUnits: [{ id: 'u1', name: 'Unidade 1' }],
        },
      ],
      { cnId: 'cn1', unitId: 'u1' },
    );

    expect(selection?.unitId).toBe('u1');
  });
});

describe('incomeTypeLabels', () => {
  it('traduz tipos conhecidos', () => {
    expect(incomeTypeLabel('venta')).toBe('Venta');
    expect(isSaleIncomeType('venda')).toBe(true);
  });
});

describe('validateIncomeForm', () => {
  it('exige caixa aberta', () => {
    expect(
      validateIncomeForm({
        tenantId: 't1',
        currentSelectedBox: null,
        incomeType: 'aportes',
        selectedSaleId: '',
        selectedSaleName: '',
        amount: '10',
        comment: 'ok',
        description: '',
        fileName: '',
        fileUrl: '',
      }),
    ).toContain('caja abierta');
  });
});
