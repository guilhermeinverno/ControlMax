import {
  ArrowRightLeft,
  History as HistoryIcon,
  Inbox,
} from 'lucide-react';
import { Screen } from '../../../types';
import type { TransferSalesTab } from '../../../types/transferSales';

interface TransferSalesHeaderProps {
  activeTab: TransferSalesTab;
  pendingCount: number;
  onTabChange: (tab: TransferSalesTab) => void;
  onNavigate?: (screen: Screen) => void;
}

export function TransferSalesHeader({
  activeTab,
  pendingCount,
  onTabChange,
  onNavigate,
}: TransferSalesHeaderProps) {
  return (
    <div className="bg-[#6A008A] text-white py-5 px-6 shadow-md border-b border-[#52006A]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wider flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-[#8CC63F]" strokeWidth={2.5} />
            Traslado de Unidades
          </h1>
          <p className="text-xs text-purple-200 mt-0.5">
            Gestione la reubicación física de rutas de cobranza y asignación de carteras entre Centros de Negocios.
          </p>
        </div>

        <button
          onClick={() => onNavigate && onNavigate('dashboard')}
          className="text-[11px] font-black text-purple-100 bg-purple-900/40 hover:bg-purple-950/40 px-3 py-1.5 rounded-lg border border-purple-500/30 transition-all uppercase self-start sm:self-center cursor-pointer"
        >
          Volver al Panel
        </button>
      </div>

      <div className="flex flex-wrap gap-2.5 mt-5">
        <button
          onClick={() => onTabChange('transfer')}
          className={`flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all border shadow-xs cursor-pointer ${
            activeTab === 'transfer'
              ? 'bg-[#8CC63F] text-black border-[#8CC63F] font-black'
              : 'bg-white/10 text-white border-white/10 hover:bg-white/20'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4 shrink-0" />
          Trasladar Unidades
        </button>

        <button
          onClick={() => onTabChange('accept')}
          className={`flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all border shadow-xs relative cursor-pointer ${
            activeTab === 'accept'
              ? 'bg-[#8CC63F] text-black border-[#8CC63F] font-black'
              : 'bg-white/10 text-white border-white/10 hover:bg-white/20'
          }`}
        >
          <Inbox className="w-4 h-4 shrink-0" />
          Aceptar Unidades
          {pendingCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-pulse border-2 border-white">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onTabChange('history')}
          className={`flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all border shadow-xs cursor-pointer ${
            activeTab === 'history'
              ? 'bg-[#8CC63F] text-black border-[#8CC63F] font-black'
              : 'bg-white/10 text-white border-white/10 hover:bg-white/20'
          }`}
        >
          <HistoryIcon className="w-4 h-4 shrink-0" />
          Histórico
        </button>
      </div>
    </div>
  );
}
