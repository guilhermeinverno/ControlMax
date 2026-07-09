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
  TrendingDown,
  Clock,
  User,
  Building2,
  Check,
  X,
  PlusCircle,
  Info
} from 'lucide-react';

interface BCExpensesProps {
  onNavigate?: (screen: Screen) => void;
}

interface BCExpense {
  id: string;
  tenantId: string;
  cnId: string;
  cnName: string;
  userId: string;
  userName: string;
  amount: number;
  description: string;
  category: 'salary' | 'rent' | 'supplies' | 'transport' | 'other';
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Timestamp;
  createdAt: Timestamp;
}

const CATEGORY_MAP: Record<string, string> = {
  salary: 'Salário',
  rent: 'Aluguel',
  supplies: 'Suprimentos',
  transport: 'Transporte',
  other: 'Outro'
};

const fmt = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function BCExpenses({ onNavigate }: BCExpensesProps) {
  const { tenantId, role, userName, loading: tenantLoading } = useTenant();

  const isAdmin = role === 'admin';
  const isSupervisor = role === 'supervisor';
  const canWrite = isAdmin || isSupervisor;
  const isCollector = role === 'collector';

  // Modal control
  const [isNewExpenseOpen, setIsNewExpenseOpen] = useState(false);

  // New Expense Form State
  const [amountInput, setAmountInput] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'salary' | 'rent' | 'supplies' | 'transport' | 'other'>('supplies');
  const [formCnId, setFormCnId] = useState('cn_padrao');
  const [formCnName, setFormCnName] = useState('CN de la sociedad 6501');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // History / Consultation State
  const [expenses, setExpenses] = useState<BCExpense[]>([]);
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
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'salary' | 'rent' | 'supplies' | 'transport' | 'other'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Confirmations
  const [expenseToApprove, setExpenseToApprove] = useState<BCExpense | null>(null);
  const [expenseToReject, setExpenseToReject] = useState<BCExpense | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  const unsubRef = useRef<() => void>(() => {});

  // Real-time listener for expenses with resilient fallback query routing
  const fetchHistory = () => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);

    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Primary: Ordered by creation desc within the day
    const qWithOrder = query(
      collection(db, 'bc_expenses'),
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
        })) as BCExpense[];
        setExpenses(list);
        setLoading(false);
      }, (err) => {
        console.warn("Primary query failed (likely missing index). Attempting fallback without orderBy:", err);

        // Fallback 1: Date range but unordered
        const qNoOrder = query(
          collection(db, 'bc_expenses'),
          where('tenantId', '==', tenantId),
          where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
          where('createdAt', '<=', Timestamp.fromDate(endOfDay))
        );

        unsubRef.current = onSnapshot(qNoOrder, (snapshot) => {
          const list = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as BCExpense[];

          // Sort descending client-side
          list.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
          });

          setExpenses(list);
          setLoading(false);
        }, (fallbackErr) => {
          console.warn("Secondary query failed. Falling back to general tenant query:", fallbackErr);

          // Fallback 2: General tenant-wide query with client-side date filtering and sorting
          const qTenantOnly = query(
            collection(db, 'bc_expenses'),
            where('tenantId', '==', tenantId)
          );

          unsubRef.current = onSnapshot(qTenantOnly, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as BCExpense[];

            const filteredList = list.filter(item => {
              if (!item.createdAt) return false;
              const dVal = item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt.seconds * 1000);
              return dVal >= startOfDay && dVal <= endOfDay;
            });

            // Sort descending client-side
            filteredList.sort((a, b) => {
              const timeA = a.createdAt?.seconds || 0;
              const timeB = b.createdAt?.seconds || 0;
              return timeB - timeA;
            });

            setExpenses(filteredList);
            setLoading(false);
          }, (errFinal) => {
            console.error("Critical: BCExpenses fetch failed completely:", errFinal);
            setError("Erro ao carregar os dados de egresos do Firestore.");
            setLoading(false);
          });
        });
      });
    } catch (e) {
      console.error("Immediate error setting up bc_expenses snapshot:", e);
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

  const handleSearch = () => {
    fetchHistory();
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyBRL(e.target.value);
    setAmountInput(formatted);
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) {
      setFormError("ID do inquilino não configurado.");
      return;
    }

    const valueCents = parseCurrencyBRLToCents(amountInput);
    if (valueCents <= 0) {
      setFormError("O valor do egreso deve ser maior que $ 0,00.");
      return;
    }

    if (!description.trim() || description.trim().length < 3) {
      setFormError("A descrição é obrigatória e deve possuir no mínimo 3 caracteres.");
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
        createdAt: serverTimestamp()
      });

      setFormSuccess("Egreso de Centro de Negócios registrado com sucesso!");
      setAmountInput('');
      setDescription('');
      setCategory('supplies');

      // Close modal after showing success
      setTimeout(() => {
        setIsNewExpenseOpen(false);
        setFormSuccess(null);
      }, 1500);

    } catch (err) {
      console.error("Error creating BC Expense:", err);
      setFormError("Erro ao registrar egreso. Tente novamente.");
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
        approvedAt: serverTimestamp()
      });
      setExpenseToApprove(null);
    } catch (err) {
      console.error("Error approving BC Expense:", err);
      setError("Erro ao aprovar a despesa operatória.");
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
        approvedAt: serverTimestamp()
      });
      setExpenseToReject(null);
    } catch (err) {
      console.error("Error rejecting BC Expense:", err);
      setError("Erro ao rejeitar a despesa operatória.");
    } finally {
      setActionInProgress(false);
    }
  };

  // Compute stats for current selection
  const approvedTotal = expenses
    .filter(exp => exp.status === 'approved')
    .reduce((sum, exp) => sum + (exp.amount || 0), 0);

  const pendingExpensesList = expenses.filter(exp => exp.status === 'pending');
  const pendingCount = pendingExpensesList.length;
  const pendingTotal = pendingExpensesList.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  const rejectedExpensesList = expenses.filter(exp => exp.status === 'rejected');
  const rejectedCount = rejectedExpensesList.length;
  const rejectedTotal = rejectedExpensesList.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  // Client-side filtering
  const filteredExpenses = expenses.filter(exp => {
    if (statusFilter !== 'all' && exp.status !== statusFilter) {
      return false;
    }
    if (categoryFilter !== 'all' && exp.category !== categoryFilter) {
      return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const descMatches = (exp.description || '').toLowerCase().includes(q);
      const userMatches = (exp.userName || '').toLowerCase().includes(q);
      const catMatches = (CATEGORY_MAP[exp.category] || '').toLowerCase().includes(q);
      const amountMatches = String(exp.amount / 100).includes(q);
      return descMatches || userMatches || catMatches || amountMatches;
    }
    return true;
  });

  if (tenantLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 space-y-2 min-h-screen bg-[#F3F4F6]">
        <Loader2 className="w-8 h-8 animate-spin text-[#6B21A8]" />
        <p className="text-xs font-medium">Carregando dados do inquilino...</p>
      </div>
    );
  }

  // Access check card for collectors
  if (isCollector) {
    return (
      <div className="flex flex-col bg-[#F3F4F6] min-h-screen text-[#333333] -m-4 p-6">
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm p-6 max-w-md mx-auto mt-12 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Acesso restrito a administradores</h2>
          <p className="text-xs text-gray-500 mt-2">
            Seu perfil atual de Cobrador (Collector) não possui permissões para visualizar ou registrar saídas financeiras do Centro de Negócios.
          </p>
          <button
            onClick={() => onNavigate && onNavigate('dashboard')}
            className="mt-5 inline-flex items-center text-xs font-bold text-white bg-[#6B21A8] hover:bg-purple-800 px-4 py-2 rounded-full transition-colors cursor-pointer"
          >
            Voltar ao Painel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#F3F4F6] min-h-screen text-[#333333] -m-4">
      {/* Top Banner Header */}
      <div className="bg-[#6B21A8] text-white py-4 px-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold uppercase tracking-wider flex items-center">
            <DollarSign className="w-5 h-5 mr-1.5 text-red-400 bg-white rounded-full p-0.5" strokeWidth={3} />
            Egresos de Centro de Negócios (CN)
          </h1>
          <p className="text-xs text-purple-200 mt-1">
            Controle de saídas operacionais e despesas associadas diretamente aos Centros de Negócios.
          </p>
        </div>
        {canWrite && (
          <button
            onClick={() => setIsNewExpenseOpen(true)}
            className="self-start sm:self-auto bg-white text-[#6B21A8] hover:bg-purple-50 font-bold py-2 px-4 rounded-full text-xs transition-colors cursor-pointer flex items-center shadow-sm"
          >
            <PlusCircle className="w-4 h-4 mr-1.5 text-[#6B21A8]" />
            Novo Egreso
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Main Content Card Container */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-5 space-y-5">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-2">
            Consulta de Egresos / Despesas
          </h2>

          {/* Filtros no topo */}
          <div className="bg-gray-50 p-3.5 border border-gray-200 rounded-md grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
            {/* Date Picker */}
            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-gray-600 uppercase mb-1 flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1 text-purple-600" />
                Data
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 rounded p-2 text-xs bg-white text-[#333333] outline-none focus:border-[#6B21A8]"
              />
            </div>

            {/* Status Filter */}
            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-gray-600 uppercase mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded p-2 text-xs bg-white text-[#333333] outline-none focus:border-[#6B21A8]"
              >
                <option value="all">Todos os Status</option>
                <option value="pending">Pendentes</option>
                <option value="approved">Aprovados</option>
                <option value="rejected">Rejeitados</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-gray-600 uppercase mb-1">
                Categoria
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-gray-300 rounded p-2 text-xs bg-white text-[#333333] outline-none focus:border-[#6B21A8]"
              >
                <option value="all">Todas as Categorias</option>
                <option value="salary">Salário</option>
                <option value="rent">Aluguel</option>
                <option value="supplies">Suprimentos</option>
                <option value="transport">Transporte</option>
                <option value="other">Outro</option>
              </select>
            </div>

            {/* CN Mock Selector */}
            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-gray-600 uppercase mb-1">
                Centro de Negócios (CN)
              </label>
              <select
                disabled
                className="border border-gray-300 rounded p-2 text-xs bg-gray-100 text-gray-400 cursor-not-allowed outline-none"
              >
                <option value="all">Todos os CNs (Mock)</option>
              </select>
              {/* TODO: conectar Firestore v1.2 */}
            </div>

            {/* Buscar Button */}
            <div>
              <button
                onClick={handleSearch}
                className="w-full bg-[#16A34A] hover:bg-[#15803d] text-white font-bold py-2 px-4 rounded text-xs shadow-sm flex items-center justify-center cursor-pointer transition-colors"
              >
                <Search className="w-3.5 h-3.5 mr-1" />
                Buscar
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-300 rounded p-3 text-red-800 text-xs flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span>{error}</span>
            </div>
          )}

          {/* Totalizer Cards (Grid 3 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Total Saídas Aprovadas */}
            <div className="bg-red-50 border border-red-300 p-3.5 rounded flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-red-700 tracking-wider">Total Saídas Aprovadas</span>
                <h3 className="text-lg font-extrabold text-[#DC2626] mt-0.5">$ {fmt(approvedTotal)}</h3>
              </div>
              <TrendingDown className="w-6 h-6 text-red-600 opacity-60" />
            </div>

            {/* Aguardando Aprovação */}
            <div className="bg-yellow-50 border border-yellow-300 p-3.5 rounded flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-yellow-700 tracking-wider">Aguardando Aprovação</span>
                <h3 className="text-lg font-bold text-yellow-800 mt-0.5">
                  {pendingCount} reg. ($ {fmt(pendingTotal)})
                </h3>
              </div>
              <Clock className="w-6 h-6 text-yellow-600 opacity-60" />
            </div>

            {/* Rejeitados */}
            <div className="bg-gray-50 border border-gray-300 p-3.5 rounded flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-gray-700 tracking-wider">Rejeitados</span>
                <h3 className="text-lg font-bold text-gray-600 mt-0.5">
                  {rejectedCount} reg. ($ {fmt(rejectedTotal)})
                </h3>
              </div>
              <X className="w-6 h-6 text-gray-500 opacity-60" />
            </div>
          </div>

          {/* Search bar input */}
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

          {/* List Section with states */}
          {loading ? (
            <div className="space-y-2">
              <div className="animate-pulse h-16 bg-gray-100 rounded mb-2"></div>
              <div className="animate-pulse h-16 bg-gray-100 rounded mb-2"></div>
              <div className="animate-pulse h-16 bg-gray-100 rounded mb-2"></div>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 border border-dashed border-gray-200 rounded-md">
              <DollarSign className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-gray-400">Nenhum egreso encontrado para esta data</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredExpenses.map((expense) => {
                const createdAtDate = expense.createdAt
                  ? (expense.createdAt.toDate ? expense.createdAt.toDate() : new Date(expense.createdAt.seconds * 1000))
                  : new Date();

                return (
                  <div
                    key={expense.id}
                    className="bg-white border border-gray-300 rounded p-3 mb-2 flex flex-col justify-between hover:border-gray-400 transition-colors"
                  >
                    {/* Linha 1: descrição em negrito + valor -$ {fmt(amount)} em text-[#DC2626] */}
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold text-sm text-gray-800 break-words flex-1">
                        {expense.description}
                      </span>
                      <span className="text-[#DC2626] font-extrabold text-sm whitespace-nowrap">
                        -$ {fmt(expense.amount)}
                      </span>
                    </div>

                    {/* Linha 2: categoria (traduzida PT-BR) + CN + registrado por */}
                    <div className="text-xs text-gray-500 mt-1 space-y-0.5 sm:space-y-0 sm:flex sm:items-center sm:gap-x-4 flex-wrap">
                      <div>
                        Categoria: <strong className="text-gray-700">{CATEGORY_MAP[expense.category] || expense.category}</strong>
                      </div>
                      <span className="hidden sm:inline text-gray-300">|</span>
                      <div>
                        CN: <strong className="text-gray-700">{expense.cnName || 'CN Padrão'}</strong>
                      </div>
                      <span className="hidden sm:inline text-gray-300">|</span>
                      <div>
                        Registrado por: <strong className="text-gray-700">{expense.userName || 'Desconhecido'}</strong>
                      </div>
                    </div>

                    {/* Linha 3: data/hora + status badge */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-gray-100">
                      <div className="flex items-center text-[11px] text-gray-400">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        <span>{createdAtDate.toLocaleString('pt-BR')}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded ${
                          expense.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : expense.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {expense.status === 'pending' ? 'Pendente' : expense.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                        </span>
                      </div>
                    </div>

                    {/* Botões visíveis só para admin/supervisor E status='pending' */}
                    {canWrite && expense.status === 'pending' && (
                      <div className="flex gap-2 mt-3 pt-2.5 border-t border-gray-100">
                        <button
                          onClick={() => setExpenseToApprove(expense)}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold py-1.5 px-3 rounded flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          ✓ Aprovar
                        </button>
                        <button
                          onClick={() => setExpenseToReject(expense)}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold py-1.5 px-3 rounded flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          ✗ Rejeitar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal for Registering a New Expense */}
      {isNewExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center">
                <PlusCircle className="w-4 h-4 mr-1.5 text-[#6B21A8]" />
                Registrar Novo Egreso no CN
              </h2>
              <button
                onClick={() => {
                  setIsNewExpenseOpen(false);
                  setFormError(null);
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded text-xs flex items-center mt-4">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded text-xs flex items-center mt-4">
                <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0 text-green-600" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateExpense} className="space-y-4 mt-4">
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
                  className="border border-gray-300 rounded p-2.5 text-xs bg-white outline-none focus:border-[#6B21A8]"
                >
                  <option value="cn_padrao">CN de la sociedad 6501</option>
                  <option value="cn_b">CN Filial Principal</option>
                </select>
                <span className="text-[10px] text-gray-400 mt-1 italic">
                  * TODO: Vincular com centros de negócios reais em atualizações futuras.
                </span>
              </div>

              {/* Categoria */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">
                  Categoria de Saída <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="border border-gray-300 rounded p-2.5 text-xs bg-white outline-none focus:border-[#6B21A8]"
                >
                  <option value="supplies">Suprimentos</option>
                  <option value="salary">Salário</option>
                  <option value="rent">Aluguel</option>
                  <option value="transport">Transporte</option>
                  <option value="other">Outros</option>
                </select>
              </div>

              {/* Valor */}
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
                    className="w-full border border-gray-300 rounded p-2.5 pl-9 text-xs text-[#333333] outline-none font-bold focus:border-[#6B21A8]"
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
                  placeholder="Ex: Pagamento do aluguel da sede, compra de insumos operacionais, frete, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="border border-gray-300 rounded p-2.5 text-xs text-[#333333] outline-none focus:border-[#6B21A8]"
                />
              </div>

              {/* Status Notice */}
              <div className="bg-purple-50 border border-purple-100 p-2.5 rounded text-[11px] text-purple-800 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                <span>
                  {isAdmin
                    ? "Como Administrador, o egreso será automaticamente aprovado e deduzido do saldo."
                    : "Como Supervisor, o egreso será registrado como 'Pendente' para validação administrativa."}
                </span>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewExpenseOpen(false);
                    setFormError(null);
                  }}
                  className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-2.5 rounded-md text-xs transition-colors cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#16A34A] hover:bg-[#15803d] text-white font-bold py-2.5 rounded-md text-xs shadow-sm flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Salvar Egreso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Approve Modal */}
      <ConfirmModal
        isOpen={!!expenseToApprove}
        onClose={() => setExpenseToApprove(null)}
        onConfirm={handleApproveConfirm}
        title="Aprovar Egreso?"
        subtitle={`Deseja realmente aprovar este egreso no valor de $ ${expenseToApprove ? fmt(expenseToApprove.amount) : '0,00'}? Esta ação deduzirá o saldo do CN.`}
        confirmText={actionInProgress ? "Aprovando..." : "Sim, aprovar"}
        cancelText="Cancelar"
      />

      {/* Confirm Reject Modal */}
      <ConfirmModal
        isOpen={!!expenseToReject}
        onClose={() => setExpenseToReject(null)}
        onConfirm={handleRejectConfirm}
        title="Rejeitar Egreso?"
        subtitle={`Tem certeza que deseja rejeitar o egreso no valor de $ ${expenseToReject ? fmt(expenseToReject.amount) : '0,00'}?`}
        confirmText={actionInProgress ? "Rejeitando..." : "Sim, rejeitar"}
        cancelText="Cancelar"
      />
    </div>
  );
}
