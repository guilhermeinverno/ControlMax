import { collection, onSnapshot, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toJsDate } from './firestoreTimestamp';

type DocMapper<T> = (doc: { id: string; data: () => Record<string, unknown> }) => T;

function sortByCreatedAtDesc<T extends { createdAt?: { seconds?: number } }>(list: T[]): T[] {
  return [...list].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

function filterByDay<T extends { createdAt?: unknown }>(
  list: T[],
  startOfDay: Date,
  endOfDay: Date
): T[] {
  return list.filter((item) => {
    if (!item.createdAt) return false;
    const date = toJsDate(item.createdAt);
    return date >= startOfDay && date <= endOfDay;
  });
}

export function subscribeTenantCollectionByDate<T extends { createdAt?: { seconds?: number } }>(
  collectionName: string,
  tenantId: string,
  selectedDate: string,
  mapDoc: DocMapper<T>,
  callbacks: {
    onData: (items: T[]) => void;
    onError: (message: string) => void;
    onLoading: (loading: boolean) => void;
  }
): () => void {
  callbacks.onLoading(true);
  callbacks.onError('');

  const startOfDay = new Date(selectedDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(selectedDate);
  endOfDay.setHours(23, 59, 59, 999);

  let unsub: (() => void) | null = null;

  const attach = (useFallbackLevel: 0 | 1 | 2) => {
    if (unsub) unsub();

    if (useFallbackLevel === 0) {
      const q = query(
        collection(db, collectionName),
        where('tenantId', '==', tenantId),
        where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
        where('createdAt', '<=', Timestamp.fromDate(endOfDay)),
        orderBy('createdAt', 'desc')
      );
      unsub = onSnapshot(
        q,
        (snapshot) => {
          callbacks.onData(snapshot.docs.map(mapDoc));
          callbacks.onLoading(false);
        },
        () => attach(1)
      );
      return;
    }

    if (useFallbackLevel === 1) {
      const q = query(
        collection(db, collectionName),
        where('tenantId', '==', tenantId),
        where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
        where('createdAt', '<=', Timestamp.fromDate(endOfDay))
      );
      unsub = onSnapshot(
        q,
        (snapshot) => {
          callbacks.onData(sortByCreatedAtDesc(snapshot.docs.map(mapDoc)));
          callbacks.onLoading(false);
        },
        () => attach(2)
      );
      return;
    }

    const q = query(collection(db, collectionName), where('tenantId', '==', tenantId));
    unsub = onSnapshot(
      q,
      (snapshot) => {
        const filtered = sortByCreatedAtDesc(
          filterByDay(snapshot.docs.map(mapDoc), startOfDay, endOfDay)
        );
        callbacks.onData(filtered);
        callbacks.onLoading(false);
      },
      (errFinal) => {
        console.error(`Critical: ${collectionName} fetch failed:`, errFinal);
        callbacks.onError(`Erro ao carregar os dados de ${collectionName}.`);
        callbacks.onLoading(false);
      }
    );
  };

  try {
    attach(0);
  } catch (e) {
    console.error(`Immediate error setting up ${collectionName} snapshot:`, e);
    callbacks.onLoading(false);
  }

  return () => {
    if (unsub) unsub();
  };
}
