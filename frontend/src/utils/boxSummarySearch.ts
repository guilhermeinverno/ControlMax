import { auth, db } from '../lib/firebase';
import { Box } from '../types';
import { collection, getDocs, query, Timestamp, where } from 'firebase/firestore';

export interface BoxTransaction {
  id: string;
  type: 'income' | 'expense' | 'sale' | 'collection' | 'transfer';
  description: string;
  amount: number;
  userId: string;
  userName: string;
  createdAt: import('firebase/firestore').Timestamp;
}

function mapBoxFromData(id: string, data: Record<string, unknown>): Box {
  return {
    id,
    tenantId: String(data.tenantId || ''),
    unitId: String(data.unitId || ''),
    unitName: String(data.unitName || ''),
    cnId: String(data.cnId || ''),
    cnName: String(data.cnName || ''),
    userId: String(data.userId || ''),
    userName: String(data.userName || ''),
    status: data.status as Box['status'],
    openedAt: data.openedAt as Box['openedAt'],
    closedAt: data.closedAt as Box['closedAt'],
    confirmedAt: data.confirmedAt as Box['confirmedAt'],
    confirmedBy: data.confirmedBy as string | undefined,
    initialAmount: Number(data.initialAmount || 0),
    observation: String(data.observation || ''),
    totalIncomes: Number(data.totalIncomes || 0),
    totalExpenses: Number(data.totalExpenses || 0),
    totalSales: Number(data.totalSales || 0),
    totalCollections: Number(data.totalCollections || 0),
    totalTransfers: Number(data.totalTransfers || 0),
    finalAmount: Number(data.finalAmount || 0),
  };
}

async function loadBoxTransactions(boxId: string): Promise<BoxTransaction[]> {
  const txsSnap = await getDocs(collection(db, 'boxes', boxId, 'transactions'));
  const txsList = txsSnap.docs.map((docSnap) => {
    const txData = docSnap.data();
    return {
      id: docSnap.id,
      type: txData.type,
      description: txData.description || '',
      amount: txData.amount || 0,
      userId: txData.userId || '',
      userName: txData.userName || '',
      createdAt: txData.createdAt,
    } as BoxTransaction;
  });

  txsList.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
  return txsList;
}

export async function searchBoxSummaryForDate(
  tenantId: string,
  selectedDate: string,
  uid: string
): Promise<{ box: Box | null; transactions: BoxTransaction[] }> {
  const [year, month, day] = selectedDate.split('-').map(Number);
  const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
  const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

  const querySnapshot = await getDocs(
    query(
      collection(db, 'boxes'),
      where('tenantId', '==', tenantId),
      where('openedAt', '>=', Timestamp.fromDate(startOfDay)),
      where('openedAt', '<=', Timestamp.fromDate(endOfDay))
    )
  );

  const foundBoxDoc = querySnapshot.docs.find((docSnap) => docSnap.data().userId === uid) || querySnapshot.docs[0];
  if (!foundBoxDoc) return { box: null, transactions: [] };

  const box = mapBoxFromData(foundBoxDoc.id, foundBoxDoc.data());
  const transactions = await loadBoxTransactions(box.id);
  return { box, transactions };
}

export function getBoxSummaryUserId(): string | undefined {
  return auth?.currentUser?.uid;
}
