import { Sale } from '../types';

export function mapSaleFromSnapshot(
  docSnap: { id: string; exists: () => boolean; data: () => Record<string, unknown> }
): Sale | null {
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  return {
    id: docSnap.id,
    tenantId: String(data.tenantId || ''),
    clientId: String(data.clientId || ''),
    clientName: String(data.clientName || ''),
    clientDoc: String(data.clientDoc || ''),
    amount: Number(data.amount || 0),
    balance: Number(data.balance ?? data.saldoPendienteCents ?? 0),
    status: String(data.status || 'active'),
    idPreVenta: data.idPreVenta ? String(data.idPreVenta) : undefined,
    saldoPendiente: data.saldoPendiente ? String(data.saldoPendiente) : undefined,
    saldoPendienteCents: data.saldoPendienteCents !== undefined ? Number(data.saldoPendienteCents) : undefined,
    installments: data.installments !== undefined ? Number(data.installments) : undefined,
    installmentAmount: data.installmentAmount !== undefined ? Number(data.installmentAmount) : undefined,
    paidInstallments: data.paidInstallments !== undefined ? Number(data.paidInstallments) : undefined,
    unitName: data.unitName ? String(data.unitName) : undefined,
    lateDays: data.lateDays !== undefined ? Number(data.lateDays) : undefined,
    lastPaymentAt: data.lastPaymentAt || undefined,
    userId: data.userId ? String(data.userId) : undefined,
  };
}
