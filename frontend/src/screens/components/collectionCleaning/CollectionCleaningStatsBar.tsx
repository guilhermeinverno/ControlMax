import { fmtCents } from '../../../utils/fmtCents';
import type { CollectionCleaningStats } from '../../../utils/collectionCleaningFilters';

interface CollectionCleaningStatsBarProps {
  stats: CollectionCleaningStats;
}

export function CollectionCleaningStatsBar({ stats }: CollectionCleaningStatsBarProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
      <div className="bg-white border border-gray-300 rounded p-3 shadow-sm flex flex-col justify-between">
        <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Total de Cobranças</span>
        <span className="text-2xl font-black text-gray-800 mt-1">{stats.totalCount}</span>
      </div>
      <div className="bg-green-50 border border-green-200 rounded p-3 shadow-sm flex flex-col justify-between">
        <span className="text-[10px] uppercase font-bold text-green-700 tracking-wider">Ativas</span>
        <span className="text-2xl font-black text-green-800 mt-1">{stats.activeCount}</span>
      </div>
      <div className="bg-red-50 border border-red-200 rounded p-3 shadow-sm flex flex-col justify-between">
        <span className="text-[10px] uppercase font-bold text-red-700 tracking-wider">Canceladas</span>
        <span className="text-2xl font-black text-red-800 mt-1">{stats.cancelledCount}</span>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded p-3 shadow-sm flex flex-col justify-between">
        <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">Valor Total Ativo</span>
        <span className="text-2xl font-black text-blue-800 mt-1">$ {fmtCents(stats.activeValueSum)}</span>
      </div>
    </div>
  );
}
