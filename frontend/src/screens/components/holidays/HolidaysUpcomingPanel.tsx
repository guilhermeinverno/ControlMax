import { Clock, Loader2 } from 'lucide-react';
import { listViewBody } from '../../../utils/listViewBody';
import type { Holiday } from '../../../types/holiday';
import { MONTH_NAMES } from '../../../types/holiday';

interface HolidaysUpcomingPanelProps {
  loading: boolean;
  upcoming: { holiday: Holiday; nextDate: Date }[];
}

export function HolidaysUpcomingPanel({ loading, upcoming }: HolidaysUpcomingPanelProps) {
  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-4 space-y-3">
      <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-1.5">
        <Clock className="w-4 h-4 text-purple-700" />
        <span>Próximos 5 Festivos</span>
      </h3>

      {listViewBody(
        loading,
        upcoming.length,
        (
          <div className="flex items-center justify-center py-6 text-xs text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Cargando...
          </div>
        ),
        (
          <div className="text-center py-6 text-gray-400 text-xs">No hay feriados activos próximos.</div>
        ),
        (
          <div className="space-y-2">
            {upcoming.map(({ holiday, nextDate }) => {
              const daysLeft = Math.ceil(
                (nextDate.getTime() - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)
              );
              return (
                <div
                  key={holiday.id}
                  className="p-2.5 bg-purple-50/50 rounded border border-purple-100/50 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-gray-800">{holiday.name}</span>
                    <span className="block text-[10px] text-gray-500 font-mono">
                      {String(holiday.day).padStart(2, '0')} / {MONTH_NAMES[holiday.month - 1]}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] bg-purple-100 text-purple-700 font-black px-2 py-0.5 rounded-full">
                      En {daysLeft} {daysLeft === 1 ? 'día' : 'días'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
