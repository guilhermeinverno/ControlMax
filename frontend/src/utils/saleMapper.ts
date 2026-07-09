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
  };
}
