import { describe, expect, it } from 'vitest';
import {
  approvalStatusLabel,
  boxStatusBadgeBorderClasses,
  boxStatusLabel,
  terminalLogTextClass,
} from './statusLabels';

describe('statusLabels', () => {
  it('traduz status de aprovação', () => {
    expect(approvalStatusLabel('pending')).toBe('Pendente');
    expect(approvalStatusLabel('approved')).toBe('Aprovado');
  });

  it('traduz status de caixa', () => {
    expect(boxStatusLabel('open')).toBe('Aberta');
    expect(boxStatusLabel('closed')).toBe('Fechada');
  });

  it('retorna classes de badge de caixa', () => {
    expect(boxStatusBadgeBorderClasses('open')).toContain('green');
    expect(boxStatusBadgeBorderClasses('confirmed')).toContain('purple');
  });

  it('retorna cor de log do terminal', () => {
    expect(terminalLogTextClass('SUCCESS')).toBe('text-emerald-400');
    expect(terminalLogTextClass('INFO')).toBe('text-blue-400');
  });
});
