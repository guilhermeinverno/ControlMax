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
  date: string;
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
  
  // 2. LOGICA E VALIDAÇÃO DE ABERTURA (Sin Caja -> Abierta)
  const activeCheckQuery = query(
    boxesRef,
    where('tenantId', '==', tenantId),
    where('unitId', '==', params.unitId),
    where('date', '==', params.date),
    where('status', 'in', ['open', 'closed', 'confirmed'])
  );

  const checkSnap = await getDocs(activeCheckQuery);
  if (!checkSnap.empty) {
    throw new Error('Já existe um caixa aberto ou fechado para esta Unidade nesta data.');
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
    date: params.date,
    initialAmount: Math.round(params.initialAmount),
    observation: params.observation || '',
    totalIncomes: 0,
    totalExpenses: 0,
    totalSales: 0,
    totalCollections: 0,
    totalTransfers: 0,
    finalAmount: Math.round(params.initialAmount),
    expectedFinalAmount: Math.round(params.initialAmount),
    difference: 0,
  });
}

export async function closeActiveBox(activeBox: Box, realFinalAmount: number): Promise<void> {
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

  // 3. LÓGICA DE FECHAMENTO E SALDO PREVISTO (Abierta -> Cerrada)
  const expectedFinalAmount =
    activeBox.initialAmount +
    totalCollections +
    totalIncomes -
    totalExpenses -
    totalSales -
    totalTransfers;

  const difference = realFinalAmount - expectedFinalAmount;

  await runTransaction(db, async (transaction) => {
    const boxSnap = await transaction.get(boxRef);
    if (!boxSnap.exists()) throw new Error('Caixa não encontrada');
    const boxData = boxSnap.data();
    if (boxData.status !== 'open') throw new Error('Caixa já foi fechada');

    transaction.update(boxRef, {
      status: 'closed',
      closedAt: serverTimestamp(),
      totalIncomes,
      totalExpenses,
      totalSales,
      totalCollections,
      totalTransfers,
      finalAmount: realFinalAmount,
      expectedFinalAmount,
      difference,
    });
  });
}

export async function confirmBoxByAdmin(boxId: string, tenantId?: string): Promise<void> {
  // 4. LÓGICA DE CONFIRMAÇÃO E IMUTABILIDADE (Cerrada -> Confirmada)
  const token = auth?.currentUser ? await auth.currentUser.getIdToken() : '';

  const response = await fetch('/api/boxes/confirm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      boxId
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro do servidor (${response.status}) ao confirmar caixa.`);
  }
}

export async function checkBoxIsMutable(boxId: string): Promise<void> {
  const boxSnap = await getDocs(
    query(
      collection(db, 'boxes'),
      where('__name__', '==', boxId),
      limit(1)
    )
  );
  if (!boxSnap.empty) {
    const status = boxSnap.docs[0].data().status;
    if (status === 'confirmed') {
      throw new Error('Operação bloqueada: Caixa já confirmado e auditado');
    }
  }
}

export function logBoxError(err: unknown, operation: FirestoreOperationType, path: string): string {
  const msg = getErrorMessage(err);
  logFirestoreError(err, operation, path, { throwError: true });
  return msg;
}
