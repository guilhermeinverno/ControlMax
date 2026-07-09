import { getErrorMessage } from '../utils/errorMessage';
import { useState } from 'react';
import { Screen } from '../types';
import { ConfirmModal } from './components/ConfirmModal';
import { UnitSelectors } from './components/UnitSelectors';
import { useBox } from '../hooks/useBox';
import { Save, X } from 'lucide-react';

interface CloseBoxProps {
  onNavigate?: (screen: Screen) => void;
}

export function CloseBox({ onNavigate }: CloseBoxProps) {
  const { activeBox, loading, error, closeBox } = useBox();
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fmt = (cents: number) => 
    (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleConfirmClose = async () => {
    setShowConfirm(false);
    setSubmitting(true);
    setSubmitError(null);
    try {
      await closeBox();
      if (onNavigate) {
        onNavigate('box-summary');
      }
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12 bg-[#F3F4F6] min-h-screen">
        <div className="border-2 border-[#6B21A8] border-t-transparent rounded-full w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (error && !activeBox) {
    return (
      <div className="flex flex-col bg-[#F3F4F6] min-h-screen text-[#333333]">
        <UnitSelectors />
        <div className="px-3 pt-3 pb-6">
          <div className="bg-red-50 border border-red-300 rounded-sm p-4 text-xs flex flex-col items-center text-center space-y-2 shadow-sm">
            <span className="font-bold text-red-800 text-sm">Erro ao verificar caixa aberta</span>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!activeBox) {
    return (
      <div className="flex flex-col bg-[#F3F4F6] min-h-screen text-[#333333]">
        <UnitSelectors />
        <div className="px-3 pt-3 pb-6 flex flex-col space-y-3">
          <div className="bg-yellow-50 border border-yellow-300 rounded-sm p-4 text-xs flex flex-col items-center text-center space-y-2 shadow-sm">
            <span className="font-bold text-yellow-800 text-sm">Nenhuma caixa aberta encontrada</span>
            <span className="text-yellow-600">Por favor, abra uma caixa antes de tentar fechá-la.</span>
          </div>
          <button 
            onClick={() => onNavigate && onNavigate('open-box')}
            className="w-full bg-[#6B21A8] text-white font-bold py-2.5 text-sm flex justify-center items-center rounded-sm shadow-sm hover:bg-[#581c87]"
          >
            Abrir Caja
          </button>
        </div>
      </div>
    );
  }

  const cajaFinal = activeBox.initialAmount + activeBox.totalCollections + activeBox.totalIncomes - activeBox.totalExpenses - activeBox.totalSales - activeBox.totalTransfers;

  return (
    <div className="flex flex-col bg-[#F3F4F6] min-h-screen text-[#333333]">
      {/* Filtros Superiores */}
      <UnitSelectors />

      <div className="px-3 pt-3 pb-6 flex flex-col space-y-3">
        {/* Info da caixa (acima do resumo financeiro) */}
        <div className="bg-purple-50 border border-purple-200 shadow-sm rounded-sm p-3 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-purple-700 font-semibold">Unidad:</span>
            <span className="font-bold text-purple-900">{activeBox.unitName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-purple-700 font-semibold">CN:</span>
            <span className="font-bold text-purple-900">{activeBox.cnName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-purple-700 font-semibold">Cobrador:</span>
            <span className="font-bold text-purple-900">{activeBox.userName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-purple-700 font-semibold">Abertura:</span>
            <span className="font-bold text-purple-900">
              {activeBox.openedAt && typeof activeBox.openedAt.toDate === 'function'
                ? activeBox.openedAt.toDate().toLocaleString('pt-BR')
                : ''}
            </span>
          </div>
        </div>

        {/* RESUMEN FINANCIERO */}
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm p-3 text-xs">
          <h3 className="font-bold text-[#6B21A8] border-b border-gray-200 pb-1 mb-2 uppercase text-[10px] tracking-wider">Resumen Financiero</h3>
          <div className="space-y-1.5">
            <div className="flex justify-between border-b border-dashed border-gray-100 pb-1">
              <span className="text-[#555555]">Caja Inicial</span>
              <span className="font-semibold text-[#333333]">$ {fmt(activeBox.initialAmount)}</span>
            </div>
            <div className="flex justify-between border-b border-dashed border-gray-100 pb-1">
              <span className="text-[#555555]">Ingresos</span>
              <span className="font-semibold text-[#16A34A]">+ $ {fmt(activeBox.totalIncomes)}</span>
            </div>
            <div className="flex justify-between border-b border-dashed border-gray-100 pb-1">
              <span className="text-[#555555]">Gastos</span>
              <span className="font-semibold text-[#DC2626]">- $ {fmt(activeBox.totalExpenses)}</span>
            </div>
            <div className="flex justify-between border-b border-dashed border-gray-100 pb-1">
              <span className="text-[#555555]">Ventas (Contado)</span>
              <span className="font-semibold text-[#DC2626]">- $ {fmt(activeBox.totalSales)}</span>
            </div>
            <div className="flex justify-between border-b border-dashed border-gray-100 pb-1">
              <span className="text-[#555555]">Recaudo</span>
              <span className="font-semibold text-[#16A34A]">+ $ {fmt(activeBox.totalCollections)}</span>
            </div>
            <div className="flex justify-between border-b border-dashed border-gray-100 pb-1">
              <span className="text-[#555555]">Transferencias</span>
              <span className="font-semibold text-[#333333]">$ {fmt(activeBox.totalTransfers)}</span>
            </div>
          </div>
        </div>

        {/* RESULTADO */}
        <div className="bg-[#FAF5FF] border border-[#D8B4FE] shadow-sm rounded-sm p-3">
           <h3 className="font-bold text-[#7B1FA2] text-[10px] uppercase tracking-wider mb-1">Resultado</h3>
           <div className="flex justify-between items-center">
             <span className="font-bold text-[#333333] uppercase text-sm">Caja Final</span>
             <span className="font-extrabold text-[#7B1FA2] text-xl">$ {fmt(cajaFinal)}</span>
           </div>
        </div>

        {/* Error from hook if exists */}
        {error && (
          <div className="bg-red-50 border border-red-300 rounded-sm p-3 text-xs text-red-800 font-semibold shadow-sm">
            {error}
          </div>
        )}

        {/* BOTONES */}
        <div className="pt-2 flex flex-col space-y-2">
          <button 
            onClick={() => setShowConfirm(true)}
            disabled={submitting}
            className="w-full bg-[#16A34A] text-white font-bold py-2.5 text-sm flex justify-center items-center rounded-sm shadow-sm hover:bg-[#148a3e] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <div className="border-2 border-white border-t-transparent rounded-full w-4 h-4 animate-spin mr-1.5" />
            ) : (
              <Save className="w-4 h-4 mr-1.5" />
            )}
            CERRAR CAJA
          </button>
          <button 
            onClick={() => onNavigate && onNavigate('dashboard')}
            disabled={submitting}
            className="w-full bg-[#F3F4F6] text-[#333333] border border-gray-300 font-bold py-2.5 text-sm flex justify-center items-center rounded-sm shadow-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4 mr-1.5" />
            Cancelar
          </button>
        </div>

        {/* Error during submission if exists */}
        {submitError && (
          <div className="bg-red-50 border border-red-300 rounded-sm p-3 text-xs text-red-800 font-semibold shadow-sm">
            {submitError}
          </div>
        )}

      </div>

      <ConfirmModal 
        isOpen={showConfirm} 
        onClose={() => setShowConfirm(false)} 
        onConfirm={handleConfirmClose}
        title="¿Confirmar cierre de caja?"
        subtitle={`Monto final: $ ${fmt(cajaFinal)}`}
        confirmText="Sí cerrar"
      />

    </div>
  );
}
