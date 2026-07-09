import { describe, expect, it } from 'vitest';
import { formatExpenseType, mapExpenseTypeToBcCategory } from './expenseTypeLabels';
import { expenseSuccessMessage, validateExpenseForm } from './expenseSave';

const baseInput = {
  tenantId: 'tenant-1',
  egresoMode: 'gasto' as const,
  selectedCnId: 'cn-1',
  selectedCnName: 'CN Test',
  selectedBoxId: 'box-1',
  selectedBoxName: 'Caja 1',
  expenseType: 'gasolina',
  amount: '10,00',
  comment: 'teste',
  description: 'desc',
  fileName: '',
  fileUrl: '',
};

describe('validateExpenseForm', () => {
  it('returns null for valid gasto input', () => {
    expect(validateExpenseForm(baseInput)).toBeNull();
  });

  it('requires box in gasto mode', () => {
    expect(validateExpenseForm({ ...baseInput, selectedBoxId: '' })).toContain('Caja');
  });

  it('requires description', () => {
    expect(validateExpenseForm({ ...baseInput, description: '  ' })).toContain('descripción');
  });
});

describe('expenseTypeLabels', () => {
  it('formats known expense types', () => {
    expect(formatExpenseType('gasolina')).toBe('Gasolina');
  });

  it('maps transport categories', () => {
    expect(mapExpenseTypeToBcCategory('gasolina')).toBe('transport');
  });
});

describe('expenseSuccessMessage', () => {
  it('returns approved gasto message', () => {
    expect(expenseSuccessMessage('gasto', 'approved')).toContain('caja actualizada');
  });
});
