import { Loader2, ShieldCheck } from 'lucide-react';
import type { HtmlFormSubmitEvent } from '../../../types/reactEvents';
import { MONTH_NAMES } from '../../../types/holiday';

interface HolidaysAddFormProps {
  submitting: boolean;
  newHolidayName: string;
  newHolidayDay: number;
  newHolidayMonth: number;
  newHolidayYear: number;
  newHolidayActive: boolean;
  onSubmit: (e: HtmlFormSubmitEvent) => void;
  onNameChange: (value: string) => void;
  onDayChange: (day: number) => void;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onActiveChange: (active: boolean) => void;
}

export function HolidaysAddForm({
  submitting,
  newHolidayName,
  newHolidayDay,
  newHolidayMonth,
  newHolidayYear,
  newHolidayActive,
  onSubmit,
  onNameChange,
  onDayChange,
  onMonthChange,
  onYearChange,
  onActiveChange,
}: HolidaysAddFormProps) {
  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-5 space-y-4">
      <h3 className="text-xs font-black text-purple-800 uppercase tracking-wider border-b border-purple-100 pb-2 flex items-center gap-1.5">
        <ShieldCheck className="w-4 h-4" />
        <span>Agregar Nuevo Festivo</span>
      </h3>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex flex-col">
          <label className="text-xs font-bold text-gray-600 mb-1">Nombre / Descripción *</label>
          <input
            type="text"
            value={newHolidayName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Ej. Año Nuevo, Independencia"
            className="border border-gray-300 rounded p-2 text-sm text-gray-800 bg-white focus:outline-none focus:border-purple-600"
            disabled={submitting}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-600 mb-1">Día (1-31) *</label>
            <select
              value={newHolidayDay}
              onChange={(e) => onDayChange(Number(e.target.value))}
              className="border border-gray-300 rounded p-2 text-sm text-gray-800 bg-white focus:outline-none focus:border-purple-600 cursor-pointer"
              disabled={submitting}
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {String(d).padStart(2, '0')}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-600 mb-1">Mes *</label>
            <select
              value={newHolidayMonth}
              onChange={(e) => onMonthChange(Number(e.target.value))}
              className="border border-gray-300 rounded p-2 text-sm text-gray-800 bg-white focus:outline-none focus:border-purple-600 cursor-pointer"
              disabled={submitting}
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={name} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-bold text-gray-600 mb-1">Año de Referencia</label>
          <input
            type="number"
            value={newHolidayYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="border border-gray-300 rounded p-2 text-sm text-gray-800 bg-white focus:outline-none focus:border-purple-600 font-mono"
            disabled={submitting}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="new-holiday-active"
            checked={newHolidayActive}
            onChange={(e) => onActiveChange(e.target.checked)}
            className="w-4 h-4 text-purple-700 rounded focus:ring-purple-600 cursor-pointer"
            disabled={submitting}
          />
          <label htmlFor="new-holiday-active" className="text-xs font-bold text-gray-700 cursor-pointer select-none">
            Iniciar como activo
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-purple-700 hover:bg-purple-800 disabled:bg-purple-400 text-white font-bold py-2.5 rounded text-xs uppercase tracking-wider shadow transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Registrando...</span>
            </>
          ) : (
            <span>Registrar Festivo</span>
          )}
        </button>
      </form>
    </div>
  );
}
