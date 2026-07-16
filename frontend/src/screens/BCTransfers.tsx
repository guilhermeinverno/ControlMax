import { useEffect, useState } from 'react';
import type { HtmlFormSubmitEvent, HtmlInputChangeEvent } from '../types/reactEvents';
import { Screen } from '../types';
import { auth, db } from '../lib/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { useTenant } from '../hooks/useTenant';
import { useBox } from '../hooks/useBox';
import { useBCTransfersHistory } from '../hooks/useBCTransfersHistory';
import type { BCTransfer } from '../hooks/useBCTransfersHistory';
import { ConfirmModal } from './components/ConfirmModal';
import {
  formatCurrencyBRL,
  parseCurrencyBRLToCents
} from '../utils/currency';
import { transferStatusLabel, transferStatusBadgeClasses } from '../utils/statusLabels';
import { toJsDate } from '../utils/firestoreTimestamp';
import { computeTransferTotals, filterTransfers } from '../utils/bcTransferFilters';
import { loadingErrorEmptyContent } from '../utils/listViewBody';
import {
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
  ArrowRight,
  History,
  Camera,
  Trash2,
  ArrowLeft
} from 'lucide-react';

interface BCTransfersProps {
  onNavigate?: (screen: Screen) => void;
}

const fmt = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function BCTransfers({ onNavigate }: BCTransfersProps) {
  const { tenantId, role, userName, isSuperAdmin, loading: tenantLoading } = useTenant();
  const { activeBox, loading: boxLoading } = useBox();

  const cajaFinal = activeBox 
    ? activeBox.initialAmount + activeBox.totalCollections + activeBox.totalIncomes - activeBox.totalExpenses - activeBox.totalSales - activeBox.totalTransfers 
    : 2095303; // Default to $20,953.03 in cents

  const formattedCajaFinal = `$${(cajaFinal / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  useEffect(() => {
    if (activeBox) {
      setBoxId(activeBox.id);
    }
  }, [activeBox]);

  const isAdminOrSupervisor = role === 'admin' || role === 'supervisor' || isSuperAdmin;

  // Active Tab
  const [activeTab, setActiveTab] = useState<'nuevo' | 'historico'>('nuevo');

  // New Transfer Form State
  const [fromType, setFromType] = useState<'collector' | 'cn'>('collector');
  const [fromName, setFromName] = useState('');
  const [toCnId, setToCnId] = useState('');
  const [toCnName, setToCnName] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [description, setDescription] = useState('');
  const [boxId, setBoxId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

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

  const { transfers, loading, error } = useBCTransfersHistory(tenantId, selectedDate);

  // Sync fromName default value on load/fromType change
  useEffect(() => {
    if (fromType === 'collector') {
      setFromName(userName || '');
    } else {
      setFromName('CN Filial Principal');
    }
  }, [fromType, userName]);

  // Form input formatter
  const handleAmountChange = (e: HtmlInputChangeEvent) => {
    const formatted = formatCurrencyBRL(e.target.value);
    setAmountInput(formatted);
  };

  // Submit Handler for New Transfer
  const handleCreateTransfer = async (e: HtmlFormSubmitEvent) => {
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

    if (!toCnId) {
      setFormError("O tipo de transferência é obrigatório.");
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

  const { totalConfirmed, totalPending, totalDay, pendingCount } = computeTransferTotals(transfers);
  const filteredTransfers = filterTransfers(transfers, {
    statusFilter,
    typeFilter,
    targetCnFilter,
    searchQuery,
  });

  // Added state for simulated photo uploader
  const [attachedPhoto, setAttachedPhoto] = useState<string | null>(null);

  const triggerMockPhotoUpload = () => {
    // Set a miniature placeholder image representing a receipt
    setAttachedPhoto(
      'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=150&auto=format&fit=crop&q=60'
    );
  };

  if (tenantLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 space-y-2 min-h-screen bg-[#F3F4F6]">
        <Loader2 className="w-8 h-8 animate-spin text-[#84CC16]" />
        <p className="text-xs font-medium">Carregando dados do inquilino...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white min-h-screen text-[#333333] -m-4 pb-20 select-none">
      {/* Header Area matching screenshot */}
      <div className="bg-[#6A008A] text-white pt-4 pb-0 px-4 shadow-sm">
        <div className="flex items-center space-x-3 mb-2 mt-1">
          <button
            onClick={() => onNavigate && onNavigate('dashboard')}
            className="text-white hover:bg-white/10 p-2 -ml-2 rounded-full transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-lg font-black tracking-wide">Transferências</h1>
            <span className="text-xs text-purple-200 block font-semibold mt-0.5">
              {activeBox?.unitName ? activeBox.unitName.substring(0, 3) : '65'} / {activeBox?.cnName ? activeBox.cnName.substring(0, 3) : '3'} / {activeBox?.id ? activeBox.id.substring(0, 7) : '1007967'}
            </span>
          </div>
        </div>

        {/* Navigation Tabs - Transferir / Movimentos */}
        <div className="flex mt-4">
          <button
            onClick={() => setActiveTab('nuevo')}
            className={`flex-1 pb-3 text-center text-sm font-bold transition-all relative ${
              activeTab === 'nuevo'
                ? 'text-white'
                : 'text-purple-200/80 hover:text-white'
            }`}
          >
            Transferir
            {activeTab === 'nuevo' && (
              <span className="absolute bottom-0 left-0 right-0 h-1 bg-[#8CC63F]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('historico')}
            className={`flex-1 pb-3 text-center text-sm font-bold transition-all relative ${
              activeTab === 'historico'
                ? 'text-white'
                : 'text-purple-200/80 hover:text-white'
            }`}
          >
            Movimentos
            {activeTab === 'historico' && (
              <span className="absolute bottom-0 left-0 right-0 h-1 bg-[#8CC63F]" />
            )}
          </button>
        </div>
      </div>

      <div className="p-6 max-w-md mx-auto w-full space-y-6">
        {activeTab === 'nuevo' && (
          <form onSubmit={handleCreateTransfer} className="space-y-6">
            {/* Balance Display Block - Direct on page without border cards */}
            <div className="space-y-4">
              <div>
                <span className="text-[17px] font-semibold text-zinc-800 tracking-tight block">
                  Montante disponível
                </span>
                <span className="text-[34px] font-black text-black tracking-tight mt-1 block">
                  {formattedCajaFinal}
                </span>
              </div>

              <div className="pt-2">
                <span className="text-[17px] font-semibold text-zinc-800 tracking-tight block">
                  Disponível para transferências
                </span>
                <span className="text-[34px] font-black text-black tracking-tight mt-1 block">
                  {formattedCajaFinal}
                </span>
              </div>
            </div>

            {/* Error & Success Messages */}
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-xl text-xs flex items-center">
                <Check className="w-4 h-4 mr-2 flex-shrink-0 text-green-600" strokeWidth={3} />
                <span>{formSuccess}</span>
              </div>
            )}

            {/* Form Fields - Individual un-nested boxes matching screenshot */}
            <div className="space-y-5">
              {/* Montante a transferir * */}
              <div>
                <input
                  type="text"
                  value={amountInput}
                  onChange={handleAmountChange}
                  placeholder="Montante a transferir *"
                  className="w-full bg-white border border-zinc-950 rounded-lg p-4 text-base text-zinc-900 outline-none focus:border-[#6A008A] focus:ring-1 focus:ring-[#6A008A] font-medium placeholder-zinc-500"
                  required
                />
              </div>

              {/* Tipo de transferência * */}
              <div className="relative">
                <select
                  value={toCnId}
                  onChange={(e) => {
                    setToCnId(e.target.value);
                    setToCnName(e.target.options[e.target.selectedIndex].text);
                  }}
                  className="w-full bg-white border border-zinc-950 rounded-lg p-4 text-base text-zinc-900 outline-none focus:border-[#6A008A] focus:ring-1 focus:ring-[#6A008A] font-medium appearance-none"
                  required
                >
                  <option value="" disabled hidden>Tipo de transferência *</option>
                  <option value="cn_padrao">Entrega de Arrecadação de Caixa</option>
                  <option value="cn_b">Transferência entre Unidades / CN</option>
                  <option value="cn_sociedad_6501">CN de la sociedad 6501</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-900">
                  <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>

              {/* Notas */}
              <div>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Notas"
                  className="w-full bg-white border border-zinc-950 rounded-lg p-4 text-base text-zinc-900 outline-none focus:border-[#6A008A] focus:ring-1 focus:ring-[#6A008A] font-medium placeholder-zinc-500"
                />
              </div>

              {/* Adicionar foto */}
              <div className="space-y-2 pt-1">
                <span className="text-sm font-semibold text-zinc-800 tracking-tight block">
                  Adicionar foto
                </span>

                {attachedPhoto ? (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-300 shadow-xs group">
                    <img src={attachedPhoto} alt="Comprovante" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setAttachedPhoto(null)}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                    >
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={triggerMockPhotoUpload}
                    className="w-20 h-20 rounded-lg bg-[#E0E0E0] border border-transparent hover:border-purple-300 flex items-center justify-center transition-all cursor-pointer shadow-sm hover:bg-gray-300"
                  >
                    <div className="text-gray-500 flex flex-col items-center justify-center">
                      <Camera className="w-7 h-7 text-gray-500 stroke-[1.5]" />
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Action button matching screenshot */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#6A008A] hover:bg-[#52006A] text-white font-bold text-base py-4 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Transferindo...
                </>
              ) : (
                'Transferir'
              )}
            </button>
          </form>
        )}

        {activeTab === 'historico' && (
          <div className="space-y-4">
            {/* Quick stats for historic tab */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white border border-slate-100 rounded-xl p-3 text-center shadow-xs">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">
                  Confirmado
                </span>
                <span className="text-sm font-black text-green-600 font-mono block mt-0.5">
                  $ {fmt(totalConfirmed)}
                </span>
              </div>
              <div className="bg-white border border-slate-100 rounded-xl p-3 text-center shadow-xs">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">
                  Pendente ({pendingCount})
                </span>
                <span className="text-sm font-black text-amber-500 font-mono block mt-0.5">
                  $ {fmt(totalPending)}
                </span>
              </div>
            </div>

            {/* Simple date picker */}
            <div className="bg-white border border-slate-100 rounded-xl p-3.5 shadow-xs flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Data dos lançamentos</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-slate-200 rounded p-1.5 text-xs text-gray-700 bg-white outline-none focus:border-[#6A008A]"
              />
            </div>

            {/* Historic List */}
            {loadingErrorEmptyContent(
              loading,
              error,
              filteredTransfers.length,
              (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#6A008A]" />
                  <p className="text-xs">Buscando lançamentos...</p>
                </div>
              ),
              (
                <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded text-xs text-center">
                  {error}
                </div>
              ),
              (
                <div className="flex flex-col items-center justify-center py-12 border border-dashed border-slate-200 rounded-2xl text-gray-400 bg-white p-4">
                  <Info className="w-8 h-8 text-gray-300 mb-1" />
                  <p className="text-xs font-bold text-slate-600">Nenhuma transferência hoje.</p>
                </div>
              ),
              (
                <div className="space-y-2.5">
                  {filteredTransfers.map((transfer) => {
                    const createdAtDate = transfer.createdAt ? toJsDate(transfer.createdAt) : null;
                    return (
                      <div
                        key={transfer.id}
                        className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col"
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <span className="text-xs font-black text-slate-800 block">
                              {transfer.fromName}
                            </span>
                            <p className="text-xs text-slate-500 mt-1">{transfer.description}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-sm font-black text-slate-900 block font-mono">
                              $ {fmt(transfer.amount)}
                            </span>
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full inline-block mt-1 ${transferStatusBadgeClasses(transfer.status)}`}>
                              {transferStatusLabel(transfer.status)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center text-[9px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100 justify-between">
                          <span>
                            {createdAtDate ? createdAtDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                          {transfer.confirmedBy && (
                            <span>Ref: {transfer.confirmedBy}</span>
                          )}
                        </div>

                        {/* Approvals action row for Admin/Supervisors */}
                        {isAdminOrSupervisor && transfer.status === 'pending' && (
                          <div className="flex space-x-2 mt-3 pt-3 border-t border-slate-100">
                            <button
                              onClick={() => setTransferToConfirm(transfer)}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold py-2 rounded-lg cursor-pointer"
                            >
                              ✓ Confirmar
                            </button>
                            <button
                              onClick={() => setTransferToReject(transfer)}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold py-2 rounded-lg cursor-pointer"
                            >
                              ✗ Rejeitar
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Confirm Approve Modal */}
      <ConfirmModal
        isOpen={!!transferToConfirm}
        onClose={() => setTransferToConfirm(null)}
        onConfirm={handleConfirmTransfer}
        title="Confirmar Transferência?"
        subtitle={`Deseja realmente confirmar esta transferência de $ ${transferToConfirm ? fmt(transferToConfirm.amount) : '0,00'}?`}
        confirmText={actionInProgress ? "Confirmando..." : "Confirmar"}
        cancelText="Cancelar"
      />

      {/* Confirm Reject Modal */}
      <ConfirmModal
        isOpen={!!transferToReject}
        onClose={() => setTransferToReject(null)}
        onConfirm={handleRejectTransfer}
        title="Rejeitar Transferência?"
        subtitle={`Deseja rejeitar a transferência de $ ${transferToReject ? fmt(transferToReject.amount) : '0,00'}?`}
        confirmText={actionInProgress ? "Rejeitando..." : "Rejeitar"}
        cancelText="Cancelar"
      />
    </div>
  );
}
