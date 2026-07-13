import {
  collection as firestoreCollection,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { CleaningCollection } from '../types/collectionCleaning';

export function parseCleaningDayBounds(selectedDate: string): { startOfDay: Date; endOfDay: Date } {
  const [year, month, day] = selectedDate.split('-').map(Number);
  return {
    startOfDay: new Date(year, month - 1, day, 0, 0, 0, 0),
    endOfDay: new Date(year, month - 1, day, 23, 59, 59, 999),
  };
}

export function filterCollectionsByDay(
  loaded: CleaningCollection[],
  startOfDay: Date,
  endOfDay: Date
): CleaningCollection[] {
  const filtered = loaded.filter((item) => {
    if (!item.createdAt) return false;
    const itemDate = item.createdAt.toDate();
    return itemDate >= startOfDay && itemDate <= endOfDay;
  });
  filtered.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
  return filtered;
}

export function subscribeCleaningCollections(
  tenantId: string,
  selectedDate: string,
  onData: (collections: CleaningCollection[]) => void,
  onLoadingChange: (loading: boolean) => void,
  onError: (message: string) => void
): () => void {
  const { startOfDay, endOfDay } = parseCleaningDayBounds(selectedDate);
  let unsub: (() => void) | null = null;

  const attach = (useFallback: boolean) =>
    onSnapshot(
      useFallback
        ? query(firestoreCollection(db, 'collections'), where('tenantId', '==', tenantId))
        : query(
            firestoreCollection(db, 'collections'),
            where('tenantId', '==', tenantId),
            where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
            where('createdAt', '<=', Timestamp.fromDate(endOfDay)),
            orderBy('createdAt', 'desc')
          ),
      (snapshot) => {
        const loaded = snapshot.docs.map(
          (docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as CleaningCollection
        );
        onData(useFallback ? filterCollectionsByDay(loaded, startOfDay, endOfDay) : loaded);
        onLoadingChange(false);
      },
      (err) => {
        console.error('Firestore onSnapshot error:', err);
        if (!useFallback) {
          if (unsub) unsub();
          unsub = attach(true);
          return;
        }
        onError('Falha ao sincronizar as cobranças do banco de dados.');
        onLoadingChange(false);
      }
    );

  unsub = attach(false);
  return () => {
    if (unsub) unsub();
  };
}
