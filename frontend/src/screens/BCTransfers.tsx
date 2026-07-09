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
  Clock,
  User,
  Building2,
  Check,
  X,
  PlusCircle,
  Info,
  ArrowRightLeft,
  ArrowRight
} from 'lucide-react';

interface BCTransfersProps {
  onNavigate?: (screen: Screen) => void;
}

interface BCTransfer {
  id: string;
  tenantId: string;
  fromType: 'collector' | 'cn';   // quem envia
  fromId: string;                  // userId ou cnId
  fromName: string;
  toCnId: string;                  // CN destino
  toCnName: string;
  amount: number;                  // centavos
  description: string;
  status: 'pending' | 'confirmed' | 'rejected';
  confirmedBy?: string;
  confirmedAt?: any; // FIXED_BY_SCRIPT
  boxId?: string;                  // se veio de uma caixa
  createdAt?: any; // FIXED_BY_SCRIPT
}

const fmt = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function BCTransfers({ onNavigate }: BCTransfersProps) {
  const { tenantId, role, userName, isSuperAdmin, loading: tenantLoading } = useTenant();

  const isAdminOrSupervisor = role === 'admin' || role === 'supervisor' || role === 'superadmin' || isSuperAdmin;

  // Active Tab
  const [activeTab, setActiveTab] = useState<'nuevo' | 'historico'>('nuevo');

  // New Transfer Form State
  const [fromType, setFromType] = useState<'collector' | 'cn'>('collector');
  const [fromName, setFromName] = useState('');
  const [toCnId, setToCnId] = useState('cn_padrao');
  const [toCnName, setToCnName] = useState('CN de la sociedad 6501');
  const [amountInput, setAmountInput] = useState('');
  const [description, setDescription] = useState('');
  const [boxId, setBoxId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // History State
  const [transfers, setTransfers] = useState<BCTransfer[]>([]);
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'rejected'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'collector' | 'cn'>('all');
  const [targetCnFilter, setTargetCnFilter] = useState<'all' | 'cn_padrao' | 'cn_b'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals for Confirmation/Rejection
  const [transferToConfirm, setTransferToConfirm] = useState<BCTransfer | null>(null);
  const [transferToReject, setTransferToReject] = useState<BCTransfer | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  const unsubRef = useRef<() => void>(() => {});

  // Sync fromName default value on load/fromType change
  useEffect(() => {
    if (fromType === 'collector') {
      setFromName(userName || '');
    } else {
      setFromName('CN Filial Principal');
    }
  }, [fromType, userName]);

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
      collection(db, 'bc_transfers'),
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
        })) as BCTransfer[];
        setTransfers(list);
        setLoading(false);
      }, (err) => {
        console.warn("Index build required for transfers, trying query without orderBy:", err);
        
        // Fallback 1: Date range, no orderBy
        const qNoOrder = query(
          collection(db, 'bc_transfers'),
          where('tenantId', '==', tenantId),
          where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
          where('createdAt', '<=', Timestamp.fromDate(endOfDay))
        );

        unsubRef.current = onSnapshot(qNoOrder, (snapshot) => {
          const list = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as BCTransfer[];
          
          // Sort client-side desc
          list.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
          });
          setTransfers(list);
          setLoading(false);
        }, (fallbackErr) => {
          console.warn("Date index failing for transfers, fallback to general tenant query:", fallbackErr);

          // Fallback 2: General query for tenant, filtering date on client side
          const qTenantOnly = query(
            collection(db, 'bc_transfers'),
            where('tenantId', '==', tenantId)
          );

          unsubRef.current = onSnapshot(qTenantOnly, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as BCTransfer[];

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

            setTransfers(filteredList);
            setLoading(false);
          }, (errFinal) => {
            console.error("Critical: BCTransfers fetch failed:", errFinal);
            setError("Erro ao carregar os dados de transferências.");
            setLoading(false);
          });
        });
      });
    } catch (e) {
      console.error("Immediate error setting up bc_transfers snapshot:", e);
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

  // Submit Handler for New Transfer
  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) {
      setFormError("ID do inquilino não configurado.");
      return;
    }

    const valueCents = parseCurrencyBRLToCents(amountInput);
    if (valueCents <= 0) {
      setFormError("O valor da transferência deve ser maior que $ 0,00.");
      return;
    }

    if (!fromName.trim()) {
      setFormError("O nome de origem é obrigatório.");
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
      await addDoc(collection(db, 'bc_transfers'), {
        tenantId,
        fromType,
        fromId: auth.currentUser?.uid || 'unknown',
        fromName: fromName.trim(),
        toCnId,
        toCnName,
        amount: valueCents,
        description: description.trim(),
        status: 'pending',
        boxId: fromType === 'collector' ? (boxId.trim() || '') : '',
        createdAt: serverTimestamp(),
      });

      setFormSuccess("Transferência registrada com sucesso!");
      setAmountInput('');
      setDescription('');
      setBoxId('');
      
      if (fromType === 'collector') {
        setFromName(userName || '');
      }

      // Switch to history tab after 1.5 seconds
      setTimeout(() => {
        setActiveTab('historico');
        setFormSuccess(null);
      }, 1500);

    } catch (err) {
      console.error("Error creating BCTransfer:", err);
      setFormError("Erro ao registrar transferência. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  // Approval/Rejection actions
  const handleConfirmTransfer = async () => {
    if (!transferToConfirm) return;
    setActionInProgress(true);
    try {
      await updateDoc(doc(db, 'bc_transfers', transferToConfirm.id), {
        status: 'confirmed',
        confirmedBy: userName || auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'unknown',
        confirmedAt: serverTimestamp()
      });
      setTransferToConfirm(null);
    } catch (err) {
      console.error("Error confirming BCTransfer:", err);
      alert("Erro ao confirmar transferência.");
    } finally {
      setActionInProgress(false);
    }
  };

  const handleRejectTransfer = async () => {
    if (!transferToReject) return;
    setActionInProgress(true);
    try {
      await updateDoc(doc(db, 'bc_transfers', transferToReject.id), {
        status: 'rejected',
        confirmedBy: userName || auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'unknown',
        confirmedAt: serverTimestamp()
      });
      setTransferToReject(null);
    } catch (err) {
      console.error("Error rejecting BCTransfer:", err);
      alert("Erro ao rejeitar transferência.");
    } finally {
      setActionInProgress(false);
    }
  };

  // Computed totalizers based on selected day's transfers
  const totalConfirmed = transfers
    .filter(t => t.status === 'confirmed')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const pendingTransfers = transfers.filter(t => t.status === 'pending');
  const pendingCount = pendingTransfers.length;
  const totalPending = pendingTransfers.reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalDay = transfers.reduce((sum, t) => sum + (t.amount || 0), 0);

  // Filter list client-side
  const filteredTransfers = transfers.filter(t => {
    // 1. Status Filter
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;

    // 2. Type Filter
    if (typeFilter !== 'all' && t.fromType !== typeFilter) return false;

    // 3. Target CN Filter
    if (targetCnFilter !== 'all' && t.toCnId !== targetCnFilter) return false;

    // 4. Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchFromName = (t.fromName || '').toLowerCase().includes(q);
      const matchToName = (t.toCnName || '').toLowerCase().includes(q);
      const matchDesc = (t.description || '').toLowerCase().includes(q);
      const matchAmount = String(t.amount / 100).includes(q);
      
      if (!matchFromName && !matchToName && !matchDesc && !matchAmount) {
        return false;
      }
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
          <ArrowRightLeft className="w-5 h-5 mr-1.5 text-[#84CC16] bg-white rounded-full p-0.5" strokeWidth={3} />
          Transferências de Centro de Negócios (CN)
        </h1>
        <p className="text-xs text-purple-200 mt-1">
          Gerencie e autorize transferências de dinheiro entre Centros de Negócio ou entregas feitas por cobradores.
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
            Nova Transferência
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
            Histórico de Transferências
          </button>
        </div>

        {/* Content Box */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-5">
          {activeTab === 'nuevo' && (
            <form onSubmit={handleCreateTransfer} className="space-y-4">
              <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-2">
                Registrar Nova Transferência / Entrega
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

              {/* Tipo de Origem */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">
                  Tipo de Origem <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-4 p-1 bg-gray-50 border border-gray-200 rounded">
                  <button
                    type="button"
                    onClick={() => setFromType('collector')}
                    className={`flex-1 py-2 text-xs font-bold rounded transition-all ${
                      fromType === 'collector'
                        ? 'bg-[#6B21A8] text-white shadow-xs'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Cobrador (Entrega de Caixa)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFromType('cn')}
                    className={`flex-1 py-2 text-xs font-bold rounded transition-all ${
                      fromType === 'cn'
                        ? 'bg-[#6B21A8] text-white shadow-xs'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Centro de Negócios (CN)
                  </button>
                </div>
              </div>

              {/* Nome de Origem */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">
                  {fromType === 'collector' ? 'Nome do Cobrador / Origem' : 'CN de Origem'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  placeholder={fromType === 'collector' ? 'Ex: João Silva' : 'Ex: CN Filial Principal'}
                  className="border border-gray-300 rounded p-2.5 text-sm bg-white outline-none focus:border-[#6B21A8]"
                  required
                />
              </div>

              {/* CN Destino (Mock Select) */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">
                  CN de Destino <span className="text-red-500">*</span>
                </label>
                <select
                  value={toCnId}
                  onChange={(e) => {
                    setToCnId(e.target.value);
                    setToCnName(e.target.options[e.target.selectedIndex].text);
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

              {/* Opcional: Box ID se de cobrador */}
              {fromType === 'collector' && (
                <div className="flex flex-col">
                  <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">
                    ID da Caixa (Opcional)
                  </label>
                  <input
                    type="text"
                    value={boxId}
                    onChange={(e) => setBoxId(e.target.value)}
                    placeholder="Ex: id-da-caixa-ativa"
                    className="border border-gray-300 rounded p-2.5 text-sm bg-white outline-none focus:border-[#6B21A8]"
                  />
                  <span className="text-[10px] text-gray-400 mt-1">
                    Se aplicável, vincule esta transferência a uma caixa de arrecadação aberta.
                  </span>
                </div>
              )}

              {/* Valor (Amount BRL) */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">
                  Valor ($) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 font-bold">$</span>
                  <input
                    type="text"
                    value={amountInput}
                    onChange={handleAmountChange}
                    placeholder="0,00"
                    className="w-full border border-gray-300 rounded p-2.5 pl-10 text-sm bg-white outline-none focus:border-[#6B21A8] font-mono font-semibold text-gray-700"
                    required
                  />
                </div>
              </div>

              {/* Descrição */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">
                  Descrição / Observações <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o motivo ou detalhes da transferência"
                  className="border border-gray-300 rounded p-2.5 text-sm bg-white outline-none focus:border-[#6B21A8] h-20 resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#84CC16] hover:bg-[#65a30d] text-white font-bold py-3 px-4 rounded text-sm transition-colors cursor-pointer flex items-center justify-center shadow-xs"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Registrando...
                  </>
                ) : (
                  "Registrar Transferência"
                )}
              </button>
            </form>
          )}

          {activeTab === 'historico' && (
            <div className="space-y-6">
              {/* Filtros */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center">
                  <Calendar className="w-4 h-4 mr-1.5 text-[#6B21A8]" />
                  Filtros de Busca
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {/* Fecha */}
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1">Data</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="border border-gray-300 rounded p-2 text-xs bg-white text-gray-700 outline-none focus:border-[#6B21A8]"
                    />
                  </div>

                  {/* Status */}
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="border border-gray-300 rounded p-2 text-xs bg-white text-gray-700 outline-none focus:border-[#6B21A8]"
                    >
                      <option value="all">Todos os Status</option>
                      <option value="pending">Pendentes</option>
                      <option value="confirmed">Confirmadas</option>
                      <option value="rejected">Rejeitadas</option>
                    </select>
                  </div>

                  {/* Tipo Origem */}
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1">Origem</label>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="border border-gray-300 rounded p-2 text-xs bg-white text-gray-700 outline-none focus:border-[#6B21A8]"
                    >
                      <option value="all">Todos os Tipos</option>
                      <option value="collector">De Cobrador</option>
                      <option value="cn">Entre CNs</option>
                    </select>
                  </div>

                  {/* CN Destino */}
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1">CN Destino</label>
                    <select
                      value={targetCnFilter}
                      onChange={(e) => setTargetCnFilter(e.target.value)}
                      className="border border-gray-300 rounded p-2 text-xs bg-white text-gray-700 outline-none focus:border-[#6B21A8]"
                    >
                      <option value="all">Todos os CNs Destino</option>
                      <option value="cn_padrao">CN de la sociedad 6501</option>
                      <option value="cn_b">CN Filial Principal</option>
                    </select>
                  </div>
                </div>

                {/* Buscador de texto */}
                <div className="flex">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Pesquisar por descrição, origem ou destino..."
                      className="w-full border border-gray-300 rounded pl-9 p-2 text-xs bg-white text-gray-700 outline-none focus:border-[#6B21A8]"
                    />
                  </div>
                </div>
              </div>

              {/* Cards Totalizadores */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-green-50 border border-green-300 p-4 rounded-lg shadow-sm text-center">
                  <span className="text-[10px] font-bold text-green-700 uppercase tracking-wide block mb-1">
                    Total Confirmado
                  </span>
                  <span className="text-lg font-black text-[#16A34A] font-mono">
                    $ {fmt(totalConfirmed)}
                  </span>
                </div>

                <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-lg shadow-sm text-center">
                  <span className="text-[10px] font-bold text-yellow-700 uppercase tracking-wide block mb-1">
                    Aguardando ({pendingCount})
                  </span>
                  <span className="text-lg font-black text-amber-600 font-mono">
                    $ {fmt(totalPending)}
                  </span>
                </div>

                <div className="bg-purple-50 border border-purple-300 p-4 rounded-lg shadow-sm text-center">
                  <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wide block mb-1">
                    Total do Dia (Geral)
                  </span>
                  <span className="text-lg font-black text-[#6B21A8] font-mono">
                    $ {fmt(totalDay)}
                  </span>
                </div>
              </div>

              {/* Lista */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#6B21A8]" />
                  <p className="text-xs">Buscando transferências no banco de dados...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded text-xs text-center">
                  {error}
                </div>
              ) : filteredTransfers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 border border-dashed border-gray-200 rounded-lg text-gray-400 space-y-2">
                  <Info className="w-8 h-8 text-gray-300" />
                  <p className="text-xs font-semibold">Nenhuma transferência encontrada para os filtros aplicados.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTransfers.map((transfer) => {
                    const createdAtDate = transfer.createdAt?.toDate
                      ? transfer.createdAt.toDate()
                      : (transfer.createdAt?.seconds
                          ? new Date(transfer.createdAt.seconds * 1000)
                          : null);
                    return (
                      <div
                        key={transfer.id}
                        className="border border-gray-200 rounded-lg p-4 bg-white shadow-xs hover:shadow-md transition-all flex flex-col"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            {/* Direction Indicator */}
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs font-bold text-gray-800 flex items-center">
                                {transfer.fromType === 'collector' ? (
                                  <User className="w-3.5 h-3.5 text-purple-600 mr-1" />
                                ) : (
                                  <Building2 className="w-3.5 h-3.5 text-blue-600 mr-1" />
                                )}
                                {transfer.fromName}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-xs font-bold text-gray-800 flex items-center">
                                <Building2 className="w-3.5 h-3.5 text-green-600 mr-1" />
                                {transfer.toCnName || 'CN Padrão'}
                              </span>
                            </div>

                            {/* Description */}
                            <p className="text-xs text-gray-600 mt-1">{transfer.description}</p>
                            
                            {/* Box ID indicator if present */}
                            {transfer.boxId && (
                              <div className="inline-flex items-center text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded mt-1 font-mono">
                                <Info className="w-3 h-3 mr-1 text-slate-500" />
                                Caixa: {transfer.boxId}
                              </div>
                            )}
                          </div>

                          <div className="text-right flex flex-col items-end space-y-1">
                            <span className="text-sm font-black text-[#6B21A8] font-mono">
                              $ {fmt(transfer.amount)}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              transfer.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : transfer.status === 'confirmed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {transfer.status === 'pending' ? 'Pendente' : transfer.status === 'confirmed' ? 'Confirmada' : 'Rejeitada'}
                            </span>
                          </div>
                        </div>

                        {/* Metadata row */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 pt-2.5 border-t border-gray-100 text-[10px] text-gray-500">
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 text-gray-400 mr-1 flex-shrink-0" />
                            <span>Envio: <strong className="text-gray-700">{createdAtDate ? createdAtDate.toLocaleString('pt-BR') : 'Data não registrada'}</strong></span>
                          </div>

                          {transfer.confirmedBy && (
                            <div className="flex items-center">
                              <User className="w-3 h-3 text-gray-400 mr-1 flex-shrink-0" />
                              <span>Confirmado por: <strong className="text-gray-700">{transfer.confirmedBy}</strong></span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        {isAdminOrSupervisor && transfer.status === 'pending' && (
                          <div className="flex space-x-2 mt-4 pt-3 border-t border-gray-100">
                            <button
                              onClick={() => setTransferToConfirm(transfer)}
                              className="flex-1 bg-[#16A34A] hover:bg-[#15803d] text-white text-[11px] font-bold py-2 px-3 rounded flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                            >
                              <Check className="w-3.5 h-3.5 mr-1" />
                              ✓ Confirmar
                            </button>
                            <button
                              onClick={() => setTransferToReject(transfer)}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold py-2 px-3 rounded flex items-center justify-center transition-colors cursor-pointer shadow-xs"
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
          )}
        </div>
      </div>

      {/* Confirm Approve/Confirm Transfer Modal */}
      <ConfirmModal
        isOpen={!!transferToConfirm}
        onClose={() => setTransferToConfirm(null)}
        onConfirm={handleConfirmTransfer}
        title="Confirmar Transferência?"
        subtitle={`Deseja realmente confirmar esta transferência no valor de $ ${transferToConfirm ? fmt(transferToConfirm.amount) : '0,00'}? Esta ação atualizará o saldo do CN.`}
        confirmText={actionInProgress ? "Confirmando..." : "Sim, confirmar"}
        cancelText="Cancelar"
      />

      {/* Confirm Reject Transfer Modal */}
      <ConfirmModal
        isOpen={!!transferToReject}
        onClose={() => setTransferToReject(null)}
        onConfirm={handleRejectTransfer}
        title="Rejeitar Transferência?"
        subtitle={`Tem certeza que deseja rejeitar esta transferência no valor de $ ${transferToReject ? fmt(transferToReject.amount) : '0,00'}?`}
        confirmText={actionInProgress ? "Rejeitando..." : "Sim, rejeitar"}
        cancelText="Cancelar"
      />
    </div>
  );
}
