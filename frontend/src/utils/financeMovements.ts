import { collection, getDocs, query, Timestamp, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface UnifiedMovement {
  id: string;
  type: 'Ingreso' | 'Egreso' | 'Transferencia' | 'Recaudo';
  amount: number;
  description: string;
  status: 'Aprobado' | 'Pendiente' | 'Rechazado';
  date: Date;
  dateStr: string;
  responsible: string;
  cnName: string;
}

export function parseFirestoreDate(field: unknown): Date {
  if (!field) return new Date();
  if (typeof field === 'object' && field !== null && 'toDate' in field && typeof (field as Record<string, unknown>).toDate === 'function') {
    return (field as { toDate: () => Date }).toDate();
  }
  if (field instanceof Date) return field;
  if ((field as { seconds: number }).seconds !== undefined) {
    return new Timestamp((field as { seconds: number }).seconds, (field as { nanoseconds?: number }).nanoseconds || 0).toDate();
  }
  const parsed = new Date(field as string | number);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function mapApprovalStatus(status: unknown): 'Aprobado' | 'Pendiente' | 'Rechazado' {
  if (status === 'approved' || status === 'confirmed') return 'Aprobado';
  if (status === 'rejected') return 'Rechazado';
  return 'Pendiente';
}

export async function fetchUnifiedMovements(tenantId: string): Promise<{
  movements: UnifiedMovement[];
  cnNames: string[];
}> {
  const [incomesSnap, expensesSnap, transfersSnap, collectionsSnap] = await Promise.all([
    getDocs(query(collection(db, 'bc_incomes'), where('tenantId', '==', tenantId))),
    getDocs(query(collection(db, 'bc_expenses'), where('tenantId', '==', tenantId))),
    getDocs(query(collection(db, 'bc_transfers'), where('tenantId', '==', tenantId))),
    getDocs(query(collection(db, 'collections'), where('tenantId', '==', tenantId))),
  ]);

  const loadedMovements: UnifiedMovement[] = [];
  const cnNamesSet = new Set<string>();

  incomesSnap.docs.forEach((docSnap) => {
    const data = docSnap.data();
    const date = parseFirestoreDate(data.createdAt);
    const cnName = String(data.cnName || 'CN General');
    cnNamesSet.add(cnName);
    loadedMovements.push({
      id: docSnap.id,
      type: 'Ingreso',
      amount: Number(data.amount || 0),
      description: String(data.description || 'Ingreso de Capital'),
      status: mapApprovalStatus(data.status),
      date,
      dateStr: date.toLocaleString(),
      responsible: String(data.userName || 'Sistema'),
      cnName,
    });
  });

  expensesSnap.docs.forEach((docSnap) => {
    const data = docSnap.data();
    const date = parseFirestoreDate(data.createdAt);
    const cnName = String(data.cnName || 'CN General');
    cnNamesSet.add(cnName);
    loadedMovements.push({
      id: docSnap.id,
      type: 'Egreso',
      amount: Number(data.amount || 0),
      description: String(data.description || 'Gasto Operativo'),
      status: mapApprovalStatus(data.status),
      date,
      dateStr: date.toLocaleString(),
      responsible: String(data.userName || 'Sistema'),
      cnName,
    });
  });

  transfersSnap.docs.forEach((docSnap) => {
    const data = docSnap.data();
    const date = parseFirestoreDate(data.createdAt);
    const cnName = String(data.toCnName || 'CN Destino');
    cnNamesSet.add(cnName);
    loadedMovements.push({
      id: docSnap.id,
      type: 'Transferencia',
      amount: Number(data.amount || 0),
      description: String(data.description || 'Transferencia entre cajas'),
      status: mapApprovalStatus(data.status),
      date,
      dateStr: date.toLocaleString(),
      responsible: String(data.fromName || 'Sistema'),
      cnName,
    });
  });

  collectionsSnap.docs.forEach((docSnap) => {
    const data = docSnap.data();
    const date = parseFirestoreDate(data.createdAt);
    const cnName = String(data.cnName || 'Ruta de Cobro');
    cnNamesSet.add(cnName);
    loadedMovements.push({
      id: docSnap.id,
      type: 'Recaudo',
      amount: Number(data.amount || 0),
      description: `Cobro de Cliente - ${String(data.clientName || 'Sin Nombre')}`,
      status: 'Aprobado',
      date,
      dateStr: date.toLocaleString(),
      responsible: String(data.registeredBy || 'Cobrador'),
      cnName,
    });
  });

  loadedMovements.sort((a, b) => b.date.getTime() - a.date.getTime());

  return {
    movements: loadedMovements,
    cnNames: Array.from(cnNamesSet),
  };
}
