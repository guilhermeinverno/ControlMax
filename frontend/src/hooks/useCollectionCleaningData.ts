import { useEffect, useState } from 'react';
import {
  collection as firestoreCollection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getErrorMessage } from '../utils/errorMessage';
import type { CleaningCollection } from '../types/collectionCleaning';
import { todayDateString } from '../types/collectionCleaning';

function parseDayBounds(selectedDate: string): { startOfDay: Date; endOfDay: Date } {
  const [year, month, day] = selectedDate.split('-').map(Number);
  return {
    startOfDay: new Date(year, month - 1, day, 0, 0, 0, 0),
    endOfDay: new Date(year, month - 1, day, 23, 59, 59, 999),
  };
}

function applyClientSideDateFilter(
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

export function useCollectionCleaningData(tenantId?: string, userName?: string) {
  const [selectedDate, setSelectedDate] = useState(todayDateString);
  const [collections, setCollections] = useState<CleaningCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [collectionToCancel, setCollectionToCancel] = useState<CleaningCollection | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);

    const { startOfDay, endOfDay } = parseDayBounds(selectedDate);
    let unsub: (() => void) | null = null;

    const runSubscription = (useFallback: boolean) => {
      const q = useFallback
        ? query(firestoreCollection(db, 'collections'), where('tenantId', '==', tenantId))
        : query(
            firestoreCollection(db, 'collections'),
            where('tenantId', '==', tenantId),
            where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
            where('createdAt', '<=', Timestamp.fromDate(endOfDay)),
            orderBy('createdAt', 'desc')
          );

      return onSnapshot(
        q,
        (snapshot) => {
          const loaded = snapshot.docs.map(
            (docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as CleaningCollection
          );
          setCollections(useFallback ? applyClientSideDateFilter(loaded, startOfDay, endOfDay) : loaded);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Firestore onSnapshot error:', err);
          if (!useFallback) {
            if (unsub) unsub();
            unsub = runSubscription(true);
          } else {
            setError('Falha ao sincronizar as cobranças do banco de dados.');
            setLoading(false);
          }
        }
      );
    };

    unsub = runSubscription(false);
    return () => {
      if (unsub) unsub();
    };
  }, [tenantId, selectedDate]);

  const openCancelModal = (col: CleaningCollection) => {
    setCollectionToCancel(col);
    setCancelReason('');
    setModalOpen(true);
  };

  const confirmCancel = async () => {
    if (!collectionToCancel) return;
    if (cancelReason.trim().length < 10) {
      alert('O motivo do cancelamento deve conter no mínimo 10 caracteres.');
      return;
    }

    setCancelLoading(true);
    try {
      const colId = collectionToCancel.id;
      await updateDoc(doc(db, 'collections', colId), {
        status: 'cancelled',
        cancelReason: cancelReason,
        cancelledBy: userName || 'Admin/Supervisor',
        cancelledAt: serverTimestamp(),
      });

      const boxRef = doc(db, 'boxes', collectionToCancel.boxId);
      const boxSnap = await getDoc(boxRef);
      if (boxSnap.exists()) {
        const boxData = boxSnap.data();
        const newTotal = Math.max(0, (boxData.totalCollections || 0) - collectionToCancel.amount);
        const newFinal =
          (boxData.initialAmount || 0) +
          newTotal +
          (boxData.totalIncomes || 0) -
          (boxData.totalExpenses || 0) -
          (boxData.totalSales || 0) -
          (boxData.totalTransfers || 0);

        await updateDoc(boxRef, { totalCollections: newTotal, finalAmount: newFinal });
      }

      setInfoMessage('Cobrança cancelada e caixa correspondente atualizado com sucesso.');
      setTimeout(() => setInfoMessage(null), 4000);
      setModalOpen(false);
      setCollectionToCancel(null);
      setCancelReason('');
    } catch (err) {
      console.error('Error cancelling collection:', err);
      alert(`Erro ao tentar cancelar a cobrança: ${getErrorMessage(err)}`);
    } finally {
      setCancelLoading(false);
    }
  };

  return {
    selectedDate,
    setSelectedDate,
    collections,
    loading,
    error,
    modalOpen,
    setModalOpen,
    collectionToCancel,
    cancelReason,
    setCancelReason,
    cancelLoading,
    infoMessage,
    openCancelModal,
    confirmCancel,
  };
}
