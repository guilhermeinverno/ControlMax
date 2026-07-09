import { getErrorMessage } from '../utils/errorMessage';
import { useState, useEffect } from 'react';
import type { HtmlFormSubmitEvent, HtmlInputChangeEvent } from '../types/reactEvents';
import { Screen } from '../types';
import { SKELETON_CARD_KEYS } from '../constants/placeholders';
import { ConfirmModal } from './components/ConfirmModal';
import { creditRequestStatusLabel, creditRequestStatusBadgeClasses, creditScoreColorClasses } from '../utils/statusLabels';
import { listViewBody } from '../utils/listViewBody';
import { 
  Search, 
  Check, 
  X, 
  Clock, 
  Plus, 
  Loader2, 
  AlertCircle, 
  History
} from 'lucide-react';
import { formatCurrencyBRL, parseCurrencyBRLToCents } from '../utils/currency';
import { db, auth } from '../lib/firebase';
import {
  collection, query, where, orderBy, limit,
  onSnapshot, addDoc, updateDoc, doc,
  serverTimestamp, Timestamp, arrayUnion
} from 'firebase/firestore';
import { useTenant } from '../hooks/useTenant';
import { mapCreditRequestDoc, sortCreditRequestsByDate } from '../utils/creditRequestMapper';

interface CreditRequest {
  id: string;
  tenantId: string;
  clientId: string;
  clientName: string;
  clientDoc: string;
  amount: number;           // cents
  requestedBy: string;      // userName
  requestedById: string;    // uid
  status: 'pending' | 'approved' | 'rejected' | 'auto';
  score: number;            // 0-100
  currentBalance: number;   // cents
  observations: string;
  createdAt: Timestamp | null;
  reviewedAt?: Timestamp | null;
  reviewedBy?: string;
  reviewedById?: string;
  historyLogs: {
    time: string;
    action: string;
    user: string;
    details: string;
  }[];
}

interface CreditRequestsProps {
  onNavigate?: (screen: Screen, params?: Record<string, unknown>) => void;
}

export function CreditRequests({ onNavigate }: CreditRequestsProps) {
  const { tenantId, role, userName, loading: tenantLoading } = useTenant();

  // State definitions
  const [requests, setRequests] = useState<CreditRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters and navigation
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'auto'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New Credit solicitation Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientDoc, setNewClientDoc] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newObservations, setNewObservations] = useState('');
  const [savingNew, setSavingNew] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Confirmation Modal and Save state for action buttons
  const [confirmAction, setConfirmAction] = useState<{
    type: 'approve' | 'reject';
    requestId: string;
  } | null>(null);
  const [savingActionId, setSavingActionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Real-time Firestore subscription
  useEffect(() => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);

    // Initial query using orderBy
    const qWithOrder = query(
      collection(db, 'credit_requests'),
      where('tenantId', '==', tenantId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(qWithOrder, (snapshot) => {
      const items = snapshot.docs.map(mapCreditRequestDoc) as CreditRequest[];
      setRequests(items);
      setLoading(false);
    }, (err) => {
      console.warn("Index not found or permission error, attempting query without order:", err);
      
      // Fallback query without orderBy
      const qWithoutOrder = query(
        collection(db, 'credit_requests'),
        where('tenantId', '==', tenantId),
        limit(50)
      );
      
      const unsubscribeFallback = onSnapshot(qWithoutOrder, (snapshot) => {
        const items = sortCreditRequestsByDate(snapshot.docs.map(mapCreditRequestDoc)) as CreditRequest[];
        setRequests(items);
        setLoading(false);
      }, (fallbackErr) => {
        console.error("Firestore loading error on fallback query:", fallbackErr);
        setError("Erro ao carregar solicitações de crédito do servidor.");
        setLoading(false);
      });

      return () => unsubscribeFallback();
    });

    return () => unsubscribe();
  }, [tenantId]);

  // Formatter helpers
  const fmt = (cents: number) =>
    (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatDate = (timestamp: Timestamp | null): string => {
    if (!timestamp) return 'Recente';
    if (typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleString('pt-BR');
    }
    return 'Pendente';
  };

  // Role permissions checks
  const canCreate = role === 'collector' || role === 'admin';
  const canReview = role === 'admin' || role === 'supervisor';

  // Pending count badge for real-time header indicator
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  // Filter lists in memory
  const filteredRequests = requests.filter(req => {
    // 1. Tab status filter
    if (activeTab !== 'all' && req.status !== activeTab) {
      return false;
    }

    // 2. Client-side text search
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      const nameMatch = req.clientName?.toLowerCase().includes(term);
      const docMatch = req.clientDoc?.toLowerCase().includes(term);
      return nameMatch || docMatch;
    }

    return true;
  });

  // Create solicitation submit
  const handleCreateRequest = async (e: HtmlFormSubmitEvent) => {
    e.preventDefault();
    if (!tenantId || !userName) return;

    const parsedAmountCents = parseCurrencyBRLToCents(newAmount);
    if (parsedAmountCents <= 0) {
      setModalError("Por favor, insira um valor válido de crédito.");
      return;
    }

    setSavingNew(true);
    setModalError(null);

    try {
      // Pontuação determinística baseada nos dados do cliente (40–100)
      const scoreSeed = (newClientDoc + newClientName)
        .split('')
        .reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const calculatedScore = 40 + (scoreSeed % 61);

      await addDoc(collection(db, 'credit_requests'), {
        tenantId,
        clientId: '',
        clientName: newClientName.trim(),
        clientDoc: newClientDoc.trim(),
        amount: parsedAmountCents,
        requestedBy: userName,
        requestedById: auth.currentUser?.uid || 'test-user-id',
        status: 'pending',
        score: calculatedScore,
        currentBalance: 0,
        observations: newObservations.trim(),
        createdAt: serverTimestamp(),
        historyLogs: [{
          time: new Date().toLocaleString('pt-BR'),
          action: 'Criado',
          user: userName,
          details: 'Solicitação criada'
        }]
      });

      // Clear states and close
      setNewClientName('');
      setNewClientDoc('');
      setNewAmount('');
      setNewObservations('');
      setShowAddModal(false);
    } catch (err: unknown) {
      console.error("Error creating credit request document:", err);
      setModalError((getErrorMessage(err)) || "Erro ao salvar solicitação. Verifique os privilégios.");
    } finally {
      setSavingNew(false);
    }
  };

  // Format currency on typing
  const handleAmountChange = (e: HtmlInputChangeEvent) => {
    setNewAmount(formatCurrencyBRL(e.target.value));
  };

  // Perform approve / reject actions on documents
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
          details: isApproved ? 'Crédito aprovado manualmente' : 'Crédito rejeitado manualmente'
        })
      });
    } catch (err: unknown) {
      console.error("Error resolving credit request action:", err);
      setActionError("Não foi possível processar a ação. Sem permissões de gravação.");
    } finally {
      setSavingActionId(null);
    }
  };

  return (
    <div className="flex flex-col bg-[#F3F4F6] min-h-screen text-[#333333]">
      
      {/* HEADER SECTION */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-10 shrink-0">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-[#6B21A8]" />
          <div>
            <h2 className="text-sm font-bold text-gray-900 leading-none">Solicitações de Crédito</h2>
            <span className="text-[10px] text-gray-400 font-medium font-mono">ControlMax • Real-time</span>
          </div>
        </div>
        {canCreate && (
          <button
            onClick={() => {
              setModalError(null);
              setShowAddModal(true);
            }}
            className="bg-[#6B21A8] hover:bg-purple-700 active:bg-purple-800 text-white font-bold text-xs py-1.5 px-3 rounded flex items-center shadow-sm uppercase cursor-pointer transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Nova
          </button>
        )}
      </div>

      {/* ERROR BANNER IF ANY */}
      {(error || actionError) && (
        <div className="mx-3 mt-2 bg-red-50 border border-red-200 text-red-700 p-2.5 text-xs flex items-center rounded-sm">
          <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-red-500" />
          <span>{error || actionError}</span>
        </div>
      )}

      {/* TABS SELECTOR */}
      <div className="flex border-b border-gray-200 bg-white overflow-x-auto shrink-0 scrollbar-none scroll-smooth">
        {(['all', 'pending', 'approved', 'rejected', 'auto'] as const).map((tab) => {
          let label = 'Todos';
          if (tab === 'pending') label = 'Pendentes';
          else if (tab === 'approved') label = 'Aprovadas';
          else if (tab === 'rejected') label = 'Rejeitadas';
          else if (tab === 'auto') label = 'Automáticas';

          const isActive = activeTab === tab;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[90px] text-center py-3 px-2 text-xs font-semibold uppercase tracking-wider relative whitespace-nowrap cursor-pointer transition-colors ${
                isActive ? 'text-[#6B21A8] font-bold' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{label}</span>
              {tab === 'pending' && pendingCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-purple-100 text-[#6B21A8] text-[9px] font-black rounded-full border border-purple-200">
                  {pendingCount}
                </span>
              )}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6B21A8]" />
              )}
            </button>
          );
        })}
      </div>

      {/* FILTER SEARCH FIELD */}
      <div className="p-3 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded pl-9 pr-4 py-2 text-xs text-gray-800 outline-none focus:border-[#6B21A8] placeholder-gray-400 font-medium"
            placeholder="Buscar por cliente ou documento..."
          />
        </div>
      </div>

      {/* REQUESTS LIST MAIN CONTENT AREA */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3">
        {listViewBody(
          tenantLoading || loading,
          filteredRequests.length,
          (
          <div className="space-y-3">
            {SKELETON_CARD_KEYS.slice(0, 3).map((key) => (
              <div key={key} className="animate-pulse bg-white border border-gray-200 h-24 rounded p-3 space-y-3">
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ),
          (
          <div className="flex flex-col items-center justify-center p-8 bg-white border border-gray-200 rounded text-center">
            <AlertCircle className="w-8 h-8 text-gray-300 mb-2" />
            <span className="text-xs text-gray-400 italic">Nenhuma solicitação encontrada</span>
          </div>
        ),
          (
          <div className="space-y-3">
            {filteredRequests.map((request) => {
              const isExpanded = expandedId === request.id;
              const dateStr = formatDate(request.createdAt);

              const badgeClasses = creditRequestStatusBadgeClasses(request.status);
              const badgeLabel = creditRequestStatusLabel(request.status);

              const scoreColor = creditScoreColorClasses(request.score);

              const isPending = request.status === 'pending';
              const showReviewButtons = isPending && canReview;

              return (
                <div 
                  key={request.id}
                  id={`request-card-${request.id}`}
                  className="bg-white border border-gray-300 shadow-sm rounded p-3 flex flex-col space-y-2 transition-all cursor-pointer hover:border-[#6B21A8]"
                  onClick={() => setExpandedId(isExpanded ? null : request.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{request.clientName}</h4>
                      <p className="text-gray-500 text-xs font-mono">{request.clientDoc || 'CC Não informada'}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${badgeClasses}`}>
                      {badgeLabel}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs text-gray-500 pt-1">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-gray-400 block">Valor Solicitado</span>
                      <span className="font-extrabold text-[#16A34A] text-sm">$ {fmt(request.amount)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-semibold text-gray-400 block">Score</span>
                      <span className={`inline-block font-bold px-2 py-0.5 rounded border text-xs ${scoreColor}`}>
                        {request.score} / 100
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-gray-400 border-t border-gray-100 pt-2 mt-1">
                    <span>Por: <span className="font-semibold text-gray-600">{request.requestedBy}</span></span>
                    <span>{dateStr}</span>
                  </div>

                  {isExpanded && (
                    <div 
                      className="border-t border-gray-200 pt-3 mt-2 space-y-3"
                      onClick={(e) => e.stopPropagation()} // Prevent card collapse when clicking elements within details
                    >
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Observações / Justificativa</span>
                        <div className="bg-gray-50 border border-gray-200 p-2 rounded text-xs text-gray-700 italic leading-relaxed">
                          {request.observations || 'Nenhuma observação informada.'}
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-gray-50 border border-gray-105 p-2 rounded">
                        <span className="text-[10px] uppercase font-bold text-gray-500">Saldo Atual do Cliente</span>
                        <span className="font-bold text-red-600 text-xs">$ {fmt(request.currentBalance || 0)}</span>
                      </div>

                      {/* Action history log */}
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1 flex items-center">
                          <History className="w-3.5 h-3.5 mr-1" /> Histórico de Ações
                        </span>
                        <div className="max-h-36 overflow-y-auto space-y-1.5 border border-gray-150 rounded bg-gray-50 p-2">
                          {request.historyLogs && request.historyLogs.length > 0 ? (
                            request.historyLogs.map((log) => (
                              <div key={`${log.time}-${log.action}-${log.user}`} className="text-[10px] border-b border-gray-100 pb-1.5 last:border-0 last:pb-0">
                                <div className="flex justify-between text-purple-700 font-bold">
                                  <span>{log.action}</span>
                                  <span className="text-gray-400 font-normal">{log.time}</span>
                                </div>
                                <div className="text-gray-500">Operador: <span className="font-semibold">{log.user}</span></div>
                                {log.details && <div className="text-gray-600 italic mt-0.5">{log.details}</div>}
                              </div>
                            ))
                          ) : (
                            <div className="text-center italic text-gray-400 text-[10px] py-2">Sem registros de histórico.</div>
                          )}
                        </div>
                      </div>

                      {/* Manual resolution buttons */}
                      {showReviewButtons && (
                        <div className="flex space-x-2 pt-2 border-t border-gray-100">
                          <button
                            onClick={() => setConfirmAction({ type: 'approve', requestId: request.id })}
                            className="flex-1 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold py-2 px-3 rounded text-xs flex justify-center items-center cursor-pointer transition-colors"
                            disabled={savingActionId !== null}
                          >
                            {savingActionId === request.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                            ) : (
                              <Check className="w-3.5 h-3.5 mr-1" />
                            )}
                            Aprovar
                          </button>
                          <button
                            onClick={() => setConfirmAction({ type: 'reject', requestId: request.id })}
                            className="flex-1 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold py-2 px-3 rounded text-xs flex justify-center items-center cursor-pointer transition-colors"
                            disabled={savingActionId !== null}
                          >
                            {savingActionId === request.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                            ) : (
                              <X className="w-3.5 h-3.5 mr-1" />
                            )}
                            Rejeitar
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* FOOTER NAVIGATION */}
      <div className="p-3 bg-white border-t border-gray-200 shrink-0">
        <button 
          onClick={() => onNavigate && onNavigate('dashboard')}
          className="w-full bg-[#333333] hover:bg-[#444444] text-white font-bold py-2.5 text-xs flex justify-center items-center rounded-sm shadow-sm uppercase tracking-wider cursor-pointer transition-colors"
        >
          Voltar ao Painel
        </button>
      </div>

      {/* CREATE NEW SOLICITATION DIALOG / MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[95vh] border border-[#6B21A8] animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#6B21A8] text-white px-4 py-3 flex justify-between items-center">
              <h3 className="font-bold text-sm uppercase tracking-wide">Nova Solicitação de Crédito</h3>
              <button onClick={() => setShowAddModal(false)} className="text-white hover:text-gray-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="p-4 overflow-y-auto space-y-3">
              {modalError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-2 text-xs rounded flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-red-500" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nome do Cliente *</label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-[#6B21A8]"
                  placeholder="Ex: Maria da Silva"
                  disabled={savingNew}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Documento / CPF / Cédula *</label>
                <input
                  type="text"
                  required
                  value={newClientDoc}
                  onChange={(e) => setNewClientDoc(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-[#6B21A8]"
                  placeholder="Ex: CC 1.092.345.121"
                  disabled={savingNew}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Valor Solicitado *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">$</span>
                  <input
                    type="text"
                    required
                    value={newAmount}
                    onChange={handleAmountChange}
                    className="w-full border border-gray-300 rounded pl-9 pr-3 py-2 text-sm font-bold text-gray-800 outline-none focus:border-[#6B21A8]"
                    placeholder="0,00"
                    disabled={savingNew}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Observações / Justificativa</label>
                <textarea
                  value={newObservations}
                  onChange={(e) => setNewObservations(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-xs text-gray-700 outline-none focus:border-[#6B21A8]"
                  placeholder="Informe a finalidade do crédito..."
                  disabled={savingNew}
                />
              </div>

              <div className="flex space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 font-bold py-2 rounded text-xs transition-colors cursor-pointer"
                  disabled={savingNew}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingNew}
                  className="flex-1 bg-[#16A34A] hover:bg-green-600 active:bg-green-700 text-white font-bold py-2 rounded text-xs flex justify-center items-center transition-colors cursor-pointer"
                >
                  {savingNew ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    'Salvar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM ACTION MODAL */}
      <ConfirmModal
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        title={confirmAction?.type === 'approve' ? 'Aprovar Crédito?' : 'Rejeitar Crédito?'}
        subtitle={confirmAction?.type === 'approve' 
          ? 'Tem certeza de que deseja aprovar esta solicitação de crédito?' 
          : 'Tem certeza de que deseja rejeitar esta solicitação de crédito?'}
        confirmText={confirmAction?.type === 'approve' ? 'Sim, Aprovar' : 'Sim, Rejeitar'}
        cancelText="Cancelar"
      />

    </div>
  );
}
