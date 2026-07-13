import { useEffect, useState } from 'react';
import { getErrorMessage } from '../utils/errorMessage';
import type { CleaningCollection } from '../types/collectionCleaning';
import { todayDateString } from '../types/collectionCleaning';
import { cancelCollectionAndUpdateBox } from '../utils/collectionCleaningCancel';
import { subscribeCleaningCollections } from '../utils/collectionCleaningSubscription';

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
    return subscribeCleaningCollections(
      tenantId,
      selectedDate,
      setCollections,
      setLoading,
      (message) => setError(message)
    );
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
      await cancelCollectionAndUpdateBox(collectionToCancel, cancelReason, userName);
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
