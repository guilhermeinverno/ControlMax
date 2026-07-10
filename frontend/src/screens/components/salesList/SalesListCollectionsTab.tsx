import { Calendar } from 'lucide-react';
import { SKELETON_ROW_KEYS } from '../../../constants/placeholders';
import { Screen } from '../../../types';
import { listViewBody } from '../../../utils/listViewBody';
import { formatSalesListCents } from '../../../utils/salesListFormat';
import { SalesListCollection } from '../../../utils/salesListMapper';

interface SalesListCollectionsTabProps {
  collections: SalesListCollection[];
  loadingCollections: boolean;
  onNavigate?: (screen: Screen, params?: Record<string, unknown>) => void;
}

export function SalesListCollectionsTab({
  collections,
  loadingCollections,
  onNavigate,
}: SalesListCollectionsTabProps) {
  const fmt = formatSalesListCents;

  return (
    <div className="space-y-3">
      {listViewBody(
        loadingCollections,
        collections.length,
        <>
          {SKELETON_ROW_KEYS.map((key) => (
            <div key={key} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </>,
        (
          <div className="bg-white p-12 text-center rounded-xl border border-gray-200 shadow-md">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-gray-500">Nenhum recaudo registrado hoje</p>
          </div>
        ),
        <>
          {collections.map((col) => {
            const hour = col.createdAt
              ? col.createdAt.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
              : '--:--';
            return (
              <div
                key={col.id}
                className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between hover:border-emerald-300 transition-colors"
              >
                <div className="min-w-0">
                  <div
                    onClick={() => onNavigate?.('company-list', { clientId: col.clientId })}
                    className="font-extrabold text-gray-800 hover:text-[#6B21A8] text-sm truncate cursor-pointer hover:underline transition-colors"
                    title="Ver ficha do cliente"
                  >
                    {col.clientName}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                    <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                      ID: {col.saleId.slice(-7)}
                    </span>
                    <span>•</span>
                    <span>{hour}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-black text-emerald-600">+${fmt(col.amount)}</div>
                  <div className="text-[10px] text-gray-400">Pago hoje</div>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
