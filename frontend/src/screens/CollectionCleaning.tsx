import { getErrorMessage } from '../utils/errorMessage';
import { useState, useEffect } from 'react';
import type { HtmlFormSubmitEvent } from '../types/reactEvents';
import { db } from '../lib/firebase';
import {
  collection as firestoreCollection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  getDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { useTenant } from '../hooks/useTenant';
import { SKELETON_CARD_KEYS } from '../constants/placeholders';
import { listViewBody } from '../utils/listViewBody';
import { Screen } from '../types';
import { Search, AlertCircle, CheckCircle, X, Trash2, ShieldAlert } from 'lucide-react';

interface CollectionCleaningProps {
  onNavigate?: (screen: Screen) => void;
}

interface Collection {
  id: string;
  tenantId: string;
  boxId: string;
  userId: string;
  userName: string;
  clientId: string;
  clientName: string;
  saleId: string;
  amount: number;        // centavos
  type: 'collection';
  status: 'active' | 'cancelled' | 'duplicate';
  cancelReason?: string;
  cancelledBy?: string;
  cancelledAt?: Timestamp;
  createdAt: Timestamp;
}

export function CollectionCleaning({ onNavigate }: CollectionCleaningProps) {
  const { tenantId, role, userName, loading: tenantLoading } = useTenant();

  // Selected date state (defaults to today)
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'cancelled' | 'duplicate'>('all');

  // Input states for form controls
  const [dateInput, setDateInput] = useState(selectedDate);
  const [searchQueryInput, setSearchQueryInput] = useState('');
  const [statusFilterInput, setStatusFilterInput] = useState<'all' | 'active' | 'cancelled' | 'duplicate'>('all');

  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal cancellation state
  const [modalOpen, setModalOpen] = useState(false);
  const [collectionToCancel, setCollectionToCancel] = useState<Collection | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  // Success/Info message feedback
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);

    const [year, month, day] = selectedDate.split('-').map(Number);
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    let unsub: (() => void) | null = null;

    const runSubscription = (useFallback: boolean) => {
      let q;
      if (!useFallback) {
        q = query(
          firestoreCollection(db, 'collections'),
          where('tenantId', '==', tenantId),
          where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
          where('createdAt', '<=', Timestamp.fromDate(endOfDay)),
          orderBy('createdAt', 'desc')
        );
      } else {
        // Fallback for missing composite index: query by tenantId and filter client-side
        q = query(
          firestoreCollection(db, 'collections'),
          where('tenantId', '==', tenantId)
        );
      }

      return onSnapshot(q, (snapshot) => {
        const loaded: Collection[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push({ id: docSnap.id, ...docSnap.data() } as Collection);
        });

        if (useFallback) {
          // Client-side date filter
          const filtered = loaded.filter(item => {
            if (!item.createdAt) return false;
            const itemDate = item.createdAt.toDate();
            return itemDate >= startOfDay && itemDate <= endOfDay;
          });

          // Client-side sort desc by createdAt
          filtered.sort((a, b) => {
            const tA = a.createdAt?.toMillis() || 0;
            const tB = b.createdAt?.toMillis() || 0;
            return tB - tA;
          });

          setCollections(filtered);
        } else {
          setCollections(loaded);
        }

        setLoading(false);
        setError(null);
      }, (err) => {
        console.error("Firestore onSnapshot error:", err);
        if (!useFallback) {
          console.log("Retrying with fallback query...");
          if (unsub) unsub();
          unsub = runSubscription(true);
        } else {
          setError("Falha ao sincronizar as cobranças do banco de dados.");
          setLoading(false);
        }
      });
    };

    unsub = runSubscription(false);

    return () => {
      if (unsub) {
        unsub();
      }
    };
  }, [tenantId, selectedDate]);

  const handleSearch = (e: HtmlFormSubmitEvent) => {
    e.preventDefault();
    setSelectedDate(dateInput);
    setSearchQuery(searchQueryInput);
    setStatusFilter(statusFilterInput);
  };

  // Helper formatting function for cents to BRL format string
  const fmt = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getFormattedTime = (createdAt: Timestamp) => {
    if (!createdAt) return '---';
    try {
      const d = createdAt.toDate();
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
      return '---';
    }
  };

  // Aggregated calculations based on all fetched collections for that selected date
  const totalCount = collections.length;
  const activeCount = collections.filter(c => c.status === 'active').length;
  const cancelledCount = collections.filter(c => c.status === 'cancelled').length;
  const activeValueSum = collections
    .filter(c => c.status === 'active')
    .reduce((sum, c) => sum + (c.amount || 0), 0);

  // Filtered list based on Search button criteria
  const displayedCollections = collections.filter(c => {
    const matchesSearch = searchQuery
      ? (c.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         c.userName?.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;

    const matchesStatus = statusFilter === 'all'
      ? true
      : c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCancelClick = (col: Collection) => {
    setCollectionToCancel(col);
    setCancelReason('');
    setModalOpen(true);
  };

  const confirmCancel = async () => {
    if (!collectionToCancel) return;
    if (cancelReason.trim().length < 10) {
      alert("O motivo do cancelamento deve conter no mínimo 10 caracteres.");
      return;
    }

    setCancelLoading(true);
    try {
      const colId = collectionToCancel.id;
      // 1. Update Collection Document status to 'cancelled'
      await updateDoc(doc(db, 'collections', colId), {
        status: 'cancelled',
        cancelReason: cancelReason,
        cancelledBy: userName || 'Admin/Supervisor',
        cancelledAt: serverTimestamp()
      });

      // 2. Adjust matching box document to subtract amount from totalCollections and update finalAmount
      const boxRef = doc(db, 'boxes', collectionToCancel.boxId);
      const boxSnap = await getDoc(boxRef);
      if (boxSnap.exists()) {
        const boxData = boxSnap.data();
        const newTotal = Math.max(0, (boxData.totalCollections || 0) - collectionToCancel.amount);
        const newFinal = (boxData.initialAmount || 0) + newTotal + (boxData.totalIncomes || 0)
          - (boxData.totalExpenses || 0) - (boxData.totalSales || 0) - (boxData.totalTransfers || 0);
        
        await updateDoc(boxRef, {
          totalCollections: newTotal,
          finalAmount: newFinal
        });
      }

      setInfoMessage("Cobrança cancelada e caixa correspondente atualizado com sucesso.");
      setTimeout(() => setInfoMessage(null), 4000);

      setModalOpen(false);
      setCollectionToCancel(null);
      setCancelReason('');
    } catch (err) {
      console.error("Error cancelling collection:", err);
      alert("Erro ao tentar cancelar a cobrança: " + (getErrorMessage(err)));
    } finally {
      setCancelLoading(false);
    }
  };

  const isAdminOrSupervisor = role === 'admin' || role === 'supervisor';

  return (
    <div className="flex flex-col bg-[#F3F4F6] min-h-screen text-[#333333]">
      {/* HEADER SECTION */}
      <div className="bg-white border-b border-gray-300 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#6B21A8] flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-[#16A34A]" />
              Limpeza de Cobranças
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Identifique e gerencie cobranças com problemas, duplicadas ou incorretas.
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              id="btn-nav-dashboard"
              onClick={() => onNavigate && onNavigate('dashboard')}
              className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-[#333] font-bold px-4 py-1.5 rounded text-xs transition-colors shadow-sm"
            >
              Volver al Inicio
            </button>
          </div>
        </div>

        {/* STATS SUMMARY METRICS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="bg-white border border-gray-300 rounded p-3 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Total de Cobranças</span>
            <span className="text-2xl font-black text-gray-800 mt-1">{totalCount}</span>
          </div>

          <div className="bg-green-50 border border-green-200 rounded p-3 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-green-700 tracking-wider">Ativas</span>
            <span className="text-2xl font-black text-green-800 mt-1">{activeCount}</span>
          </div>

          <div className="bg-red-50 border border-red-200 rounded p-3 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-red-700 tracking-wider">Canceladas</span>
            <span className="text-2xl font-black text-red-800 mt-1">{cancelledCount}</span>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-3 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">Valor Total Ativo</span>
            <span className="text-2xl font-black text-blue-800 mt-1">
              $ {fmt(activeValueSum)}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* INFO FEEDBACK MESSAGE */}
        {infoMessage && (
          <div className="bg-green-100 border border-green-300 text-green-800 p-3 rounded text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* FILTER FORM */}
        <form onSubmit={handleSearch} className="bg-white border border-gray-300 shadow-sm rounded p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-[#555555] uppercase mb-1">
                Data Selecionada
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs font-bold text-[#333333] bg-white outline-none focus:border-[#16A34A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#555555] uppercase mb-1">
                Buscar Cliente / Cobrador
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Nome do cliente ou cobrador..."
                  value={searchQueryInput}
                  onChange={(e) => setSearchQueryInput(e.target.value)}
                  className="w-full border border-gray-300 rounded pl-8 pr-2.5 py-1.5 text-xs font-medium text-[#333333] bg-white outline-none focus:border-[#16A34A]"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#555555] uppercase mb-1">
                Filtrar por Status
              </label>
              <select
                value={statusFilterInput}
                onChange={(e) => setStatusFilterInput(e.target.value as typeof statusFilterInput)}
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs font-bold text-[#333333] bg-white outline-none focus:border-[#16A34A]"
              >
                <option value="all">Todos</option>
                <option value="active">Ativas</option>
                <option value="cancelled">Canceladas</option>
                <option value="duplicate">Duplicadas</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold py-2 px-6 rounded shadow-sm transition-colors uppercase flex items-center gap-1.5"
            >
              <Search className="w-4 h-4" />
              Buscar
            </button>
          </div>
        </form>

        {/* ERROR BOX */}
        {error && (
          <div className="bg-red-100 border border-red-300 text-red-800 p-4 rounded text-sm flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Erro de Sincronização</p>
              <p className="text-xs">{error}</p>
            </div>
          </div>
        )}

        {/* MAIN LIST SECTION */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-[#555555] uppercase tracking-wider pl-1">
            Cobranças Registradas ({displayedCollections.length})
          </h2>

          {listViewBody(
            loading || tenantLoading,
            displayedCollections.length,
            (
            <div className="space-y-3">
              {SKELETON_CARD_KEYS.slice(0, 3).map((key) => (
                <div key={key} className="animate-pulse h-16 bg-gray-100 rounded border border-gray-200" />
              ))}
            </div>
          ),
            (
            <div className="bg-white border border-gray-300 rounded text-center py-10 px-4 shadow-sm text-sm text-gray-500">
              Nenhuma cobrança encontrada para esta data
            </div>
          ),
            (
            <div className="grid grid-cols-1 gap-3">
              {displayedCollections.map((col) => {
                const isItemActive = col.status === 'active';
                const showCancelButton = isAdminOrSupervisor && isItemActive;

                return (
                  <div
                    key={col.id}
                    className="bg-white border border-gray-300 shadow-sm rounded-sm p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-gray-400 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#333333]">{col.clientName || 'Cliente Sem Nome'}</span>
                        
                        {/* Status Badge */}
                        {col.status === 'active' && (
                          <span className="bg-green-100 text-green-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                            Ativa
                          </span>
                        )}
                        {col.status === 'cancelled' && (
                          <span className="bg-red-100 text-red-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                            Cancelada
                          </span>
                        )}
                        {col.status === 'duplicate' && (
                          <span className="bg-yellow-100 text-yellow-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                            Duplicada
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-0.5 text-xs text-gray-500">
                        <div>
                          <span className="font-medium text-gray-400">Cobrador:</span>{' '}
                          <span className="font-semibold text-gray-700">{col.userName || 'Desconhecido'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-400">Horário:</span>{' '}
                          <span className="font-semibold text-gray-700">{getFormattedTime(col.createdAt)}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-400">ID da Venda:</span>{' '}
                          <span className="font-mono text-[11px] text-gray-600">{col.saleId ? col.saleId.substring(0, 8) : '---'}</span>
                        </div>
                      </div>

                      {col.status === 'cancelled' && col.cancelReason && (
                        <div className="bg-red-50 border-l-2 border-red-400 p-2 text-xs text-red-800 mt-2 rounded-r">
                          <p className="font-bold uppercase text-[9px] tracking-wider">Motivo do Cancelamento:</p>
                          <p className="italic">"{col.cancelReason}"</p>
                          {col.cancelledBy && (
                            <p className="text-[10px] mt-1 text-red-600">
                              Cancelado por: <span className="font-semibold">{col.cancelledBy}</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0">
                      <div className="text-right">
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Valor</span>
                        <span className="text-base font-black text-gray-800">
                          $ {fmt(col.amount || 0)}
                        </span>
                      </div>

                      {showCancelButton && (
                        <button
                          type="button"
                          onClick={() => handleCancelClick(col)}
                          className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-1.5 px-3.5 rounded shadow-sm transition-colors uppercase flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* CANCELLATION MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-gray-300 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-between">
              <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-1.5">
                <Trash2 className="w-4 h-4" />
                Cancelar Cobrança
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
                disabled={cancelLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {collectionToCancel && (
                <div className="bg-gray-50 border border-gray-200 rounded p-3 text-xs space-y-1">
                  <p>
                    <span className="font-bold text-[#555555] uppercase text-[9px] block">Cliente</span>
                    <span className="text-sm font-semibold text-gray-800">{collectionToCancel.clientName}</span>
                  </p>
                  <p>
                    <span className="font-bold text-[#555555] uppercase text-[9px] block">Valor da Cobrança</span>
                    <span className="text-sm font-black text-gray-800">$ {fmt(collectionToCancel.amount)}</span>
                  </p>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-[#555555] uppercase mb-1">
                  Motivo do cancelamento <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Escreva o motivo detalhado do cancelamento (mínimo de 10 caracteres)..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  disabled={cancelLoading}
                  rows={4}
                  className="w-full border border-gray-300 rounded p-2 text-xs font-medium bg-white outline-none focus:border-red-500"
                />
                <p className="text-[10px] text-gray-400 mt-1 flex justify-between">
                  <span>Mínimo 10 caracteres</span>
                  <span className={cancelReason.trim().length >= 10 ? 'text-green-600 font-bold' : 'text-red-500 font-semibold'}>
                    {cancelReason.trim().length} caracteres
                  </span>
                </p>
              </div>
            </div>

            <div className="bg-gray-100 px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={cancelLoading}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold py-1.5 px-4 rounded transition-colors uppercase"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmCancel}
                disabled={cancelLoading || cancelReason.trim().length < 10}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-xs font-bold py-1.5 px-5 rounded shadow-sm transition-colors uppercase flex items-center gap-1"
              >
                {cancelLoading ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
