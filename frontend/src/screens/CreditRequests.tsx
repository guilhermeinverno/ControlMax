import { useState } from 'react';
import { AlertCircle, Clock, Plus, Search } from 'lucide-react';
import { Screen } from '../types';
import { SKELETON_CARD_KEYS } from '../constants/placeholders';
import { ConfirmModal } from './components/ConfirmModal';
import { useTenant } from '../hooks/useTenant';
import { useCreditRequestsData } from '../hooks/useCreditRequestsData';
import {
  countPendingCreditRequests,
  filterCreditRequests,
  type CreditRequestTab,
} from '../utils/creditRequestFilters';
import { listViewBody } from '../utils/listViewBody';
import { CreditRequestCard } from './components/creditRequests/CreditRequestCard';
import { CreditRequestCreateModal } from './components/creditRequests/CreditRequestCreateModal';
import { CreditRequestsTabBar } from './components/creditRequests/CreditRequestsTabBar';

interface CreditRequestsProps {
  onNavigate?: (screen: Screen, params?: Record<string, unknown>) => void;
}

export function CreditRequests({ onNavigate }: CreditRequestsProps) {
  const { tenantId, role, userName, loading: tenantLoading } = useTenant();
  const data = useCreditRequestsData(tenantId, userName);

  const [activeTab, setActiveTab] = useState<CreditRequestTab>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const canCreate = role === 'collector' || role === 'admin';
  const canReview = role === 'admin' || role === 'supervisor';
  const pendingCount = countPendingCreditRequests(data.requests);
  const filteredRequests = filterCreditRequests(data.requests, activeTab, searchTerm);

  return (
    <div className="flex flex-col bg-[#F3F4F6] min-h-screen text-[#333333]">
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
            onClick={data.openAddModal}
            className="bg-[#6B21A8] hover:bg-purple-700 active:bg-purple-800 text-white font-bold text-xs py-1.5 px-3 rounded flex items-center shadow-sm uppercase cursor-pointer transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Nova
          </button>
        )}
      </div>

      {(data.error || data.actionError) && (
        <div className="mx-3 mt-2 bg-red-50 border border-red-200 text-red-700 p-2.5 text-xs flex items-center rounded-sm">
          <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-red-500" />
          <span>{data.error || data.actionError}</span>
        </div>
      )}

      <CreditRequestsTabBar activeTab={activeTab} pendingCount={pendingCount} onTabChange={setActiveTab} />

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

      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3">
        {listViewBody(
          tenantLoading || data.loading,
          filteredRequests.length,
          (
            <div className="space-y-3">
              {SKELETON_CARD_KEYS.slice(0, 3).map((key) => (
                <div key={key} className="animate-pulse bg-white border border-gray-200 h-24 rounded p-3 space-y-3">
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
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
              {filteredRequests.map((request) => (
                <CreditRequestCard
                  key={request.id}
                  request={request}
                  isExpanded={expandedId === request.id}
                  canReview={canReview}
                  savingActionId={data.savingActionId}
                  onToggle={() => setExpandedId(expandedId === request.id ? null : request.id)}
                  onApprove={() => data.setConfirmAction({ type: 'approve', requestId: request.id })}
                  onReject={() => data.setConfirmAction({ type: 'reject', requestId: request.id })}
                />
              ))}
            </div>
          )
        )}
      </div>

      <div className="p-3 bg-white border-t border-gray-200 shrink-0">
        <button
          onClick={() => onNavigate?.('dashboard')}
          className="w-full bg-[#333333] hover:bg-[#444444] text-white font-bold py-2.5 text-xs flex justify-center items-center rounded-sm shadow-sm uppercase tracking-wider cursor-pointer transition-colors"
        >
          Voltar ao Painel
        </button>
      </div>

      <CreditRequestCreateModal
        isOpen={data.showAddModal}
        saving={data.savingNew}
        error={data.modalError}
        clientName={data.newClientName}
        clientDoc={data.newClientDoc}
        amount={data.newAmount}
        observations={data.newObservations}
        onClose={() => data.setShowAddModal(false)}
        onSubmit={data.handleCreateRequest}
        onClientNameChange={data.setNewClientName}
        onClientDocChange={data.setNewClientDoc}
        onAmountChange={data.handleAmountChange}
        onObservationsChange={data.setNewObservations}
      />

      <ConfirmModal
        isOpen={data.confirmAction !== null}
        onClose={() => data.setConfirmAction(null)}
        onConfirm={data.handleConfirmAction}
        title={data.confirmAction?.type === 'approve' ? 'Aprovar Crédito?' : 'Rejeitar Crédito?'}
        subtitle={
          data.confirmAction?.type === 'approve'
            ? 'Tem certeza de que deseja aprovar esta solicitação de crédito?'
            : 'Tem certeza de que deseja rejeitar esta solicitação de crédito?'
        }
        confirmText={data.confirmAction?.type === 'approve' ? 'Sim, Aprovar' : 'Sim, Rejeitar'}
        cancelText="Cancelar"
      />
    </div>
  );
}
