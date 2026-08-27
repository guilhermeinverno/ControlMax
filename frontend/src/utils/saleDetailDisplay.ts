import type { SaleDetailRecord } from '../types/saleDetail';
import { fmtCents, resolvePendingCents } from './currency';

export interface SaleFinancialDisplay {
  valorStr: string;
  saldoTotalStr: string;
  saldoPendienteStr: string;
  totalPagadoStr: string;
  paidCents: number;
}

export function buildSaleFinancialDisplay(sale: SaleDetailRecord): SaleFinancialDisplay {
  const totalCents = Number(sale.saldoTotalCents || 0);
  const pendingCents = resolvePendingCents(sale);
  const paidCents = Math.max(0, totalCents - pendingCents);

  const prefixCurrency = (value: string) => (value.startsWith('$') ? value : `$ ${value}`);

  return {
    valorStr: prefixCurrency(sale.valor),
    saldoTotalStr: totalCents
      ? `$ ${fmtCents(totalCents)}`
      : prefixCurrency(sale.saldoTotal),
    saldoPendienteStr: `$ ${fmtCents(pendingCents)}`,
    totalPagadoStr: `$ ${fmtCents(paidCents)}`,
    paidCents,
  };
}
