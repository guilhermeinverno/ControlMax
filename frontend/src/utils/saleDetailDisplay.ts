import type { SaleDetailRecord } from '../types/saleDetail';

export interface SaleFinancialDisplay {
  valorStr: string;
  saldoTotalStr: string;
  saldoPendienteStr: string;
  totalPagadoStr: string;
  paidCents: number;
}

export function buildSaleFinancialDisplay(sale: SaleDetailRecord): SaleFinancialDisplay {
  const totalCents = sale.saldoTotalCents || 0;
  const pendingCents = sale.saldoPendienteCents !== undefined ? sale.saldoPendienteCents : 0;
  const paidCents = Math.max(0, totalCents - pendingCents);

  const prefixCurrency = (value: string) => (value.startsWith('$') ? value : `$ ${value}`);

  return {
    valorStr: prefixCurrency(sale.valor),
    saldoTotalStr: prefixCurrency(sale.saldoTotal),
    saldoPendienteStr: prefixCurrency(sale.saldoPendiente),
    totalPagadoStr: `$ ${(paidCents / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
    paidCents,
  };
}
