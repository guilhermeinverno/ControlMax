import { getErrorMessage } from '../utils/errorMessage';
import { logFirestoreError, type FirestoreOperationType } from '../utils/firestoreError';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Box } from '../types';

export interface OpenBoxParams {
  unitId: string;
  unitName: string;
  cnId: string;
  cnName: string;
  initialAmount: number;
  observation?: string;
}

export async function createOpenBox(
  tenantId: string,
  userId: string,
  userName: string | undefined,
  params: OpenBoxParams
): Promise<void> {
  const boxesRef = collection(db, 'boxes');
  const activeCheckQuery = query(
    boxesRef,
    where('tenantId', '==', tenantId),
    where('userId', '==', userId),
    where('status', '==', 'open'),
    limit(1)
  );

  const checkSnap = await getDocs(activeCheckQuery);
  if (!checkSnap.empty) {
    throw new Error('El usuario ya tiene una caja abierta.');
  }

  await addDoc(collection(db, 'boxes'), {
    tenantId,
    unitId: params.unitId,
    unitName: params.unitName,
    cnId: params.cnId,
    cnName: params.cnName,
    userId,
    userName:
      userName ||
      auth.currentUser?.displayName ||
      auth.currentUser?.email?.split('@')[0] ||
      'Cobrador',
    status: 'open' as const,
    openedAt: serverTimestamp(),
    initialAmount: Math.round(params.initialAmount),
    observation: params.observation || '',
    totalIncomes: 0,
    totalExpenses: 0,
    totalSales: 0,
    totalCollections: 0,
    totalTransfers: 0,
    finalAmount: Math.round(params.initialAmount),
  });
}

export async function closeActiveBox(activeBox: Box): Promise<void> {
  const boxRef = doc(db, 'boxes', activeBox.id);

  const [incomesSnap, expensesSnap, salesSnap, collectionsSnap, transfersSnap] = await Promise.all([
    getDocs(
      query(
        collection(db, 'incomes'),
        where('boxId', '==', activeBox.id),
        where('tenantId', '==', activeBox.tenantId)
      )
    ),
    getDocs(
      query(
        collection(db, 'expenses'),
        where('boxId', '==', activeBox.id),
        where('tenantId', '==', activeBox.tenantId),
        where('status', 'in', ['approved', 'pending'])
      )
    ),
    getDocs(
      query(
        collection(db, 'sales'),
        where('boxId', '==', activeBox.id),
        where('tenantId', '==', activeBox.tenantId)
      )
    ),
    getDocs(
      query(
        collection(db, 'collections'),
        where('boxId', '==', activeBox.id),
        where('tenantId', '==', activeBox.tenantId)
      )
    ),
    getDocs(
      query(
        collection(db, 'transfers'),
        where('boxId', '==', activeBox.id),
        where('tenantId', '==', activeBox.tenantId)
      )
    ),
  ]);

  const totalIncomes = incomesSnap.docs.reduce((s, d) => s + (d.data().amount || 0), 0);
  const totalExpenses = expensesSnap.docs.reduce((s, d) => s + (d.data().amount || 0), 0);
  const totalSales = salesSnap.docs.reduce((s, d) => s + (d.data().amount || 0), 0);
  const totalCollections = collectionsSnap.docs.reduce((s, d) => s + (d.data().amount || 0), 0);
  const totalTransfers = transfersSnap.docs.reduce((s, d) => s + (d.data().amount || 0), 0);

  const finalAmount =
    activeBox.initialAmount +
    totalCollections +
    totalIncomes -
    totalExpenses -
    totalSales -
    totalTransfers;

  await runTransaction(db, async (transaction) => {
    const boxSnap = await transaction.get(boxRef);
    if (!boxSnap.exists()) throw new Error('Caixa não encontrada');
    if (boxSnap.data().status !== 'open') throw new Error('Caixa já foi fechada');

    transaction.update(boxRef, {
      status: 'closed',
      closedAt: serverTimestamp(),
      totalIncomes,
      totalExpenses,
      totalSales,
      totalCollections,
      totalTransfers,
      finalAmount,
    });
  });
}

export async function confirmBoxByAdmin(boxId: string): Promise<void> {
  await updateDoc(doc(db, 'boxes', boxId), {
    status: 'confirmed' as const,
    confirmedAt: serverTimestamp(),
    confirmedBy: auth?.currentUser?.uid || 'test-user-id',
  });
}

export function logBoxError(err: unknown, operation: FirestoreOperationType, path: string): string {
  const msg = getErrorMessage(err);
  logFirestoreError(err, operation, path, { throwError: true });
  return msg;
}
