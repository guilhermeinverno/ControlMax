import { Trash2, X } from 'lucide-react';
import { fmtCents } from '../../../utils/fmtCents';
import type { CleaningCollection } from '../../../types/collectionCleaning';

interface CollectionCancelModalProps {
  isOpen: boolean;
  collection: CleaningCollection | null;
  cancelReason: string;
  cancelLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onReasonChange: (value: string) => void;
}

export function CollectionCancelModal({
  isOpen,
  collection,
  cancelReason,
  cancelLoading,
  onClose,
  onConfirm,
  onReasonChange,
}: CollectionCancelModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-sm border border-gray-300 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-between">
          <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-1.5">
            <Trash2 className="w-4 h-4" />
            Cancelar Cobrança
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
            disabled={cancelLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {collection && (
            <div className="bg-gray-50 border border-gray-200 rounded p-3 text-xs space-y-1">
              <p>
                <span className="font-bold text-[#555555] uppercase text-[9px] block">Cliente</span>
                <span className="text-sm font-semibold text-gray-800">{collection.clientName}</span>
              </p>
              <p>
                <span className="font-bold text-[#555555] uppercase text-[9px] block">Valor da Cobrança</span>
                <span className="text-sm font-black text-gray-800">$ {fmtCents(collection.amount)}</span>
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
              onChange={(e) => onReasonChange(e.target.value)}
              disabled={cancelLoading}
              rows={4}
              className="w-full border border-gray-300 rounded p-2 text-xs font-medium bg-white outline-none focus:border-red-500"
            />
            <p className="text-[10px] text-gray-400 mt-1 flex justify-between">
              <span>Mínimo 10 caracteres</span>
              <span
                className={
                  cancelReason.trim().length >= 10 ? 'text-green-600 font-bold' : 'text-red-500 font-semibold'
                }
              >
                {cancelReason.trim().length} caracteres
              </span>
            </p>
          </div>
        </div>

        <div className="bg-gray-100 px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={cancelLoading}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold py-1.5 px-4 rounded transition-colors uppercase"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={cancelLoading || cancelReason.trim().length < 10}
            className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-xs font-bold py-1.5 px-5 rounded shadow-sm transition-colors uppercase flex items-center gap-1"
          >
            {cancelLoading ? 'Salvando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}
