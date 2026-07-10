import { getErrorMessage } from '../utils/errorMessage';
import { useEffect, useState } from 'react';
import type { HtmlInputChangeEvent } from '../types/reactEvents';
import { Screen } from '../types';
import { useTenant } from '../hooks/useTenant';
import { useMassBoxOpeningData } from '../hooks/useMassBoxOpeningData';
import { ConfirmModal } from './components/ConfirmModal';
import { CollectorAmountSection } from './components/massBoxOpening/CollectorAmountSection';
import { 
  Calculator, Search, ShieldAlert, CheckCircle2, 
  AlertCircle, ChevronLeft
} from 'lucide-react';
import { 
  formatCurrencyBRL, 
  autocompleteCurrencyBRL, 
  parseCurrencyBRLToCents 
} from '../utils/currency';
import { filterCollectors, openBoxesBatch, toggleSelectAll } from '../utils/massBoxOpening';

interface MassBoxOpeningProps {
  onNavigate?: (screen: Screen) => void;
}

const fmt = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });

export function MassBoxOpening({ onNavigate }: MassBoxOpeningProps) {
  const { tenantId, role, isSuperAdmin, loading: tenantLoading } = useTenant();

  // Mode states
  const [useIndividualAmounts, setUseIndividualAmounts] = useState<boolean>(false);
  const [defaultAmount, setDefaultAmount] = useState<string>('0,00');
  const [individualAmounts, setIndividualAmounts] = useState<Record<string, string>>({});
  const [generalObservation, setGeneralObservation] = useState<string>('');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filtering states
  const [cnFilter, setCnFilter] = useState<string>('all');

  // Page operation status states
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);

  const {
    collectors,
    activeBoxes,
    loading,
    loadError,
  } = useMassBoxOpeningData(tenantId);

  useEffect(() => {
    setErrorMsg(loadError);
  }, [loadError]);

  const isAuthorized = role === 'admin' || role === 'supervisor' || isSuperAdmin;

  // Check if a collector already has an open box today
  const getHasOpenBox = (collectorId: string) => activeBoxes.some((box) => box.userId === collectorId);

  const filteredCollectors = filterCollectors(collectors, searchQuery);

  const selectedCollectors = collectors.filter((collector) => selectedIds.includes(collector.id));
  const defaultAmountCents = parseCurrencyBRLToCents(defaultAmount);

  const totalSumCents = selectedCollectors.reduce((sum, collector) => {
    const amtStr = useIndividualAmounts 
      ? individualAmounts[collector.id] || '0,00' 
      : defaultAmount;
    return sum + parseCurrencyBRLToCents(amtStr);
  }, 0);

  // Toggle select all eligible collectors
  const handleToggleSelectAll = () => {
    setSelectedIds((prev) =>
      toggleSelectAll({
        filteredCollectors,
        activeBoxes,
        selectedIds: prev,
      })
    );
  };

  // Safe input handler for default single amount
  const handleDefaultAmountChange = (e: HtmlInputChangeEvent) => {
    setDefaultAmount(formatCurrencyBRL(e.target.value));
  };

  const handleDefaultAmountBlur = () => {
    setDefaultAmount(autocompleteCurrencyBRL(defaultAmount) || '0,00');
  };

  // Safe input handler for individual inline amounts
  const handleIndividualAmountChange = (id: string, val: string) => {
    setIndividualAmounts(prev => ({
      ...prev,
      [id]: formatCurrencyBRL(val)
    }));
  };

  const handleIndividualAmountBlur = (id: string) => {
    setIndividualAmounts(prev => ({
      ...prev,
      [id]: autocompleteCurrencyBRL(individualAmounts[id] || '') || '0,00'
    }));
  };

  // Execute mass open action inside sequential batches
  const handleMassOpen = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (!tenantId) {
        throw new Error('ID do inquilino não configurado.');
      }

      await openBoxesBatch({
        tenantId,
        selectedCollectors,
        useIndividualAmounts,
        individualAmounts,
        defaultAmountCents,
        generalObservation,
      });

      setSuccessMsg(`¡${selectedCollectors.length} cajas abiertas con éxito!`);
      setSelectedIds([]);
      setGeneralObservation('');
    } catch (err: unknown) {
      console.error("Error performing mass box opening write batch:", err);
      const msg = getErrorMessage(err) || 'Error al abrir las cajas';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Authorization validation
  if (!tenantLoading && !isAuthorized) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white border border-gray-300 rounded-lg p-8 max-w-md shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Acceso Restringido</h2>
          <p className="text-sm text-gray-500">
            Acesso restrito a administradores e supervisores. Seu perfil atual é de cobrador.
          </p>
          <button
            onClick={() => {
              if (onNavigate) onNavigate('dashboard');
            }}
            className="w-full bg-[#6B21A8] text-white font-bold py-2.5 rounded shadow hover:bg-purple-800 transition-colors"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Skeleton loading states
  if (loading || tenantLoading) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] p-4 md:p-6 space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm animate-pulse flex items-center justify-between h-20">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          <div className="h-10 w-32 bg-gray-200 rounded" />
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded mb-4" />
          {[1, 2, 3, 4, 5].map(n => (
            <div key={n} className="flex items-center justify-between py-2.5 border-b border-gray-100 animate-pulse">
              <div className="flex items-center gap-3 w-2/3">
                <div className="w-5 h-5 bg-gray-200 rounded" />
                <div className="w-9 h-9 bg-gray-200 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
              <div className="h-8 w-24 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] pb-32">
      
      {/* Header Container */}
      <div className="bg-white border-b border-gray-200 p-4 md:px-6 py-5 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#6B21A8] flex items-center justify-center">
                <Calculator className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-lg font-black text-gray-900 tracking-tight">Apertura Masiva de Cajas</h1>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">
              {selectedIds.length} de {filteredCollectors.length} cobradores seleccionados
            </p>
          </div>
          
          <button 
            type="button"
            onClick={() => {
              if (onNavigate) onNavigate('dashboard');
            }}
            className="self-start md:self-auto flex items-center gap-1.5 text-xs font-bold px-3 py-2 border border-gray-300 rounded bg-[#F3F4F6] text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Volver
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        
        {/* Status Alerts */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-4 text-emerald-800 text-sm flex items-start gap-2.5 shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="font-semibold">{successMsg}</div>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-4 text-red-800 text-sm flex items-start gap-2.5 shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold">Ocurrió un error</h4>
              <p className="mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Form Actions Card */}
          <div className="lg:col-span-4 bg-white border border-gray-300 rounded p-4 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-[#6B21A8] uppercase tracking-wider border-b border-gray-100 pb-2">
              Configuración de Valores
            </h3>

            {/* Selector de modo de valor */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#555555] uppercase block mb-1">Modo de Distribución</label>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setUseIndividualAmounts(false)} 
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded shadow-sm border transition-all ${
                    !useIndividualAmounts 
                      ? 'bg-[#6B21A8] text-white border-[#6B21A8]' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Valor único
                </button>
                <button 
                  type="button"
                  onClick={() => setUseIndividualAmounts(true)}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded shadow-sm border transition-all ${
                    useIndividualAmounts 
                      ? 'bg-[#6B21A8] text-white border-[#6B21A8]' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Valores ind.
                </button>
              </div>
            </div>

            {/* Input valor único */}
            {!useIndividualAmounts && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#555555] uppercase block mb-1">
                  Monto Inicial Predeterminado
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">
                    $
                  </span>
                  <input
                    type="text"
                    value={defaultAmount}
                    onChange={handleDefaultAmountChange}
                    onBlur={handleDefaultAmountBlur}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm outline-none focus:ring-1 focus:ring-[#6B21A8] font-bold text-gray-800"
                    placeholder="0,00"
                  />
                </div>
              </div>
            )}

            {/* Observaciones Generales */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#555555] uppercase block mb-1">
                Observación General (Opcional)
              </label>
              <textarea
                value={generalObservation}
                onChange={(e) => setGeneralObservation(e.target.value)}
                rows={3}
                className="w-full p-2.5 border border-gray-300 rounded text-xs outline-none focus:ring-1 focus:ring-[#6B21A8] text-gray-700"
                placeholder="Escriba comentarios para registrar en las cajas abiertas..."
              />
            </div>
          </div>

          {/* List and Filters Card */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Filter bar */}
            <div className="bg-white border border-gray-300 rounded p-4 shadow-sm flex flex-col md:flex-row gap-4">
              
              <div className="flex-1 min-w-[200px]">
                <label className="text-[11px] font-bold text-[#555555] uppercase block mb-1">Buscar Cobrador</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-xs outline-none focus:ring-1 focus:ring-[#6B21A8]"
                    placeholder="Buscar por nombre..."
                  />
                </div>
              </div>

              {/* CN Select (Mocked for now — Pendente: connect to real CN collection in Firestore when available) */}
              <div className="flex-1 min-w-[200px]">
                <label className="text-[11px] font-bold text-[#555555] uppercase block mb-1">Centro de Negocios (CN)</label>
                <select
                  value={cnFilter}
                  onChange={(e) => setCnFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded bg-white text-xs p-2.5 outline-none shadow-sm h-10 focus:border-[#6B21A8]"
                >
                  <option value="all">Todos los centros (Mock)</option>
                  <option value="cn_default">CN por defecto</option>
                </select>
              </div>

            </div>

            {/* Main Collectors List Container */}
            <div className="bg-white border border-gray-300 rounded shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={
                      filteredCollectors.length > 0 &&
                      filteredCollectors
                        .filter(c => !getHasOpenBox(c.id))
                        .every(c => selectedIds.includes(c.id))
                    }
                    onChange={handleToggleSelectAll}
                    className="w-4.5 h-4.5 text-[#6B21A8] border-gray-300 rounded focus:ring-[#6B21A8]"
                  />
                  <span className="text-xs font-bold text-[#333333] uppercase">Seleccionar todos los elegibles</span>
                </label>
                
                <span className="text-[10px] bg-[#6B21A8]/10 text-[#6B21A8] font-bold px-2 py-0.5 rounded-full">
                  {selectedIds.length} Seleccionados
                </span>
              </div>

              {filteredCollectors.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm italic bg-white">
                  Nenhum cobrador encontrado
                </div>
              ) : (
                <div className="divide-y divide-gray-200 bg-white p-3 space-y-2">
                  {filteredCollectors.map((collector) => {
                    const hasOpenBox = getHasOpenBox(collector.id);
                    const isSelected = selectedIds.includes(collector.id);
                    
                    return (
                      <div 
                        key={collector.id} 
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-gray-200 rounded shadow-sm gap-3 transition-colors ${
                          hasOpenBox 
                            ? 'bg-gray-50 opacity-60 cursor-not-allowed' 
                            : 'bg-white hover:bg-purple-50/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox"
                            disabled={hasOpenBox}
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                setSelectedIds(prev => prev.filter(id => id !== collector.id));
                              } else {
                                setSelectedIds(prev => [...prev, collector.id]);
                              }
                            }}
                            className="w-4.5 h-4.5 text-[#6B21A8] border-gray-300 rounded focus:ring-[#6B21A8] disabled:bg-gray-200"
                          />
                          
                          {/* Avatar/inicial */}
                          <div className="w-9 h-9 rounded-full bg-[#6B21A8]/10 text-[#6B21A8] font-black text-xs flex items-center justify-center shrink-0">
                            {collector.userName?.charAt(0).toUpperCase() || 'C'}
                          </div>
                          
                          <div>
                            <div className="font-bold text-sm text-[#333333]">
                              {collector.userName}
                            </div>
                            <div className="text-[10px] text-gray-500 font-semibold mt-0.5">
                              {collector.defaultUnitName || 'Sin unidad'} · {collector.defaultCnName || 'Sin CN'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <CollectorAmountSection
                            hasOpenBox={hasOpenBox}
                            useIndividualAmounts={useIndividualAmounts}
                            collectorId={collector.id}
                            amount={individualAmounts[collector.id] || ''}
                            onAmountChange={handleIndividualAmountChange}
                            onAmountBlur={handleIndividualAmountBlur}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Sticky Bottom Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 p-4 md:px-6 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-20">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            
            <div className="text-center sm:text-left">
              <div className="text-sm font-black text-gray-900">
                {selectedIds.length} cajas serán abiertas
              </div>
              <div className="text-xs text-[#6B21A8] font-bold mt-0.5">
                Valor total: $ {fmt(totalSumCents)}
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold rounded border border-gray-300 bg-[#F3F4F6] text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setIsConfirmOpen(true)}
                className="flex-1 sm:flex-none px-6 py-2.5 text-xs font-bold rounded bg-[#16A34A] text-white shadow-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                {submitting && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                ABRIR CAIXAS
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          setIsConfirmOpen(false);
          handleMassOpen();
        }}
        title="Confirmar apertura en masa"
        subtitle={`¿Está seguro de que desea abrir ${selectedCollectors.length} cajas con un valor total de $ ${fmt(totalSumCents)}?`}
        confirmText="Sí, abrir cajas"
        cancelText="Cancelar"
      />

    </div>
  );
}
