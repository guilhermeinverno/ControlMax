import { TrendingUp } from 'lucide-react';
import { Screen } from '../../../types';

interface PerformanceHeaderProps {
  onNavigate?: (screen: Screen) => void;
}

export function PerformanceHeader({ onNavigate }: PerformanceHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-300 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-[#6B21A8] flex items-center gap-2 uppercase tracking-tight">
          <TrendingUp className="w-5 h-5 text-[#EA580C]" />
          Desempeño Diario
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Vista global de caja, cumplimiento de cartera y actividades correspondientes a hoy.
        </p>
      </div>
      <div className="flex gap-2">
        <button
          id="btn-perf-dashboard"
          onClick={() => onNavigate?.('dashboard')}
          className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-[#333333] font-bold px-4 py-1.5 rounded text-xs transition-colors shadow-sm"
        >
          Volver al Inicio
        </button>
      </div>
    </div>
  );
}
