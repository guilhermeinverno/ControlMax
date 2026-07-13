import { collection, limit, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db, onAuthStateChanged } from '../lib/firebase';
import { logFirestoreError } from './firestoreError';
import { Box } from '../types';

function mapBoxDoc(docSnap: { id: string; data: () => Record<string, unknown> }): Box {
  const data = docSnap.data();
  return {
    id: docSnap.id,
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

export function subscribeActiveOpenBox(
  tenantId: string,
  userId: string,
  onBox: (box: Box | null) => void,
  onLoadingChange: (loading: boolean) => void,
  onError: (message: string) => void
): () => void {
  onLoadingChange(true);

  const q = query(
    collection(db, 'boxes'),
    where('tenantId', '==', tenantId),
    where('userId', '==', userId),
    where('status', '==', 'open'),
    limit(1)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      onBox(snapshot.empty ? null : mapBoxDoc(snapshot.docs[0]));
      onLoadingChange(false);
    },
    (err) => {
      onLoadingChange(false);
      onError(err.message);
      try {
        logFirestoreError(err, 'list', 'boxes', { throwError: true });
      } catch {
        /* logged */
      }
    }
  );
}

export function subscribeAuthActiveBox(
  tenantId: string | undefined,
  onBox: (box: Box | null) => void,
  onLoadingChange: (loading: boolean) => void,
  onError: (message: string) => void
): () => void {
  let unsubscribeSnap: (() => void) | null = null;

  const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
    if (unsubscribeSnap) {
      unsubscribeSnap();
      unsubscribeSnap = null;
    }

    if (!user || !tenantId) {
      onBox(null);
      onLoadingChange(false);
      return;
    }

    unsubscribeSnap = subscribeActiveOpenBox(tenantId, user.uid, onBox, onLoadingChange, onError);
  });

  return () => {
    unsubscribeAuth();
    if (unsubscribeSnap) unsubscribeSnap();
  };
}
