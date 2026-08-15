import { Timestamp } from 'firebase/firestore';

export interface SalesListSale {
  id: string;
  tenantId: string;
  clientId: string;
  clientName: string;
  clientDoc: string;
  userId: string;
  userName: string;
  unitId: string;
  unitName: string;
  amount: number;
  balance: number;
  saldoPendienteCents: number;
  installments: number;
  installmentAmount: number;
  paidInstallments: number;
  status: 'active' | 'completed' | 'cancelled';
  lastPaymentAt?: Timestamp;
  lastPaymentAmount?: number;
  createdAt: Timestamp;
}

export interface SalesListCollection {
  id: string;
  tenantId: string;
  boxId: string;
  boxName: string;
  amount: number;
  saleId: string;
  clientId: string;
  clientName: string;
  userName: string;
  userId: string;
  createdAt: Timestamp;
}

function ensureTimestamp(val: any): Timestamp {
  if (!val) return Timestamp.now();
  if (val instanceof Timestamp) return val;
  if (typeof val.toDate === 'function') return val;
  if (val.seconds !== undefined) return new Timestamp(val.seconds, val.nanoseconds || 0);
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    return Timestamp.fromDate(d);
  }
  return Timestamp.now();
}

export function mapSalesListSale(
  id: string,
  data: Record<string, unknown>
): SalesListSale {
  const rawAmount = Number(data.amount || data.totalAmount || data.principal || data.valor || 0);
  const rawBalance = Number(data.saldoPendienteCents || data.balance || data.pendingBalance || data.saldo || 0);
  const rawInstallments = Number(data.installments || data.totalInstallments || data.numInstallments || data.parcelas || 20);
  const rawPaidInst = Number(data.paidInstallments || data.parcelasPagas || 0);
  
  // Calculate total amount with interest if balance/saldo is zero and status is active
  const calculatedTotalWithInterest = Math.round(rawAmount * 1.2);
  const finalSaldoPendiente = (rawBalance > 0)
    ? rawBalance
    : (data.status !== 'completed' ? calculatedTotalWithInterest : 0);

  const clientNameStr = String(data.clientName || data.client || data.name || data.customerName || data.clienteNome || 'Cliente Sem Nome').trim();

  return {
    id,
    tenantId: String(data.tenantId || ''),
    clientId: String(data.clientId || data.customerId || ''),
    clientName: clientNameStr || 'Cliente Sem Nome',
    clientDoc: String(data.clientDoc || data.doc || 'SIN NÚMERO'),
    userId: String(data.userId || data.collectorId || ''),
    userName: String(data.userName || data.collectorName || ''),
    unitId: String(data.unitId || ''),
    unitName: String(data.unitName || 'Unidade 01'),
    amount: rawAmount,
    balance: finalSaldoPendiente,
    saldoPendienteCents: finalSaldoPendiente,
    installments: rawInstallments > 0 ? rawInstallments : 20,
    installmentAmount: Number(data.installmentAmount || (rawAmount > 0 && rawInstallments > 0 ? Math.round((rawAmount * 1.2) / rawInstallments) : 0)),
    paidInstallments: rawPaidInst,
    status: (data.status as SalesListSale['status']) || 'active',
    lastPaymentAt: data.lastPaymentAt ? ensureTimestamp(data.lastPaymentAt) : undefined,
    lastPaymentAmount: data.lastPaymentAmount as number | undefined,
    createdAt: ensureTimestamp(data.createdAt),
  };
}

export function mapSalesListCollection(
  id: string,
  data: Record<string, unknown>
): SalesListCollection {
  return {
    id,
    tenantId: String(data.tenantId || ''),
    boxId: String(data.boxId || ''),
    boxName: String(data.boxName || ''),
    amount: Number(data.amount || 0),
    saleId: String(data.saleId || ''),
    clientId: String(data.clientId || ''),
    clientName: String(data.clientName || ''),
    userName: String(data.userName || ''),
    userId: String(data.userId || ''),
    createdAt: ensureTimestamp(data.createdAt),
  };
}
