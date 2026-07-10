import { AlertCircle, Loader2, X } from 'lucide-react';
import type { HtmlFormSubmitEvent, HtmlInputChangeEvent } from '../../../types/reactEvents';

interface CreditRequestCreateModalProps {
  isOpen: boolean;
  saving: boolean;
  error: string | null;
  clientName: string;
  clientDoc: string;
  amount: string;
  observations: string;
  onClose: () => void;
  onSubmit: (e: HtmlFormSubmitEvent) => void;
  onClientNameChange: (value: string) => void;
  onClientDocChange: (value: string) => void;
  onAmountChange: (e: HtmlInputChangeEvent) => void;
  onObservationsChange: (value: string) => void;
}

export function CreditRequestCreateModal({
  isOpen,
  saving,
  error,
  clientName,
  clientDoc,
  amount,
  observations,
  onClose,
  onSubmit,
  onClientNameChange,
  onClientDocChange,
  onAmountChange,
  onObservationsChange,
}: CreditRequestCreateModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[95vh] border border-[#6B21A8] animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-[#6B21A8] text-white px-4 py-3 flex justify-between items-center">
          <h3 className="font-bold text-sm uppercase tracking-wide">Nova Solicitação de Crédito</h3>
          <button onClick={onClose} className="text-white hover:text-gray-200 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-4 overflow-y-auto space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-2 text-xs rounded flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Nome do Cliente *</label>
            <input
              type="text"
              required
              value={clientName}
              onChange={(e) => onClientNameChange(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-[#6B21A8]"
              placeholder="Ex: Maria da Silva"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Documento / CPF / Cédula *</label>
            <input
              type="text"
              required
              value={clientDoc}
              onChange={(e) => onClientDocChange(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-[#6B21A8]"
              placeholder="Ex: CC 1.092.345.121"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Valor Solicitado *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">$</span>
              <input
                type="text"
                required
                value={amount}
                onChange={onAmountChange}
                className="w-full border border-gray-300 rounded pl-9 pr-3 py-2 text-sm font-bold text-gray-800 outline-none focus:border-[#6B21A8]"
                placeholder="0,00"
                disabled={saving}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Observações / Justificativa</label>
            <textarea
              value={observations}
              onChange={(e) => onObservationsChange(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded px-3 py-2 text-xs text-gray-700 outline-none focus:border-[#6B21A8]"
              placeholder="Informe a finalidade do crédito..."
              disabled={saving}
            />
          </div>

          <div className="flex space-x-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 font-bold py-2 rounded text-xs transition-colors cursor-pointer"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#16A34A] hover:bg-green-600 active:bg-green-700 text-white font-bold py-2 rounded text-xs flex justify-center items-center transition-colors cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
