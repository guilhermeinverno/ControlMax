import { useState } from 'react';
import type { HtmlFormSubmitEvent } from '../types/reactEvents';
import { Screen } from '../types';
import { SKELETON_CARD_KEYS } from '../constants/placeholders';
import { listViewBody } from '../utils/listViewBody';
import { useTenant } from '../hooks/useTenant';
import { useCollectionCleaningData } from '../hooks/useCollectionCleaningData';
import {
  computeCollectionCleaningStats,
  filterDisplayedCollections,
} from '../utils/collectionCleaningFilters';
import type { CollectionStatusFilter } from '../types/collectionCleaning';
import { AlertCircle, CheckCircle, Search, ShieldAlert } from 'lucide-react';
import { CollectionCleaningStatsBar } from './components/collectionCleaning/CollectionCleaningStatsBar';
import { CollectionCleaningCard } from './components/collectionCleaning/CollectionCleaningCard';
import { CollectionCancelModal } from './components/collectionCleaning/CollectionCancelModal';

interface CollectionCleaningProps {
  onNavigate?: (screen: Screen) => void;
}

export function CollectionCleaning({ onNavigate }: CollectionCleaningProps) {
  const { tenantId, role, userName, loading: tenantLoading } = useTenant();
  const data = useCollectionCleaningData(tenantId, userName);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CollectionStatusFilter>('all');
  const [dateInput, setDateInput] = useState(data.selectedDate);
  const [searchQueryInput, setSearchQueryInput] = useState('');
  const [statusFilterInput, setStatusFilterInput] = useState<CollectionStatusFilter>('all');

  const stats = computeCollectionCleaningStats(data.collections);
  const displayedCollections = filterDisplayedCollections(data.collections, searchQuery, statusFilter);
  const isAdminOrSupervisor = role === 'admin' || role === 'supervisor';

  const handleSearch = (e: HtmlFormSubmitEvent) => {
    e.preventDefault();
    data.setSelectedDate(dateInput);
    setSearchQuery(searchQueryInput);
    setStatusFilter(statusFilterInput);
  };

  return (
    <div className="flex flex-col bg-[#F3F4F6] min-h-screen text-[#333333]">
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
          <button
            id="btn-nav-dashboard"
            onClick={() => onNavigate?.('dashboard')}
            className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-[#333] font-bold px-4 py-1.5 rounded text-xs transition-colors shadow-sm"
          >
            Volver al Inicio
          </button>
        </div>
        <CollectionCleaningStatsBar stats={stats} />
      </div>

      <div className="p-4 space-y-4">
        {data.infoMessage && (
          <div className="bg-green-100 border border-green-300 text-green-800 p-3 rounded text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
            <span>{data.infoMessage}</span>
          </div>
        )}

        <form onSubmit={handleSearch} className="bg-white border border-gray-300 shadow-sm rounded p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-[#555555] uppercase mb-1">Data Selecionada</label>
              <input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs font-bold text-[#333333] bg-white outline-none focus:border-[#16A34A]"
              />
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
              <label className="block text-[11px] font-bold text-[#555555] uppercase mb-1">Filtrar por Status</label>
              <select
                value={statusFilterInput}
                onChange={(e) => setStatusFilterInput(e.target.value as CollectionStatusFilter)}
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

        {data.error && (
          <div className="bg-red-100 border border-red-300 text-red-800 p-4 rounded text-sm flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Erro de Sincronização</p>
              <p className="text-xs">{data.error}</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h2 className="text-xs font-bold text-[#555555] uppercase tracking-wider pl-1">
            Cobranças Registradas ({displayedCollections.length})
          </h2>

          {listViewBody(
            data.loading || tenantLoading,
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
                {displayedCollections.map((col) => (
                  <CollectionCleaningCard
                    key={col.id}
                    collection={col}
                    showCancelButton={isAdminOrSupervisor && col.status === 'active'}
                    onCancel={() => data.openCancelModal(col)}
                  />
                ))}
              </div>
            )
          )}
        </div>
      </div>

      <CollectionCancelModal
        isOpen={data.modalOpen}
        collection={data.collectionToCancel}
        cancelReason={data.cancelReason}
        cancelLoading={data.cancelLoading}
        onClose={() => data.setModalOpen(false)}
        onConfirm={data.confirmCancel}
        onReasonChange={data.setCancelReason}
      />
    </div>
  );
}
