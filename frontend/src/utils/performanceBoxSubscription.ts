import {
  collection,
  limit,
  onSnapshot,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Box } from '../types';

function parseBoxFromSnapshot(docSnap: { id: string; data: () => Record<string, unknown> }): Box {
  return { id: docSnap.id, ...docSnap.data() } as Box;
}

function findTodayBoxFromFallback(boxes: Box[], uid: string, startOfToday: Date): Box | null {
  const filtered = boxes.filter((box) => {
    const isUser = box.userId === uid;
    const isToday = box.openedAt && box.openedAt.toDate() >= startOfToday;
    return isUser && isToday;
  });

  if (filtered.length === 0) return null;
  filtered.sort((a, b) => b.openedAt.toMillis() - a.openedAt.toMillis());
  return filtered[0];
}

function handleBoxSnapshot(
  snapshot: { docs: { id: string; data: () => Record<string, unknown> }[]; empty: boolean },
  useFallback: boolean,
  uid: string,
  startOfToday: Date,
  onBox: (box: Box | null) => void
) {
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
}

export function subscribeTodayBox(
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
      (snapshot) => handleBoxSnapshot(snapshot, useFallback, uid, startOfToday, onBox),
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
