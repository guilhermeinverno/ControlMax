import { auth, db } from '../lib/firebase';
import {
  collection,
  query,
  where,
  limit,
  onSnapshot,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { Box } from '../types';

export interface CollectionRecord {
  id: string;
  amount: number;
  status: string;
  tenantId: string;
  userId: string;
  createdAt: Timestamp;
}

export interface CreditRequestRecord {
  id: string;
  status: 'pending' | 'rejected' | 'approved' | string;
  tenantId: string;
  requestedById: string;
  createdAt: Timestamp;
}

function getStartOfToday(): Date {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
}

function parseBoxFromSnapshot(
  docSnap: { id: string; data: () => Record<string, unknown> }
): Box {
  return { id: docSnap.id, ...docSnap.data() } as Box;
}

function findTodayBoxFromFallback(
  boxes: Box[],
  uid: string,
  startOfToday: Date
): Box | null {
  const filtered = boxes.filter((box) => {
    const isUser = box.userId === uid;
    const isToday = box.openedAt && box.openedAt.toDate() >= startOfToday;
    return isUser && isToday;
  });

  if (filtered.length === 0) return null;
  filtered.sort((a, b) => b.openedAt.toMillis() - a.openedAt.toMillis());
  return filtered[0];
}

function subscribeTodayBox(
  tenantId: string,
  uid: string,
  startOfToday: Date,
  onBox: (box: Box | null) => void
): () => void {
  let unsubscribe: (() => void) | null = null;

  const attach = (useFallback: boolean) => {
    const q = useFallback
      ? query(collection(db, 'boxes'), where('tenantId', '==', tenantId))
      : query(
          collection(db, 'boxes'),
          where('tenantId', '==', tenantId),
          where('userId', '==', uid),
          where('openedAt', '>=', Timestamp.fromDate(startOfToday)),
          limit(1)
        );

    return onSnapshot(
      q,
      (snapshot) => {
        if (useFallback) {
          const boxes = snapshot.docs.map((docSnap) => parseBoxFromSnapshot(docSnap));
          onBox(findTodayBoxFromFallback(boxes, uid, startOfToday));
          return;
        }

        if (snapshot.empty) {
          onBox(null);
          return;
        }

        onBox(parseBoxFromSnapshot(snapshot.docs[0]));
      },
      (err) => {
        console.error('Box query failed:', err);
        if (!useFallback) {
          console.log('Retrying box query with fallback...');
          unsubscribe?.();
          unsubscribe = attach(true);
        }
      }
    );
  };

  unsubscribe = attach(false);
  return () => unsubscribe?.();
}

async function fetchTodayCollections(
  tenantId: string,
  uid: string,
  startOfToday: Date
): Promise<CollectionRecord[]> {
  try {
    const colQuery = query(
      collection(db, 'collections'),
      where('tenantId', '==', tenantId),
      where('userId', '==', uid),
      where('createdAt', '>=', Timestamp.fromDate(startOfToday))
    );
    const colSnap = await getDocs(colQuery);
    return colSnap.docs.map(
      (docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as CollectionRecord
    );
  } catch (colErr) {
    console.warn('Primary collections query failed, trying index-free fallback...', colErr);
    const colSnapFallback = await getDocs(
      query(collection(db, 'collections'), where('tenantId', '==', tenantId))
    );
    const list: CollectionRecord[] = [];
    colSnapFallback.forEach((docSnap) => {
      const data = docSnap.data() as CollectionRecord;
      if (data.userId === uid && data.createdAt && data.createdAt.toDate() >= startOfToday) {
        list.push({ id: docSnap.id, ...data });
      }
    });
    return list;
  }
}

async function fetchTodayCreditRequests(
  tenantId: string,
  uid: string,
  startOfToday: Date
): Promise<CreditRequestRecord[]> {
  try {
    const reqQuery = query(
      collection(db, 'credit_requests'),
      where('tenantId', '==', tenantId),
      where('requestedById', '==', uid),
      where('createdAt', '>=', Timestamp.fromDate(startOfToday))
    );
    const reqSnap = await getDocs(reqQuery);
    return reqSnap.docs.map(
      (docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as CreditRequestRecord
    );
  } catch (reqErr) {
    console.warn('Primary credit requests query failed, trying index-free fallback...', reqErr);
    const reqSnapFallback = await getDocs(
      query(collection(db, 'credit_requests'), where('tenantId', '==', tenantId))
    );
    const list: CreditRequestRecord[] = [];
    reqSnapFallback.forEach((docSnap) => {
      const data = docSnap.data() as CreditRequestRecord;
      if (
        data.requestedById === uid &&
        data.createdAt &&
        data.createdAt.toDate() >= startOfToday
      ) {
        list.push({ id: docSnap.id, ...data });
      }
    });
    return list;
  }
}

export async function loadPerformanceSupplementaryData(tenantId: string) {
  const startOfToday = getStartOfToday();
  const uid = auth.currentUser?.uid || 'test-user-id';

  const [collections, creditRequests] = await Promise.all([
    fetchTodayCollections(tenantId, uid, startOfToday),
    fetchTodayCreditRequests(tenantId, uid, startOfToday),
  ]);

  return { collections, creditRequests };
}

export function subscribePerformanceData(
  tenantId: string,
  onBox: (box: Box | null) => void,
  onSupplementary: (data: {
    collections: CollectionRecord[];
    creditRequests: CreditRequestRecord[];
  }) => void,
  onLoadingChange: (loading: boolean) => void
) {
  const startOfToday = getStartOfToday();
  const uid = auth.currentUser?.uid || 'test-user-id';

  onLoadingChange(true);

  const unsubscribeBox = subscribeTodayBox(tenantId, uid, startOfToday, onBox);

  loadPerformanceSupplementaryData(tenantId)
    .then(onSupplementary)
    .catch((err) => console.error('General error fetching supplementary performance data:', err))
    .finally(() => onLoadingChange(false));

  return unsubscribeBox;
}
