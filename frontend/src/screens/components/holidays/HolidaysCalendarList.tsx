import { CalendarDays, Loader2, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { listViewBody } from '../../../utils/listViewBody';
import type { Holiday } from '../../../types/holiday';
import { MONTH_NAMES } from '../../../types/holiday';

interface HolidaysCalendarListProps {
  loading: boolean;
  holidays: Holiday[];
  groupedHolidays: Record<number, Holiday[]>;
  isAdmin: boolean;
  onToggleActive: (holiday: Holiday) => void;
  onDelete: (holidayId: string, holidayName: string) => void;
}

export function HolidaysCalendarList({
  loading,
  holidays,
  groupedHolidays,
  isAdmin,
  onToggleActive,
  onDelete,
}: HolidaysCalendarListProps) {
  return (
    <div className="lg:col-span-2 bg-white border border-gray-200 shadow-sm rounded-lg p-5 space-y-5">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-purple-700" />
          <span>Calendario Anual de Festivos</span>
        </h2>
        <span className="text-xs text-gray-400 font-medium font-mono">Total: {holidays.length}</span>
      </div>

      {listViewBody(
        loading,
        holidays.length,
        (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-purple-700 mb-2.5" />
            <p className="text-xs text-gray-500">Sincronizando feriados en tiempo real...</p>
          </div>
        ),
        (
          <div className="text-center py-16 text-gray-400 text-xs font-medium">
            No hay días festivos registrados para este período.
          </div>
        ),
        (
          <div className="space-y-6 max-h-[600px] overflow-y-auto pr-1">
            {MONTH_NAMES.map((monthName, monthIdx) => {
              const monthNumber = monthIdx + 1;
              const monthHolidays = groupedHolidays[monthNumber] || [];
              if (monthHolidays.length === 0) return null;

              return (
                <div key={monthNumber} className="space-y-2">
                  <h3 className="text-xs font-extrabold text-purple-800 bg-purple-50/50 px-3 py-1.5 rounded uppercase tracking-wider">
                    {monthName}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {monthHolidays.map((holiday) => (
                      <HolidayRow
                        key={holiday.id}
                        holiday={holiday}
                        isAdmin={isAdmin}
                        onToggleActive={onToggleActive}
                        onDelete={onDelete}
                      />
                    ))}
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

function HolidayRow({
  holiday,
  isAdmin,
  onToggleActive,
  onDelete,
}: {
  holiday: Holiday;
  isAdmin: boolean;
  onToggleActive: (h: Holiday) => void;
  onDelete: (id: string, name: string) => void;
}) {
  return (
    <div
      className={`p-3 border rounded-lg flex items-center justify-between gap-3 transition-colors ${
        holiday.active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 text-gray-400'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-md flex flex-col items-center justify-center font-mono select-none ${
            holiday.active
              ? 'bg-purple-700 text-white font-bold'
              : 'bg-gray-200 text-gray-500 font-medium'
          }`}
        >
          <span className="text-xs leading-none">Día</span>
          <span className="text-sm font-black leading-none mt-0.5">
            {String(holiday.day).padStart(2, '0')}
          </span>
        </div>
        <div>
          <p className={`text-xs font-bold ${holiday.active ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
            {holiday.name}
          </p>
          <p className="text-[10px] text-gray-400 font-mono mt-0.5">Año: {holiday.year}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isAdmin ? (
          <>
            <button
              onClick={() => onToggleActive(holiday)}
              className="text-gray-500 hover:text-purple-700 transition-colors cursor-pointer"
              title={holiday.active ? 'Desactivar Festivo' : 'Activar Festivo'}
            >
              {holiday.active ? (
                <ToggleRight className="w-6 h-6 text-purple-600" />
              ) : (
                <ToggleLeft className="w-6 h-6 text-gray-400" />
              )}
            </button>
            <button
              onClick={() => onDelete(holiday.id, holiday.name)}
              className="p-1.5 rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-150 transition-colors cursor-pointer"
              title="Eliminar permanentemente"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-wide uppercase ${
              holiday.active
                ? 'bg-green-50 text-green-700 border border-green-150'
                : 'bg-gray-100 text-gray-500 border border-gray-200'
            }`}
          >
            {holiday.active ? 'Activo' : 'Inactivo'}
          </span>
        )}
      </div>
    </div>
  );
}
