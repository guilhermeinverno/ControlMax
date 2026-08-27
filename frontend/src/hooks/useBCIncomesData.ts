import { useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { formatCurrencyBRL, parseCurrencyBRLToCents } from '../utils/currency';
import { subscribeTenantCollectionByDate } from '../utils/firestoreDateSubscription';
import { submitFinancialApproval } from '../utils/financialApproval';
import { financialFetchHeaders } from '../utils/financialFetchHeaders';
import type { HtmlFormSubmitEvent, HtmlInputChangeEvent } from '../types/reactEvents';
import type { BCIncome } from '../types/bcIncome';
import { todayDateString } from '../types/bcIncome';

export function useBCIncomesData(tenantId?: string, userName?: string, usuarioUnidades?: string[]) {
  const [activeTab, setActiveTab] = useState<'nuevo' | 'historico'>('nuevo');
  const [incomes, setIncomes] = useState<BCIncome[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [amountInput, setAmountInput] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BCIncome['category']>('deposit');
  const [formCnId, setFormCnId] = useState('cn_padrao');
  const [formCnName, setFormCnName] = useState('CN de la sociedad 6501');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState(todayDateString);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [incomeToApprove, setIncomeToApprove] = useState<BCIncome | null>(null);
  const [incomeToReject, setIncomeToReject] = useState<BCIncome | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    return subscribeTenantCollectionByDate<BCIncome>(
      'bc_incomes',
      tenantId,
      selectedDate,
      (docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as BCIncome,
      {
        onData: setIncomes,
        onError: setError,
        onLoading: setLoading,
      },
      usuarioUnidades
    );
  }, [tenantId, selectedDate, usuarioUnidades]);

  const handleAmountChange = (e: HtmlInputChangeEvent) => {
    setAmountInput(formatCurrencyBRL(e.target.value));
  };

  const handleCreateIncome = async (e: HtmlFormSubmitEvent) => {
    e.preventDefault();
    if (!tenantId) {
      setFormError('ID do inquilino não configurado.');
      return;
    }

    const valueCents = parseCurrencyBRLToCents(amountInput);
    if (valueCents <= 0) {
      setFormError('O valor do ingresso deve ser maior que $ 0,00.');
      return;
    }
    if (!description.trim()) {
      setFormError('A descrição é obrigatória.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      if (!auth?.currentUser) {
        throw new Error('Usuario no autenticado.');
      }
      const idempotencyKey = crypto.randomUUID();
      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/transactions/income', {
        method: 'POST',
        headers: financialFetchHeaders(token, idempotencyKey),
        body: JSON.stringify({
          mode: 'bc',
          cnId: formCnId,
          cnName: formCnName,
          amountCents: valueCents,
          comment: description.trim(),
          description: description.trim(),
          category,
          idempotencyKey,
        }),
      });
      const data = await response.json().catch(() => ({} as { error?: string }));
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao registrar ingresso.');
      }

      setFormSuccess('Ingresso de Centro de Negócios registrado com sucesso!');
      setAmountInput('');
      setDescription('');
      setCategory('deposit');
      setTimeout(() => {
        setActiveTab('historico');
        setFormSuccess(null);
      }, 1500);
    } catch (err) {
      console.error('Error creating BC Income:', err);
      setFormError(err instanceof Error ? err.message : 'Erro ao registrar ingresso. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveConfirm = async () => {
    if (!incomeToApprove) return;
    setActionInProgress(true);
    try {
      await submitFinancialApproval('bc_income', incomeToApprove.id, 'approved');
      setIncomeToApprove(null);
    } catch (err) {
      console.error('Error approving BC Income:', err);
      alert('Erro ao aprovar o ingresso.');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!incomeToReject) return;
    setActionInProgress(true);
    try {
      await submitFinancialApproval('bc_income', incomeToReject.id, 'rejected');
      setIncomeToReject(null);
    } catch (err) {
      console.error('Error rejecting BC Income:', err);
      alert('Erro ao rejeitar o ingresso.');
    } finally {
      setActionInProgress(false);
    }
  };

  return {
    activeTab,
    setActiveTab,
    incomes,
    loading,
    error,
    amountInput,
    description,
    setDescription,
    category,
    setCategory,
    formCnId,
    setFormCnId,
    formCnName,
    setFormCnName,
    submitting,
    formError,
    formSuccess,
    selectedDate,
    setSelectedDate,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    incomeToApprove,
    setIncomeToApprove,
    incomeToReject,
    setIncomeToReject,
    actionInProgress,
    handleAmountChange,
    handleCreateIncome,
    handleApproveConfirm,
    handleRejectConfirm,
  };
}
