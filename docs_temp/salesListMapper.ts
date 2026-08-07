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
  return {
    id,
    tenantId: String(data.tenantId || ''),
    clientId: String(data.clientId || ''),
    clientName: String(data.clientName || ''),
    clientDoc: String(data.clientDoc || ''),
    userId: String(data.userId || ''),
    userName: String(data.userName || ''),
    unitId: String(data.unitId || ''),
    unitName: String(data.unitName || ''),
    amount: Number(data.amount || 0),
    balance: Number(data.balance || 0),
    saldoPendienteCents: Number(data.saldoPendienteCents || data.balance || 0),
    installments: Number(data.installments || 0),
    installmentAmount: Number(data.installmentAmount || 0),
    paidInstallments: Number(data.paidInstallments || 0),
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
