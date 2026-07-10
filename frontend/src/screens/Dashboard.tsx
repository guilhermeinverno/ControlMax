import { useState } from 'react';
import { AlertCircle, Calculator } from 'lucide-react';
import { auth } from '../lib/firebase';
import { SKELETON_SINGLE_KEY } from '../constants/placeholders';
import { listViewBody } from '../utils/listViewBody';
import { useTenant } from '../hooks/useTenant';
import { useDashboardBoxes } from '../hooks/useDashboardBoxes';
import { filterDashboardBoxes } from '../utils/dashboardBoxFilters';
import { Screen } from '../types';
import { UnitSelectors } from './components/UnitSelectors';
import { DashboardBoxCard } from './components/dashboard/DashboardBoxCard';

interface DashboardProps {
  onNavigate?: (screen: Screen) => void;
}

export function Dashboard({ onNavigate: _onNavigate }: DashboardProps) {
  const { tenantId, role, loading: tenantLoading } = useTenant();
  const { boxes, loading: loadingBoxes, error } = useDashboardBoxes(tenantId);

  const [selectedCnId, setSelectedCnId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [verTodas, setVerTodas] = useState(false);
  const [searchPillActive, setSearchPillActive] = useState(true);

  const filteredBoxes = filterDashboardBoxes(boxes, {
    role,
    currentUserId: auth.currentUser?.uid,
    verTodas,
    selectedCnId,
    selectedUnitId,
  });

  if (tenantLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#6A008A] font-extrabold animate-pulse">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-md mx-auto relative select-none pb-24 px-4 pt-3">
      <UnitSelectors
        selectedCnId={selectedCnId}
        selectedUnitId={selectedUnitId}
        onCnChange={(id) => setSelectedCnId(id)}
        onUnitChange={(id) => setSelectedUnitId(id)}
        showVerTodas
        verTodas={verTodas}
        onVerTodasChange={setVerTodas}
      />

      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-lg p-3.5 mb-6">
        <div className="flex items-center border border-purple-300/80 rounded-md p-1.5 mb-4 bg-white shadow-3xs">
          {searchPillActive && (
            <div className="flex items-center bg-gray-100/90 hover:bg-gray-200 text-[#333333] border border-gray-200 text-[11px] font-extrabold px-2 py-1 rounded space-x-1.5 transition-colors">
              <button
                onClick={() => setSearchPillActive(false)}
                className="text-gray-400 font-black hover:text-red-500 text-xs"
              >
                ×
              </button>
              <span>Todos</span>
            </div>
          )}
          <input
            type="text"
            placeholder=""
            disabled
            className="flex-1 bg-transparent text-xs outline-none border-none cursor-not-allowed"
          />
          <button
            onClick={() => setSearchPillActive(!searchPillActive)}
            className="text-gray-400 text-xs px-2 font-bold hover:text-purple-700"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded text-xs flex items-center gap-2 border border-red-100">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Erro ao carregar dados: {error}</span>
          </div>
        )}

        {listViewBody(
          loadingBoxes,
          filteredBoxes.length,
          (
            <div className="space-y-4">
              <div
                key={SKELETON_SINGLE_KEY}
                className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm animate-pulse space-y-4"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded bg-gray-100" />
                    <div className="space-y-1.5">
                      <div className="h-3 bg-gray-100 rounded w-16" />
                      <div className="h-4 bg-gray-100 rounded w-28" />
                    </div>
                  </div>
                  <div className="w-12 h-10 bg-gray-100 rounded" />
                </div>
                <div className="h-1 bg-gray-100 rounded" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-4 bg-gray-100 rounded" />
                  <div className="h-4 bg-gray-100 rounded" />
                </div>
              </div>
            </div>
          ),
          (
            <div className="text-center py-12 text-gray-400">
              <Calculator className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-xs font-extrabold text-gray-500">Nenhuma caixa correspondente ativa</p>
            </div>
          ),
          (
            <div className="space-y-4">
              {filteredBoxes.map((record) => (
                <DashboardBoxCard key={record.id} record={record} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
