import { AlertCircle, Calendar, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useTenant } from '../hooks/useTenant';
import { useHolidaysData } from '../hooks/useHolidaysData';
import { groupHolidaysByMonth, getUpcomingHolidays } from '../utils/holidayAggregates';
import { HolidaysCalendarList } from './components/holidays/HolidaysCalendarList';
import { HolidaysUpcomingPanel } from './components/holidays/HolidaysUpcomingPanel';
import { HolidaysAddForm } from './components/holidays/HolidaysAddForm';

export function Holidays() {
  const { tenantId, role } = useTenant();
  const isAdmin = role === 'admin';
  const isReadOnly = !isAdmin;

  const data = useHolidaysData(tenantId, isReadOnly);
  const groupedHolidays = groupHolidaysByMonth(data.holidays);
  const upcomingFive = getUpcomingHolidays(data.holidays);

  return (
    <div className="flex flex-col space-y-6 w-full max-w-[1550px] mx-auto animate-fadeIn px-2 sm:px-4">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-purple-700" />
          <span>Configuración de Días Festivos</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Registre y configure los días feriados anuales. El sistema bloqueará automáticamente la generación de cobros e intereses en las fechas indicadas.
        </p>
      </div>

      {data.errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{data.errorMsg}</span>
          </div>
          <button onClick={() => data.setErrorMsg(null)} className="text-red-900 font-bold hover:underline">
            X
          </button>
        </div>
      )}

      {data.successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-3.5 rounded text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span>{data.successMsg}</span>
          </div>
          <button onClick={() => data.setSuccessMsg(null)} className="text-green-900 font-bold hover:underline">
            X
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <HolidaysCalendarList
          loading={data.loading}
          holidays={data.holidays}
          groupedHolidays={groupedHolidays}
          isAdmin={isAdmin}
          onToggleActive={data.handleToggleActive}
          onDelete={data.handleDeleteHoliday}
        />

        <div className="space-y-6">
          <HolidaysUpcomingPanel loading={data.loading} upcoming={upcomingFive} />

          {isAdmin && (
            <HolidaysAddForm
              submitting={data.submitting}
              newHolidayName={data.newHolidayName}
              newHolidayDay={data.newHolidayDay}
              newHolidayMonth={data.newHolidayMonth}
              newHolidayYear={data.newHolidayYear}
              newHolidayActive={data.newHolidayActive}
              onSubmit={data.handleAddHoliday}
              onNameChange={data.setNewHolidayName}
              onDayChange={data.setNewHolidayDay}
              onMonthChange={data.setNewHolidayMonth}
              onYearChange={data.setNewHolidayYear}
              onActiveChange={data.setNewHolidayActive}
            />
          )}

          {isReadOnly && (
            <div className="bg-purple-50 p-4 rounded border border-purple-100 text-xs text-purple-800 leading-relaxed space-y-1.5">
              <h4 className="font-bold flex items-center gap-1.5 text-purple-900 uppercase tracking-wide text-[10px]">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Acceso de Consulta</span>
              </h4>
              <p>
                Tu nivel de acceso actual es de solo lectura. Para agregar, desactivar o eliminar feriados anuales, comunícate con un Administrador del sistema.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
