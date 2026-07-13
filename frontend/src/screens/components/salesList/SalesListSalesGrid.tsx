import { Wallet } from 'lucide-react';
import { SKELETON_ROW_KEYS } from '../../../constants/placeholders';
import { Screen } from '../../../types';
import { listViewBody } from '../../../utils/listViewBody';
import { SalesListSale } from '../../../utils/salesListMapper';
import { SalesListSaleCard } from './SalesListSaleCard';

interface SalesListSalesGridProps {
  sales: SalesListSale[];
  loadingSales: boolean;
  onNavigate?: (screen: Screen, params?: Record<string, unknown>) => void;
}

export function SalesListSalesGrid({ sales, loadingSales, onNavigate }: SalesListSalesGridProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-12 border border-gray-300 rounded-t-lg overflow-hidden bg-[#8CC63F] text-white font-extrabold text-[13px] text-center shadow-xs">
        <div className="col-span-6 py-2 border-r border-white/20 bg-[#7cb235]/65"></div>
        <div className="col-span-6 py-2 uppercase tracking-wide">Id Cliente</div>
      </div>

      {listViewBody(
        loadingSales,
        sales.length,
        <>
          {SKELETON_ROW_KEYS.map((key) => (
            <div key={key} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm animate-pulse flex space-x-4">
              <div className="w-1/2 space-y-2 border-r border-gray-100 pr-4">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
              <div className="w-1/2 flex items-center justify-center">
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </>,
        (
          <div className="bg-white p-12 text-center rounded-xl border border-gray-200 shadow-md">
            <Wallet className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-gray-500">Nenhuma venda ativa correspondente</p>
          </div>
        ),
        <>
          {sales.map((sale) => (
            <SalesListSaleCard key={sale.id} sale={sale} onNavigate={onNavigate} />
          ))}
        </>
      )}
    </div>
  );
}
