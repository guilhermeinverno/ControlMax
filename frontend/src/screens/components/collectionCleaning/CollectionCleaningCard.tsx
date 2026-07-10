import { Trash2 } from 'lucide-react';
import { fmtCents } from '../../../utils/fmtCents';
import { formatCollectionTime } from '../../../utils/collectionCleaningFilters';
import type { CleaningCollection } from '../../../types/collectionCleaning';

interface CollectionCleaningCardProps {
  collection: CleaningCollection;
  showCancelButton: boolean;
  onCancel: () => void;
}

function StatusBadge({ status }: { status: CleaningCollection['status'] }) {
  if (status === 'active') {
    return (
      <span className="bg-green-100 text-green-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
        Ativa
      </span>
    );
  }
  if (status === 'cancelled') {
    return (
      <span className="bg-red-100 text-red-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
        Cancelada
      </span>
    );
  }
  return (
    <span className="bg-yellow-100 text-yellow-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
      Duplicada
    </span>
  );
}

export function CollectionCleaningCard({ collection, showCancelButton, onCancel }: CollectionCleaningCardProps) {
  return (
    <div className="bg-white border border-gray-300 shadow-sm rounded-sm p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-gray-400 transition-colors">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-[#333333]">{collection.clientName || 'Cliente Sem Nome'}</span>
          <StatusBadge status={collection.status} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-0.5 text-xs text-gray-500">
          <div>
            <span className="font-medium text-gray-400">Cobrador:</span>{' '}
            <span className="font-semibold text-gray-700">{collection.userName || 'Desconhecido'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-400">Horário:</span>{' '}
            <span className="font-semibold text-gray-700">{formatCollectionTime(collection.createdAt)}</span>
          </div>
          <div>
            <span className="font-medium text-gray-400">ID da Venda:</span>{' '}
            <span className="font-mono text-[11px] text-gray-600">
              {collection.saleId ? collection.saleId.substring(0, 8) : '---'}
            </span>
          </div>
        </div>

        {collection.status === 'cancelled' && collection.cancelReason && (
          <div className="bg-red-50 border-l-2 border-red-400 p-2 text-xs text-red-800 mt-2 rounded-r">
            <p className="font-bold uppercase text-[9px] tracking-wider">Motivo do Cancelamento:</p>
            <p className="italic">&quot;{collection.cancelReason}&quot;</p>
            {collection.cancelledBy && (
              <p className="text-[10px] mt-1 text-red-600">
                Cancelado por: <span className="font-semibold">{collection.cancelledBy}</span>
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0">
        <div className="text-right">
          <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Valor</span>
          <span className="text-base font-black text-gray-800">$ {fmtCents(collection.amount || 0)}</span>
        </div>

        {showCancelButton && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-1.5 px-3.5 rounded shadow-sm transition-colors uppercase flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}
