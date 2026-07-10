import { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { logFirestoreError } from '../utils/firestoreError';
import type { HtmlFormSubmitEvent } from '../types/reactEvents';
import type { Holiday } from '../types/holiday';
import { sortHolidaysByMonthDay } from '../utils/holidayAggregates';

function mapHolidayDoc(docSnap: { id: string; data: () => Record<string, unknown> }): Holiday {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: String(data.name || 'Feriado'),
    day: Number(data.day || 1),
    month: Number(data.month || 1),
    year: Number(data.year || new Date().getFullYear()),
    active: data.active !== undefined ? Boolean(data.active) : true,
    tenantId: String(data.tenantId || ''),
  };
}

export function useHolidaysData(tenantId?: string, isReadOnly = true) {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayDay, setNewHolidayDay] = useState(1);
  const [newHolidayMonth, setNewHolidayMonth] = useState(1);
  const [newHolidayYear, setNewHolidayYear] = useState(new Date().getFullYear());
  const [newHolidayActive, setNewHolidayActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!tenantId) return;

    setLoading(true);
    const holidaysQuery = query(collection(db, 'holidays'), where('tenantId', '==', tenantId));

    const unsubscribe = onSnapshot(
      holidaysQuery,
      (snapshot) => {
        setHolidays(sortHolidaysByMonthDay(snapshot.docs.map(mapHolidayDoc)));
        setLoading(false);
      },
      (error) => {
        setErrorMsg('Error al conectar con la lista de días festivos.');
        try {
          logFirestoreError(error, 'list', 'holidays', {
            label: 'Firestore Error in Holidays',
            throwError: true,
            includeAuth: false,
          });
        } catch {
          /* logged */
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tenantId]);

  const handleAddHoliday = async (e: HtmlFormSubmitEvent) => {
    e.preventDefault();
    if (isReadOnly || !tenantId) return;

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
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'holidays'), payload);
      setSuccessMsg(`Día festivo "${payload.name}" agregado con éxito.`);
      setNewHolidayName('');
      setNewHolidayDay(1);
      setNewHolidayMonth(1);
    } catch (err) {
      setErrorMsg('No se pudo guardar el día festivo.');
      try {
        logFirestoreError(err, 'create', 'holidays', {
          label: 'Firestore Error in Holidays',
          throwError: true,
          includeAuth: false,
        });
      } catch {
        /* logged */
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (holiday: Holiday) => {
    if (isReadOnly) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await updateDoc(doc(db, 'holidays', holiday.id), { active: !holiday.active });
      setSuccessMsg(`Día festivo "${holiday.name}" ${!holiday.active ? 'activado' : 'desactivado'}.`);
    } catch (err) {
      setErrorMsg('No se pudo actualizar el estado del día festivo.');
      try {
        logFirestoreError(err, 'update', `holidays/${holiday.id}`, {
          label: 'Firestore Error in Holidays',
          throwError: true,
          includeAuth: false,
        });
      } catch {
        /* logged */
      }
    }
  };

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
        logFirestoreError(err, 'delete', `holidays/${holidayId}`, {
          label: 'Firestore Error in Holidays',
          throwError: true,
          includeAuth: false,
        });
      } catch {
        /* logged */
      }
    }
  };

  return {
    holidays,
    loading,
    errorMsg,
    setErrorMsg,
    successMsg,
    setSuccessMsg,
    newHolidayName,
    setNewHolidayName,
    newHolidayDay,
    setNewHolidayDay,
    newHolidayMonth,
    setNewHolidayMonth,
    newHolidayYear,
    setNewHolidayYear,
    newHolidayActive,
    setNewHolidayActive,
    submitting,
    handleAddHoliday,
    handleToggleActive,
    handleDeleteHoliday,
  };
}
