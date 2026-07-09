import React, { useState, useEffect, useRef } from 'react';
import { Screen } from '../types';
import { db, auth } from '../lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { useTenant } from '../hooks/useTenant';
import { useBox } from '../hooks/useBox';
import { ConfirmModal } from './components/ConfirmModal';
import {
  formatCurrencyBRL,
  parseCurrencyBRLToCents
} from '../utils/currency';
import {
  DollarSign,
  History,
  Calendar,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Clock,
  User,
  Building2,
  Check,
  X,
  PlusCircle,
  Info
} from 'lucide-react';

interface BCIncomesProps {
  onNavigate?: (screen: Screen) => void;
}

interface BCIncome {
  id: string;
  tenantId: string;
  cnId: string;
  cnName: string;
  userId: string;
  userName: string;
  amount: number;           // centavos
  description: string;
  category: 'deposit' | 'transfer' | 'contribution' | 'other';
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: any; // FIXED_BY_SCRIPT
  createdAt?: any; // FIXED_BY_SCRIPT
}

const CATEGORY_MAP: Record<string, string> = {
  deposit: 'Depósito Bancário',
  transfer: 'Transferência Pix',
  contribution: 'Aporte de Capital',
  other: 'Outros Recebimentos'
};

const fmt = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function BCIncomes({ onNavigate }: BCIncomesProps) {
  const { tenantId, role, userName, isSuperAdmin, loading: tenantLoading } = useTenant();
  const { activeBox } = useBox();

  const isAdminOrSupervisor = role === 'admin' || role === 'supervisor' || role === 'superadmin' || isSuperAdmin;

  // Active Tab
  const [activeTab, setActiveTab] = useState<'nuevo' | 'historico'>('nuevo');

  // New Income Form State
  const [amountInput, setAmountInput] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'deposit' | 'transfer' | 'contribution' | 'other'>('deposit');
  const [formCnId, setFormCnId] = useState('cn_padrao');
  const [formCnName, setFormCnName] = useState('CN de la sociedad 6501');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // History State
  const [incomes, setIncomes] = useState<BCIncome[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals for Approval/Rejection
  const [incomeToApprove, setIncomeToApprove] = useState<BCIncome | null>(null);
  const [incomeToReject, setIncomeToReject] = useState<BCIncome | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  const unsubRef = useRef<() => void>(() => {});

  // Real-time listener with fallback query
  const fetchHistory = () => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);

    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const qWithOrder = query(
      collection(db, 'bc_incomes'),
      where('tenantId', '==', tenantId),
      where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
      where('createdAt', '<=', Timestamp.fromDate(endOfDay)),
      orderBy('createdAt', 'desc')
    );

    try {
      unsubRef.current = onSnapshot(qWithOrder, (snapshot) => {
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as BCIncome[];
        setIncomes(list);
        setLoading(false);
      }, (err) => {
        console.warn("Index build required, trying query without orderBy:", err);
        
        // Fallback 1: Date range, no orderBy
        const qNoOrder = query(
          collection(db, 'bc_incomes'),
          where('tenantId', '==', tenantId),
          where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
          where('createdAt', '<=', Timestamp.fromDate(endOfDay))
        );

        unsubRef.current = onSnapshot(qNoOrder, (snapshot) => {
          const list = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as BCIncome[];
          
          // Sort client-side desc
          list.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
          });
          setIncomes(list);
          setLoading(false);
        }, (fallbackErr) => {
          console.warn("Date index failing, fallback to general tenant query:", fallbackErr);

          // Fallback 2: General query for tenant, filtering date on client side
          const qTenantOnly = query(
            collection(db, 'bc_incomes'),
            where('tenantId', '==', tenantId)
          );

          unsubRef.current = onSnapshot(qTenantOnly, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as BCIncome[];

            // Filter by date client-side
            const filteredList = list.filter(item => {
              if (!item.createdAt) return false;
              const date = item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt.seconds * 1000);
              return date >= startOfDay && date <= endOfDay;
            });

            // Sort descending client-side
            filteredList.sort((a, b) => {
              const timeA = a.createdAt?.seconds || 0;
              const timeB = b.createdAt?.seconds || 0;
              return timeB - timeA;
            });

            setIncomes(filteredList);
            setLoading(false);
          }, (errFinal) => {
            console.error("Critical: BCIncomes fetch failed:", errFinal);
            setError("Erro ao carregar os dados de ingressos.");
            setLoading(false);
          });
        });
      });
    } catch (e) {
      console.error("Immediate error setting up bc_incomes snapshot:", e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    return () => {
      if (unsubRef.current) {
        unsubRef.current();
      }
    };
  }, [tenantId, selectedDate]);

  // Form input formatter
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyBRL(e.target.value);
    setAmountInput(formatted);
  };

  // Submit Handler for New Income
  const handleCreateIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) {
      setFormError("ID do inquilino não configurado.");
      return;
    }

    const valueCents = parseCurrencyBRLToCents(amountInput);
    if (valueCents <= 0) {
      setFormError("O valor do ingresso deve ser maior que $ 0,00.");
      return;
    }

    if (!description.trim()) {
      setFormError("A descrição é obrigatória.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      await addDoc(collection(db, 'bc_incomes'), {
        tenantId,
        cnId: formCnId,
        cnName: formCnName,
        userId: auth.currentUser?.uid || 'unknown',
        userName: userName || auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Usuário',
        amount: valueCents,
        description: description.trim(),
        category,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      setFormSuccess("Ingresso de Centro de Negócios registrado com sucesso!");
      setAmountInput('');
      setDescription('');
      setCategory('deposit');

      // Switch to history tab after 1.5 seconds so they see it
      setTimeout(() => {
        setActiveTab('historico');
        setFormSuccess(null);
      }, 1500);

    } catch (err) {
      console.error("Error creating BC Income:", err);
      setFormError("Erro ao registrar ingresso. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  // Approval/Rejection actions
  const handleApproveConfirm = async () => {
    if (!incomeToApprove) return;
    setActionInProgress(true);
    try {
      await updateDoc(doc(db, 'bc_incomes', incomeToApprove.id), {
        status: 'approved',
        approvedBy: auth.currentUser?.uid || 'unknown',
        approvedAt: serverTimestamp()
      });
      setIncomeToApprove(null);
    } catch (err) {
      console.error("Error approving BC Income:", err);
      alert("Erro ao aprovar o ingresso.");
    } finally {
      setActionInProgress(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!incomeToReject) return;
    setActionInProgress(true);
    try {
      await updateDoc(doc(db, 'bc_incomes', incomeToReject.id), {
        status: 'rejected',
        approvedBy: auth.currentUser?.uid || 'unknown',
        approvedAt: serverTimestamp()
      });
      setIncomeToReject(null);
    } catch (err) {
      console.error("Error rejecting BC Income:", err);
      alert("Erro ao rejeitar o ingresso.");
    } finally {
      setActionInProgress(false);
    }
  };

  // Computed totalizers based on selected day's incomes
  const totalApproved = incomes
    .filter(inc => inc.status === 'approved')
    .reduce((sum, inc) => sum + (inc.amount || 0), 0);

  const pendingCount = incomes.filter(inc => inc.status === 'pending').length;
  const rejectedCount = incomes.filter(inc => inc.status === 'rejected').length;

  // Filter list client-side
  const filteredIncomes = incomes.filter(inc => {
    // 1. Status Filter
    if (statusFilter !== 'all' && inc.status !== statusFilter) {
      return false;
    }

    // 2. Search query
    if (searchQuery.trim() !== '') {
      const queryLower = searchQuery.toLowerCase();
      const descMatches = (inc.description || '').toLowerCase().includes(queryLower);
      const userMatches = (inc.userName || '').toLowerCase().includes(queryLower);
      const catMatches = (CATEGORY_MAP[inc.category] || '').toLowerCase().includes(queryLower);
      const amountMatches = String(inc.amount / 100).includes(queryLower);

      return descMatches || userMatches || catMatches || amountMatches;
    }

    return true;
  });

  if (tenantLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 space-y-2 min-h-screen bg-[#F3F4F6]">
        <Loader2 className="w-8 h-8 animate-spin text-[#84CC16]" />
        <p className="text-xs font-medium">Carregando dados do inquilino...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#F3F4F6] min-h-screen text-[#333333] -m-4">
      {/* Top Banner Header */}
      <div className="bg-[#6B21A8] text-white py-4 px-5 shadow-sm">
        <h1 className="text-lg font-bold uppercase tracking-wider flex items-center">
          <DollarSign className="w-5 h-5 mr-1.5 text-[#84CC16] bg-white rounded-full p-0.5" strokeWidth={3} />
          Ingressos de Centro de Negócios (CN)
        </h1>
        <p className="text-xs text-purple-200 mt-1">
          Registre e autorize depósitos, transferências e aportes realizados diretamente no CN.
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Tabs Headers */}
        <div className="flex space-x-1 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('nuevo')}
            className={`flex items-center text-xs font-bold py-2.5 px-4 rounded-t-lg transition-all border-b-2 ${
              activeTab === 'nuevo'
                ? 'border-[#84CC16] bg-white text-[#6B21A8] shadow-sm'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <PlusCircle className="w-4 h-4 mr-1.5 text-[#84CC16]" />
            Novo Ingresso
          </button>

          <button
            onClick={() => setActiveTab('historico')}
            className={`flex items-center text-xs font-bold py-2.5 px-4 rounded-t-lg transition-all border-b-2 ${
              activeTab === 'historico'
                ? 'border-[#84CC16] bg-white text-[#6B21A8] shadow-sm'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <History className="w-4 h-4 mr-1.5 text-purple-600" />
            Histórico de Ingressos
          </button>
        </div>

        {/* Form / Content Box */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-5">
          {activeTab === 'nuevo' && (
            <form onSubmit={handleCreateIncome} className="space-y-4">
              <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-2">
                Registrar Novo Ingresso no CN
              </h2>

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded text-xs flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded text-xs flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0 text-green-600" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* CN - Mock Select */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">
                  Centro de Negócios (CN) <span className="text-red-500">*</span>
                </label>
                <select
                  value={formCnId}
                  onChange={(e) => {
                    setFormCnId(e.target.value);
                    setFormCnName(e.target.options[e.target.selectedIndex].text);
                  }}
                  className="border border-gray-300 rounded p-2.5 text-sm bg-white outline-none focus:border-[#6B21A8]"
                >
                  <option value="cn_padrao">CN de la sociedad 6501</option>
                  <option value="cn_b">CN Filial Principal</option>
                </select>
                <span className="text-[10px] text-gray-400 mt-1 italic">
                  * TODO: Vincular com centros de negócios reais em atualizações futuras.
                </span>
              </div>

              {/* Caixa ativa status */}
              <div className="flex items-center space-x-2 bg-purple-50 border border-purple-100 p-2.5 rounded text-xs text-purple-800">
                <Info className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <span>
                  {activeBox ? (
                    <>Suas operações de caixa estão abertas em: <strong>{activeBox.cnName}</strong>.</>
                  ) : (
                    <>Você não possui uma caixa aberta atualmente, mas pode registrar ingressos diretos ao CN.</>
                  )}
                </span>
              </div>

              {/* Categoria */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">
                  Categoria de Entrada <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="border border-gray-300 rounded p-2.5 text-sm bg-white outline-none focus:border-[#6B21A8]"
                >
                  <option value="deposit">Depósito Bancário</option>
                  <option value="transfer">Transferência Pix</option>
                  <option value="contribution">Aporte de Capital</option>
                  <option value="other">Outros Recebimentos</option>
                </select>
              </div>

              {/* Valor em $ */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">
                  Valor ($) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm text-gray-500 font-bold">$</span>
                  <input
                    type="text"
                    required
                    value={amountInput}
                    onChange={handleAmountChange}
                    placeholder="0,00"
                    className="w-full border border-gray-300 rounded p-2.5 pl-9 text-sm text-[#333333] outline-none font-bold focus:border-[#6B21A8]"
                  />
                </div>
              </div>

              {/* Descrição */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">
                  Descrição / Comprovante <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ex: Depósito ref. cobrança geral, transferência sócio investidor, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="border border-gray-300 rounded p-2.5 text-sm text-[#333333] outline-none focus:border-[#6B21A8]"
                />
              </div>

              {/* Botões */}
              <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#16A34A] hover:bg-[#15803d] text-white font-bold py-3 rounded-md text-xs shadow-sm flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Salvar Ingresso
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('historico')}
                  className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-md text-xs shadow-sm transition-colors cursor-pointer flex items-center justify-center"
                >
                  <History className="w-4 h-4 mr-2 text-purple-600" />
                  Ver Histórico
                </button>
              </div>
            </form>
          )}

          {activeTab === 'historico' && (
            <div className="space-y-5">
              <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-2">
                Consulta de Ingressos por Dia
              </h2>

              {/* Filtros no topo */}
              <div className="bg-gray-50 p-3 border border-gray-200 rounded-md grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
                {/* Date Picker */}
                <div className="flex flex-col">
                  <label className="text-[11px] font-bold text-gray-600 uppercase mb-1 flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-purple-600" />
                    Data Selecionada
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="border border-gray-300 rounded p-2 text-xs bg-white text-[#333333]"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex flex-col">
                  <label className="text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Status do Ingresso
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded p-2 text-xs bg-white text-[#333333]"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="pending">Pendentes</option>
                    <option value="approved">Aprovados</option>
                    <option value="rejected">Rejeitados</option>
                  </select>
                </div>

                {/* CN Mock Selector */}
                <div className="flex flex-col">
                  <label className="text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Centro de Negócios (CN)
                  </label>
                  <select
                    disabled
                    className="border border-gray-300 rounded p-2 text-xs bg-gray-100 text-gray-500 cursor-not-allowed"
                  >
                    <option value="all">Todos os CNs (Mock)</option>
                  </select>
                  {/* TODO: Vincular com centro de negócios reais em atualizações futuras */}
                </div>

                {/* Buscar Button */}
                <div>
                  <button
                    onClick={fetchHistory}
                    className="w-full bg-[#16A34A] hover:bg-[#15803d] text-white font-bold py-2 px-4 rounded text-xs shadow-sm flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <Search className="w-3.5 h-3.5 mr-1" />
                    Buscar
                  </button>
                </div>
              </div>

              {/* Real-time Loading or General Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded text-xs flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  <span>{error}</span>
                </div>
              )}

              {/* Totalizer Cards (Grid 3 Columns) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Total Entradas (Approved) */}
                <div className="bg-green-50 border border-green-300 p-3 rounded shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-green-700 tracking-wider">Total Entradas</span>
                    <h3 className="text-lg font-bold text-[#16A34A] mt-0.5">$ {fmt(totalApproved)}</h3>
                  </div>
                  <TrendingUp className="w-6 h-6 text-green-600 opacity-60" />
                </div>

                {/* Pendentes */}
                <div className="bg-yellow-50 border border-yellow-300 p-3 rounded shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-yellow-700 tracking-wider">Pendentes</span>
                    <h3 className="text-lg font-bold text-yellow-800 mt-0.5">{pendingCount} registros</h3>
                  </div>
                  <Clock className="w-6 h-6 text-yellow-600 opacity-60" />
                </div>

                {/* Rejeitados */}
                <div className="bg-red-50 border border-red-300 p-3 rounded shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-red-700 tracking-wider">Rejeitados</span>
                    <h3 className="text-lg font-bold text-red-800 mt-0.5">{rejectedCount} registros</h3>
                  </div>
                  <X className="w-6 h-6 text-red-600 opacity-60" />
                </div>
              </div>

              {/* Text Search input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Pesquisar por descrição, usuário, categoria ou valor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border border-gray-300 rounded p-2 pl-9 text-xs text-[#333333] outline-none focus:border-[#6B21A8]"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
              </div>

              {/* List of Incomes */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                  <p className="text-[11px] font-medium">Carregando ingressos...</p>
                </div>
              ) : filteredIncomes.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 border border-dashed border-gray-200 rounded-md">
                  <DollarSign className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-600">Nenhum ingresso encontrado para esta data</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Cadastre uma nova entrada ou tente outra data.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredIncomes.map((income) => {
                    const createdAtDate = income.createdAt
                      ? (income.createdAt.toDate ? income.createdAt.toDate() : new Date(income.createdAt.seconds * 1000))
                      : null;

                    return (
                      <div
                        key={income.id}
                        className="bg-white border border-gray-300 rounded-md p-3.5 shadow-xs flex flex-col justify-between hover:border-gray-400 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div>
                            <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                              <span className="text-xs font-bold text-gray-800">
                                {CATEGORY_MAP[income.category] || 'Ingresso'}
                              </span>
                              <span className="text-[9px] text-gray-400 font-mono">
                                #{income.id.substring(0, 6)}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                income.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : income.status === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {income.status === 'pending' ? 'Pendente' : income.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{income.description}</p>
                          </div>

                          <div className="text-right flex flex-row sm:flex-col items-baseline sm:items-end justify-between sm:justify-start gap-1">
                            <span className="text-sm font-bold text-green-600">
                              $ {fmt(income.amount)}
                            </span>
                          </div>
                        </div>

                        {/* Metadata Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-gray-100 text-[11px] text-gray-500">
                          <div className="flex items-center">
                            <Building2 className="w-3.5 h-3.5 text-gray-400 mr-1.5 flex-shrink-0" />
                            <span>CN: <strong className="text-gray-700">{income.cnName || 'CN Padrão'}</strong></span>
                          </div>

                          <div className="flex items-center">
                            <User className="w-3.5 h-3.5 text-gray-400 mr-1.5 flex-shrink-0" />
                            <span>Por: <strong className="text-gray-700">{income.userName || 'Desconhecido'}</strong></span>
                          </div>

                          <div className="flex items-center">
                            <Clock className="w-3.5 h-3.5 text-gray-400 mr-1.5 flex-shrink-0" />
                            <span>{createdAtDate ? createdAtDate.toLocaleString('pt-BR') : 'Data não registrada'}</span>
                          </div>
                        </div>

                        {/* Quick actions for Admins / Supervisors */}
                        {isAdminOrSupervisor && income.status === 'pending' && (
                          <div className="flex space-x-2 mt-4 pt-3 border-t border-gray-100">
                            <button
                              onClick={() => setIncomeToApprove(income)}
                              className="flex-1 bg-[#16A34A] hover:bg-[#15803d] text-white text-[11px] font-bold py-2 px-3 rounded flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                            >
                              <Check className="w-3.5 h-3.5 mr-1" />
                              Aprovar
                            </button>
                            <button
                              onClick={() => setIncomeToReject(income)}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold py-2 px-3 rounded flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                            >
                              <X className="w-3.5 h-3.5 mr-1" />
                              Rejeitar
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirm Approve Modal */}
      <ConfirmModal
        isOpen={!!incomeToApprove}
        onClose={() => setIncomeToApprove(null)}
        onConfirm={handleApproveConfirm}
        title="Aprovar Ingresso?"
        subtitle={`Deseja realmente aprovar este ingresso no valor de $ ${incomeToApprove ? fmt(incomeToApprove.amount) : '0,00'}? Esta ação atualizará o saldo do CN.`}
        confirmText={actionInProgress ? "Aprovando..." : "Sim, aprovar"}
        cancelText="Cancelar"
      />

      {/* Confirm Reject Modal */}
      <ConfirmModal
        isOpen={!!incomeToReject}
        onClose={() => setIncomeToReject(null)}
        onConfirm={handleRejectConfirm}
        title="Rejeitar Ingresso?"
        subtitle={`Tem certeza que deseja rejeitar o ingresso no valor de $ ${incomeToReject ? fmt(incomeToReject.amount) : '0,00'}?`}
        confirmText={actionInProgress ? "Rejeitando..." : "Sim, rejeitar"}
        cancelText="Cancelar"
      />
    </div>
  );
}
