import { logFirestoreError } from '../utils/firestoreError';
import { useState, useEffect } from 'react';
import type { HtmlFormSubmitEvent } from '../types/reactEvents';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp
} from 'firebase/firestore';
import { useTenant } from '../hooks/useTenant';
import { listViewBody } from '../utils/listViewBody';
import { 
  Calendar, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  CalendarDays,
  ShieldCheck,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

interface Holiday {
  id: string;
  name: string;
  day: number;
  month: number;
  year: number;
  active: boolean;
  tenantId: string;
  createdAt?: any; // FIXED_BY_SCRIPT
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function Holidays() {
  const { tenantId, role } = useTenant();

  // Access rights
  const isAdmin = role === 'admin';
  const isReadOnly = !isAdmin; // supervisor and collector can only view

  // States
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states for adding a holiday
  const [newHolidayName, setNewHolidayName] = useState<string>('');
  const [newHolidayDay, setNewHolidayDay] = useState<number>(1);
  const [newHolidayMonth, setNewHolidayMonth] = useState<number>(1);
  const [newHolidayYear, setNewHolidayYear] = useState<number>(new Date().getFullYear());
  const [newHolidayActive, setNewHolidayActive] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Real-time onSnapshot listener for Holidays
  useEffect(() => {
    if (!tenantId) return;

    setLoading(true);
    const holidaysQuery = query(
      collection(db, 'holidays'),
      where('tenantId', '==', tenantId)
    );

    const unsubscribe = onSnapshot(holidaysQuery, (snapshot) => {
      const loaded: Holiday[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name || 'Feriado',
          day: Number(data.day || 1),
          month: Number(data.month || 1),
          year: Number(data.year || new Date().getFullYear()),
          active: data.active !== undefined ? data.active : true,
          tenantId: data.tenantId
        };
      });

      // Sort holidays by month, then by day
      loaded.sort((a, b) => {
        if (a.month !== b.month) return a.month - b.month;
        return a.day - b.day;
      });

      setHolidays(loaded);
      setLoading(false);
    }, (error) => {
      setErrorMsg('Error al conectar con la lista de días festivos.');
      try {
        logFirestoreError(error, 'list', 'holidays', { label: 'Firestore Error in Holidays', throwError: true, includeAuth: false });
      } catch (e) {}
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tenantId]);

  // Handler to add a new holiday (Admin only)
  const handleAddHoliday = async (e: HtmlFormSubmitEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    if (!newHolidayName.trim()) {
      setErrorMsg('Por favor ingrese el nombre del día festivo.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload = {
        name: newHolidayName.trim(),
        day: Number(newHolidayDay),
        month: Number(newHolidayMonth),
        year: Number(newHolidayYear),
        active: newHolidayActive,
        tenantId,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'holidays'), payload);
      
      setSuccessMsg(`Día festivo "${payload.name}" agregado con éxito.`);
      setNewHolidayName('');
      setNewHolidayDay(1);
      setNewHolidayMonth(1);
    } catch (err) {
      setErrorMsg('No se pudo guardar el día festivo.');
      try {
        logFirestoreError(err, 'create', 'holidays', { label: 'Firestore Error in Holidays', throwError: true, includeAuth: false });
      } catch (e) {}
    } finally {
      setSubmitting(false);
    }
  };

  // Handler to toggle holiday active status (Admin only)
  const handleToggleActive = async (holiday: Holiday) => {
    if (isReadOnly) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const holidayRef = doc(db, 'holidays', holiday.id);
      await updateDoc(holidayRef, { active: !holiday.active });
      setSuccessMsg(`Día festivo "${holiday.name}" ${!holiday.active ? 'activado' : 'desactivado'}.`);
    } catch (err) {
      setErrorMsg('No se pudo actualizar el estado del día festivo.');
      try {
        logFirestoreError(err, 'update', `holidays/${holiday.id}`, { label: 'Firestore Error in Holidays', throwError: true, includeAuth: false });
      } catch (e) {}
    }
  };

  // Handler to delete holiday (Admin only, permitted since it's not financial data)
  const handleDeleteHoliday = async (holidayId: string, holidayName: string) => {
    if (isReadOnly) return;
    if (!confirm(`¿Está seguro de eliminar permanentemente el día festivo "${holidayName}"?`)) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await deleteDoc(doc(db, 'holidays', holidayId));
      setSuccessMsg('Día festivo eliminado permanentemente.');
    } catch (err) {
      setErrorMsg('No se pudo eliminar el día festivo.');
      try {
        logFirestoreError(err, 'delete', `holidays/${holidayId}`, { label: 'Firestore Error in Holidays', throwError: true, includeAuth: false });
      } catch (e) {}
    }
  };

  // Group holidays by month
  const groupedHolidays = holidays.reduce((acc: Record<number, Holiday[]>, h) => {
    if (!acc[h.month]) {
      acc[h.month] = [];
    }
    acc[h.month].push(h);
    return acc;
  }, {});

  // Calculate the next 5 upcoming holidays dynamically starting from today
  const getUpcomingHolidays = (): { holiday: Holiday; nextDate: Date }[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const occurrences = holidays
      .filter(h => h.active)
      .map(h => {
        let occDate = new Date(today.getFullYear(), h.month - 1, h.day);
        if (occDate < today) {
          // If already passed this year, take next year's occurrence
          occDate = new Date(today.getFullYear() + 1, h.month - 1, h.day);
        }
        return { holiday: h, nextDate: occDate };
      });

    // Sort by next date ascending and take 5
    occurrences.sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());
    return occurrences.slice(0, 5);
  };

  const upcomingFive = getUpcomingHolidays();

  return (
    <div className="flex flex-col space-y-6 w-full max-w-[1550px] mx-auto animate-fadeIn px-2 sm:px-4">
      
      {/* Title block */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-purple-700" />
          <span>Configuración de Días Festivos</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Registre y configure los días feriados anuales. El sistema bloqueará automáticamente la generación de cobros e intereses en las fechas indicadas.
        </p>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-900 font-bold hover:underline">X</button>
        </div>
      )}

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-3.5 rounded text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-green-900 font-bold hover:underline">X</button>
        </div>
      )}

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns - Holidays List grouped by month */}
        <div className="lg:col-span-2 bg-white border border-gray-200 shadow-sm rounded-lg p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-purple-700" />
              <span>Calendario Anual de Festivos</span>
            </h2>
            <span className="text-xs text-gray-400 font-medium font-mono">
              Total: {holidays.length}
            </span>
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
                      {monthHolidays.map(holiday => (
                        <div 
                          key={holiday.id} 
                          className={`p-3 border rounded-lg flex items-center justify-between gap-3 transition-colors ${
                            holiday.active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 text-gray-400'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Day big badge */}
                            <div className={`w-10 h-10 rounded-md flex flex-col items-center justify-center font-mono select-none ${
                              holiday.active 
                                ? 'bg-purple-700 text-white font-bold' 
                                : 'bg-gray-200 text-gray-500 font-medium'
                            }`}>
                              <span className="text-xs leading-none">Día</span>
                              <span className="text-sm font-black leading-none mt-0.5">{String(holiday.day).padStart(2, '0')}</span>
                            </div>

                            <div>
                              <p className={`text-xs font-bold ${holiday.active ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                                {holiday.name}
                              </p>
                              <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                                Año: {holiday.year}
                              </p>
                            </div>
                          </div>

                          {/* Actions (Admin Only) */}
                          <div className="flex items-center gap-2">
                            {isAdmin ? (
                              <>
                                {/* Toggle Active Button */}
                                <button
                                  onClick={() => handleToggleActive(holiday)}
                                  className="text-gray-500 hover:text-purple-700 transition-colors cursor-pointer"
                                  title={holiday.active ? 'Desactivar Festivo' : 'Activar Festivo'}
                                >
                                  {holiday.active ? (
                                    <ToggleRight className="w-6 h-6 text-purple-600" />
                                  ) : (
                                    <ToggleLeft className="w-6 h-6 text-gray-400" />
                                  )}
                                </button>

                                {/* Delete Button */}
                                <button
                                  onClick={() => handleDeleteHoliday(holiday.id, holiday.name)}
                                  className="p-1.5 rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-150 transition-colors cursor-pointer"
                                  title="Eliminar permanentemente"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-wide uppercase ${
                                holiday.active ? 'bg-green-50 text-green-700 border border-green-150' : 'bg-gray-100 text-gray-500 border border-gray-200'
                              }`}>
                                {holiday.active ? 'Activo' : 'Inactivo'}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Right Columns - Next 5 upcoming & Admin addition Form */}
        <div className="space-y-6">
          
          {/* Upcoming 5 preview */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-purple-700" />
              <span>Próximos 5 Festivos</span>
            </h3>

            {listViewBody(
              loading,
              upcomingFive.length,
              (
              <div className="flex items-center justify-center py-6 text-xs text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Cargando...
              </div>
            ),
              (
              <div className="text-center py-6 text-gray-400 text-xs">
                No hay feriados activos próximos.
              </div>
            ),
              (
              <div className="space-y-2">
                {upcomingFive.map(({ holiday, nextDate }) => {
                  const daysLeft = Math.ceil((nextDate.getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={holiday.id} className="p-2.5 bg-purple-50/50 rounded border border-purple-100/50 flex items-center justify-between text-xs">
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
            ))}
          </div>

          {/* Admin Addition Form */}
          {isAdmin && (
            <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-5 space-y-4">
              <h3 className="text-xs font-black text-purple-800 uppercase tracking-wider border-b border-purple-100 pb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Agregar Nuevo Festivo</span>
              </h3>

              <form onSubmit={handleAddHoliday} className="space-y-4">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-600 mb-1">Nombre / Descripción *</label>
                  <input 
                    type="text" 
                    value={newHolidayName}
                    onChange={(e) => setNewHolidayName(e.target.value)}
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
                      onChange={(e) => setNewHolidayDay(Number(e.target.value))}
                      className="border border-gray-300 rounded p-2 text-sm text-gray-800 bg-white focus:outline-none focus:border-purple-600 cursor-pointer"
                      disabled={submitting}
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                        <option key={d} value={d}>{String(d).padStart(2, '0')}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-600 mb-1">Mes *</label>
                    <select 
                      value={newHolidayMonth}
                      onChange={(e) => setNewHolidayMonth(Number(e.target.value))}
                      className="border border-gray-300 rounded p-2 text-sm text-gray-800 bg-white focus:outline-none focus:border-purple-600 cursor-pointer"
                      disabled={submitting}
                    >
                      {MONTH_NAMES.map((name, i) => (
                        <option key={name} value={i + 1}>{name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-600 mb-1">Año de Referencia</label>
                  <input 
                    type="number" 
                    value={newHolidayYear}
                    onChange={(e) => setNewHolidayYear(Number(e.target.value))}
                    className="border border-gray-300 rounded p-2 text-sm text-gray-800 bg-white focus:outline-none focus:border-purple-600 font-mono"
                    disabled={submitting}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="new-holiday-active"
                    checked={newHolidayActive}
                    onChange={(e) => setNewHolidayActive(e.target.checked)}
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
