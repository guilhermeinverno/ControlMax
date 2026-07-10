import { useEffect, useState } from 'react';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { formatCurrencyBRL, parseCurrencyBRLToCents } from '../utils/currency';
import { subscribeTenantCollectionByDate } from '../utils/firestoreDateSubscription';
import type { HtmlFormSubmitEvent, HtmlInputChangeEvent } from '../types/reactEvents';
import type { BCExpense } from '../types/bcExpense';
import { todayDateString } from '../types/bcExpense';

export function useBCExpensesData(tenantId?: string, userName?: string, isAdmin = false) {
  const [isNewExpenseOpen, setIsNewExpenseOpen] = useState(false);
  const [expenses, setExpenses] = useState<BCExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [amountInput, setAmountInput] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BCExpense['category']>('supplies');
  const [formCnId, setFormCnId] = useState('cn_padrao');
  const [formCnName, setFormCnName] = useState('CN de la sociedad 6501');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState(todayDateString);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | BCExpense['category']>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [expenseToApprove, setExpenseToApprove] = useState<BCExpense | null>(null);
  const [expenseToReject, setExpenseToReject] = useState<BCExpense | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    return subscribeTenantCollectionByDate<BCExpense>(
      'bc_expenses',
      tenantId,
      selectedDate,
      (docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as BCExpense,
      {
        onData: setExpenses,
        onError: setError,
        onLoading: setLoading,
      }
    );
  }, [tenantId, selectedDate]);

  const handleAmountChange = (e: HtmlInputChangeEvent) => {
    setAmountInput(formatCurrencyBRL(e.target.value));
  };

  const handleCreateExpense = async (e: HtmlFormSubmitEvent) => {
    e.preventDefault();
    if (!tenantId) {
      setFormError('ID do inquilino não configurado.');
      return;
    }

    const valueCents = parseCurrencyBRLToCents(amountInput);
    if (valueCents <= 0) {
      setFormError('O valor do egreso deve ser maior que $ 0,00.');
      return;
    }
    if (!description.trim() || description.trim().length < 3) {
      setFormError('A descrição é obrigatória e deve possuir no mínimo 3 caracteres.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      await addDoc(collection(db, 'bc_expenses'), {
        tenantId,
        cnId: formCnId,
        cnName: formCnName,
        userId: auth.currentUser?.uid || 'unknown',
        userName: userName || auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Usuário',
        amount: valueCents,
        description: description.trim(),
        category,
        status: isAdmin ? 'approved' : 'pending',
        createdAt: serverTimestamp(),
      });

      setFormSuccess('Egreso de Centro de Negócios registrado com sucesso!');
      setAmountInput('');
      setDescription('');
      setCategory('supplies');
      setTimeout(() => {
        setIsNewExpenseOpen(false);
        setFormSuccess(null);
      }, 1500);
    } catch (err) {
      console.error('Error creating BC Expense:', err);
      setFormError('Erro ao registrar egreso. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveConfirm = async () => {
    if (!expenseToApprove) return;
    setActionInProgress(true);
    try {
      await updateDoc(doc(db, 'bc_expenses', expenseToApprove.id), {
        status: 'approved',
        approvedBy: userName || auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Admin',
        approvedAt: serverTimestamp(),
      });
      setExpenseToApprove(null);
    } catch (err) {
      console.error('Error approving BC Expense:', err);
      setError('Erro ao aprovar a despesa operatória.');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!expenseToReject) return;
    setActionInProgress(true);
    try {
      await updateDoc(doc(db, 'bc_expenses', expenseToReject.id), {
        status: 'rejected',
        approvedBy: userName || auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Admin',
        approvedAt: serverTimestamp(),
      });
      setExpenseToReject(null);
    } catch (err) {
      console.error('Error rejecting BC Expense:', err);
      setError('Erro ao rejeitar a despesa operatória.');
    } finally {
      setActionInProgress(false);
    }
  };

  return {
    isNewExpenseOpen,
    setIsNewExpenseOpen,
    expenses,
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
    setFormError,
    formSuccess,
    selectedDate,
    setSelectedDate,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    searchQuery,
    setSearchQuery,
    expenseToApprove,
    setExpenseToApprove,
    expenseToReject,
    setExpenseToReject,
    actionInProgress,
    handleAmountChange,
    handleCreateExpense,
    handleApproveConfirm,
    handleRejectConfirm,
  };
}
