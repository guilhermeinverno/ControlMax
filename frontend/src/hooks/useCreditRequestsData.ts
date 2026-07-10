import { useEffect, useState } from 'react';
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { getErrorMessage } from '../utils/errorMessage';
import { formatCurrencyBRL, parseCurrencyBRLToCents } from '../utils/currency';
import type { HtmlFormSubmitEvent, HtmlInputChangeEvent } from '../types/reactEvents';
import {
  mapCreditRequestDoc,
  sortCreditRequestsByDate,
  type CreditRequest,
} from '../utils/creditRequestMapper';

function calculateClientScore(clientDoc: string, clientName: string): number {
  const scoreSeed = (clientDoc + clientName)
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return 40 + (scoreSeed % 61);
}

export function useCreditRequestsData(tenantId?: string, userName?: string) {
  const [requests, setRequests] = useState<CreditRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientDoc, setNewClientDoc] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newObservations, setNewObservations] = useState('');
  const [savingNew, setSavingNew] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [confirmAction, setConfirmAction] = useState<{
    type: 'approve' | 'reject';
    requestId: string;
  } | null>(null);
  const [savingActionId, setSavingActionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);

    const qWithOrder = query(
      collection(db, 'credit_requests'),
      where('tenantId', '==', tenantId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      qWithOrder,
      (snapshot) => {
        setRequests(snapshot.docs.map(mapCreditRequestDoc));
        setLoading(false);
      },
      (err) => {
        console.warn('Index not found or permission error, attempting query without order:', err);

        const qWithoutOrder = query(
          collection(db, 'credit_requests'),
          where('tenantId', '==', tenantId),
          limit(50)
        );

        const unsubscribeFallback = onSnapshot(
          qWithoutOrder,
          (snapshot) => {
            setRequests(sortCreditRequestsByDate(snapshot.docs.map(mapCreditRequestDoc)));
            setLoading(false);
          },
          (fallbackErr) => {
            console.error('Firestore loading error on fallback query:', fallbackErr);
            setError('Erro ao carregar solicitações de crédito do servidor.');
            setLoading(false);
          }
        );

        return () => unsubscribeFallback();
      }
    );

    return () => unsubscribe();
  }, [tenantId]);

  const resetNewForm = () => {
    setNewClientName('');
    setNewClientDoc('');
    setNewAmount('');
    setNewObservations('');
  };

  const openAddModal = () => {
    setModalError(null);
    setShowAddModal(true);
  };

  const handleCreateRequest = async (e: HtmlFormSubmitEvent) => {
    e.preventDefault();
    if (!tenantId || !userName) return;

    const parsedAmountCents = parseCurrencyBRLToCents(newAmount);
    if (parsedAmountCents <= 0) {
      setModalError('Por favor, insira um valor válido de crédito.');
      return;
    }

    setSavingNew(true);
    setModalError(null);

    try {
      await addDoc(collection(db, 'credit_requests'), {
        tenantId,
        clientId: '',
        clientName: newClientName.trim(),
        clientDoc: newClientDoc.trim(),
        amount: parsedAmountCents,
        requestedBy: userName,
        requestedById: auth.currentUser?.uid || 'test-user-id',
        status: 'pending',
        score: calculateClientScore(newClientDoc, newClientName),
        currentBalance: 0,
        observations: newObservations.trim(),
        createdAt: serverTimestamp(),
        historyLogs: [
          {
            time: new Date().toLocaleString('pt-BR'),
            action: 'Criado',
            user: userName,
            details: 'Solicitação criada',
          },
        ],
      });

      resetNewForm();
      setShowAddModal(false);
    } catch (err: unknown) {
      console.error('Error creating credit request document:', err);
      setModalError(getErrorMessage(err) || 'Erro ao salvar solicitação. Verifique os privilégios.');
    } finally {
      setSavingNew(false);
    }
  };

  const handleAmountChange = (e: HtmlInputChangeEvent) => {
    setNewAmount(formatCurrencyBRL(e.target.value));
  };

  const handleConfirmAction = async () => {
    if (!confirmAction || !userName) return;

    const { type, requestId } = confirmAction;
    setConfirmAction(null);
    setSavingActionId(requestId);
    setActionError(null);

    try {
      const isApproved = type === 'approve';
      await updateDoc(doc(db, 'credit_requests', requestId), {
        status: isApproved ? 'approved' : 'rejected',
        reviewedAt: serverTimestamp(),
        reviewedBy: userName,
        reviewedById: auth.currentUser?.uid || 'test-user-id',
        historyLogs: arrayUnion({
          time: new Date().toLocaleString('pt-BR'),
          action: isApproved ? 'Aprovado' : 'Rejeitado',
          user: userName,
          details: isApproved ? 'Crédito aprovado manualmente' : 'Crédito rejeitado manualmente',
        }),
      });
    } catch (err: unknown) {
      console.error('Error resolving credit request action:', err);
      setActionError('Não foi possível processar a ação. Sem permissões de gravação.');
    } finally {
      setSavingActionId(null);
    }
  };

  return {
    requests,
    loading,
    error,
    actionError,
    showAddModal,
    setShowAddModal,
    newClientName,
    setNewClientName,
    newClientDoc,
    setNewClientDoc,
    newAmount,
    newObservations,
    setNewObservations,
    savingNew,
    modalError,
    confirmAction,
    setConfirmAction,
    savingActionId,
    openAddModal,
    handleCreateRequest,
    handleAmountChange,
    handleConfirmAction,
  };
}
