import React, { useState, useEffect } from 'react';
import { Screen } from '../types';
import { ConfirmModal } from './components/ConfirmModal';
import { useBox } from '../hooks/useBox';
import { useTenant } from '../hooks/useTenant';
import { UnitSelectors } from './components/UnitSelectors';
import { Save, X, AlertCircle } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { formatCurrencyBRL, parseCurrencyBRLToFloat, autocompleteCurrencyBRL } from '../utils/currency';

interface OpenBoxProps {
  onNavigate?: (screen: Screen) => void;
}

export function OpenBox({ onNavigate }: OpenBoxProps) {
  const { activeBox, loading: boxLoading, error: boxError, openBox } = useBox();
  const { userName, loading: tenantLoading, tenantId } = useTenant();

  const [showConfirm, setShowConfirm] = useState(false);
  const [amount, setAmount] = useState('');
  const [observation, setObservation] = useState('');

  // Local helper to get today's date in YYYY-MM-DD
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayString();
  const [date, setDate] = useState(todayStr);

  // Opening time: frozen on mount/first render
  const [openingTime, setOpeningTime] = useState('');

  useEffect(() => {
    const d = new Date();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    setOpeningTime(`${hours}:${minutes}`);
  }, []);

  const [selectedCnId, setSelectedCnId] = useState('');
  const [selectedCnName, setSelectedCnName] = useState('');

  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [selectedUnitName, setSelectedUnitName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  const handleOpenBox = async () => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const parsedAmount = parseCurrencyBRLToFloat(amount);
      const amountInCents = Math.round(parsedAmount * 100);

      await openBox({
        unitId: selectedUnitId,
        unitName: selectedUnitName,
        cnId: selectedCnId,
        cnName: selectedCnName,
        initialAmount: amountInCents,
        observation: observation || undefined
      });

      setSuccessToast(true);
      setTimeout(() => {
        setSuccessToast(false);
        if (onNavigate) onNavigate('dashboard');
      }, 2000);
    } catch (err: unknown) {
      setSubmitError((err instanceof Error ? err.message : String(err)) || 'Error al abrir la caja.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = boxLoading || tenantLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col bg-[#F3F4F6] min-h-screen text-[#333333] justify-center items-center">
        <div className="border-2 border-[#6B21A8] border-t-transparent rounded-full w-6 h-6 animate-spin" />
        <p className="mt-2 text-xs text-gray-500 font-semibold uppercase tracking-wider">Verificando caja...</p>
      </div>
    );
  }

  // If already has an active open box
  if (activeBox) {
    return (
      <div className="flex flex-col bg-[#F3F4F6] min-h-screen text-[#333333] px-3 py-4">
        <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 p-4 rounded-sm shadow-sm space-y-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <h2 className="font-bold text-sm">Você já tem uma caixa aberta</h2>
          </div>
          
          <div className="text-xs space-y-2 bg-yellow-100/40 p-3 rounded border border-yellow-200">
            <div>
              <span className="font-bold uppercase text-[10px] text-yellow-900 block">Unidad</span>
              <span className="text-sm font-semibold">{activeBox.unitName}</span>
            </div>
            <div>
              <span className="font-bold uppercase text-[10px] text-yellow-900 block">Centro de Negócios</span>
              <span className="text-sm font-semibold">{activeBox.cnName}</span>
            </div>
            <div>
              <span className="font-bold uppercase text-[10px] text-yellow-900 block">Fecha y Hora de Apertura</span>
              <span className="text-sm font-semibold">
                {activeBox.openedAt ? activeBox.openedAt.toDate().toLocaleString('pt-BR') : 'N/A'}
              </span>
            </div>
            <div>
              <span className="font-bold uppercase text-[10px] text-yellow-900 block">Valor Inicial</span>
              <span className="text-sm font-bold text-green-700">$ {(activeBox.initialAmount / 100).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              onClick={() => onNavigate && onNavigate('box-summary')}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2.5 rounded shadow-sm text-sm transition-colors text-center uppercase tracking-wider cursor-pointer"
            >
              Ver Caixa
            </button>
            <button
              onClick={() => onNavigate && onNavigate('close-box')}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded shadow-sm text-sm transition-colors text-center uppercase tracking-wider cursor-pointer"
            >
              Fechar Caixa
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#F3F4F6] min-h-screen text-[#333333]">
      {/* Toast Success Notification */}
      {successToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#16A34A] text-white px-4 py-3 rounded-md shadow-lg flex items-center space-x-2 border border-green-500 animate-in fade-in slide-in-from-top-4 duration-300">
          <span className="font-bold text-sm">✓ Caixa aberta com sucesso!</span>
        </div>
      )}

      <div className="px-3 pt-3 pb-6 flex flex-col space-y-3">
        {/* FORMULARIO */}
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm p-3">
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-[#555555] mb-1 uppercase">Fecha</label>
              <input 
                type="date" 
                value={date}
                max={todayStr}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs font-bold text-[#333333] outline-none focus:border-[#6B21A8]"
              />
            </div>
            
            <div>
              <label className="block text-[11px] font-bold text-[#555555] mb-1 uppercase">Hora apertura (Automática)</label>
              <input 
                type="time" 
                value={openingTime}
                disabled
                className="w-full border border-gray-200 bg-gray-50 rounded px-2.5 py-1.5 text-xs text-[#777777] outline-none cursor-not-allowed"
              />
            </div>

            <div className="notranslate" translate="no">
              <UnitSelectors
                selectedCnId={selectedCnId}
                selectedUnitId={selectedUnitId}
                onCnChange={(id, name) => {
                  setSelectedCnId(id);
                  setSelectedCnName(name);
                }}
                onUnitChange={(id, name) => {
                  setSelectedUnitId(id);
                  setSelectedUnitName(name);
                }}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#555555] mb-1 uppercase">Valor Inicial *</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">$</span>
                <input 
                  type="text" 
                  value={amount}
                  onChange={(e) => setAmount(formatCurrencyBRL(e.target.value))}
                  onBlur={(e) => {
                    const autocompleted = autocompleteCurrencyBRL(e.target.value);
                    if (autocompleted) setAmount(autocompleted);
                  }}
                  className="w-full border border-gray-300 rounded pl-8 pr-2.5 py-2 text-sm font-bold text-[#333333] outline-none focus:border-[#6B21A8]"
                  placeholder="0,00"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#555555] mb-1 uppercase">Observación</label>
              <textarea 
                rows={2}
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-[#333333] outline-none focus:border-[#6B21A8]"
                placeholder="Opcional..."
              />
            </div>
          </div>
        </div>

        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-2.5 rounded-sm text-xs font-semibold">
            {submitError}
          </div>
        )}

        {/* BOTONES */}
        <div className="pt-2 flex flex-col space-y-2">
          <button 
            onClick={() => {
              if (!selectedCnId) {
                setSubmitError('Debe seleccionar un Centro de Negocios.');
                return;
              }
              if (!selectedUnitId) {
                setSubmitError('Debe seleccionar una Unidad.');
                return;
              }
              const parsed = parseCurrencyBRLToFloat(amount);
              if (isNaN(parsed) || parsed < 0) {
                setSubmitError('El valor inicial debe ser un número válido mayor o igual a cero.');
                return;
              }
              setSubmitError(null);
              setShowConfirm(true);
            }}
            disabled={isSubmitting}
            className={`w-full bg-[#16A34A] text-white font-bold py-2.5 text-sm flex justify-center items-center rounded-sm shadow-sm hover:bg-[#15803D] transition-colors ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? (
              <div className="border-2 border-white border-t-transparent rounded-full w-4 h-4 animate-spin mr-1.5" />
            ) : (
              <Save className="w-4 h-4 mr-1.5" />
            )}
            ABRIR CAJA
          </button>
          
          <button 
            onClick={() => onNavigate && onNavigate('dashboard')}
            disabled={isSubmitting}
            className="w-full bg-[#F3F4F6] text-[#333333] border border-gray-300 font-bold py-2.5 text-sm flex justify-center items-center rounded-sm shadow-sm hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 mr-1.5" />
            Cancelar
          </button>
        </div>
      </div>

      <ConfirmModal 
        isOpen={showConfirm} 
        onClose={() => setShowConfirm(false)} 
        onConfirm={() => {
          setShowConfirm(false);
          handleOpenBox();
        }}
        title="¿Está seguro de abrir la caja?"
        subtitle="Confirmar apertura"
        confirmText="Sí abrir"
      />
    </div>
  );
}
