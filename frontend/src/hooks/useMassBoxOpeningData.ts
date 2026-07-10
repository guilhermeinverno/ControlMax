import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, Timestamp, where } from 'firebase/firestore';
import { getErrorMessage } from '../utils/errorMessage';

export interface MassBoxOpeningUser {
  id: string;
  tenantId: string;
  userName: string;
  role: 'admin' | 'supervisor' | 'collector';
  email: string;
  active: boolean;
  defaultUnitId?: string;
  defaultUnitName?: string;
  defaultCnId?: string;
  defaultCnName?: string;
}

export interface MassBoxOpeningBox {
  id: string;
  tenantId: string;
  unitId: string;
  unitName: string;
  cnId: string;
  cnName: string;
  userId: string;
  userName: string;
  status: 'open' | 'closed' | 'confirmed';
  openedAt: Timestamp;
  initialAmount: number;
  totalIncomes: number;
  totalExpenses: number;
  totalSales: number;
  totalCollections: number;
  totalTransfers: number;
  finalAmount: number;
}

export function useMassBoxOpeningData(tenantId?: string) {
  const [collectors, setCollectors] = useState<MassBoxOpeningUser[]>([]);
  const [activeBoxes, setActiveBoxes] = useState<MassBoxOpeningBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;

    setLoading(true);
    setLoadError(null);

    let active = true;
    let unsubUsers: (() => void) | null = null;
    let unsubBoxes: (() => void) | null = null;

    const startUsersListener = () => {
      const q = query(
        collection(db, 'users'),
        where('tenantId', '==', tenantId),
        where('role', '==', 'collector'),
        where('active', '==', true)
      );

      try {
        unsubUsers = onSnapshot(
          q,
          (snapshot) => {
            const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as unknown as MassBoxOpeningUser);
            if (!active) return;
            setCollectors(list);
            setLoading(false);
          },
          (err) => {
            console.error('Users onSnapshot failed:', err);
            if (!active) return;
            setLoadError(getErrorMessage(err) || 'Error al cargar cobradores');
            setLoading(false);
          }
        );
      } catch (err) {
        console.error('Error starting users snapshot listener:', err);
        if (active) setLoading(false);
      }
    };

    const startBoxesListener = () => {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const q = query(
        collection(db, 'boxes'),
        where('tenantId', '==', tenantId),
        where('status', '==', 'open'),
        where('openedAt', '>=', Timestamp.fromDate(startOfToday))
      );

      try {
        unsubBoxes = onSnapshot(
          q,
          (snapshot) => {
            const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as unknown as MassBoxOpeningBox);
            if (active) setActiveBoxes(list);
          },
          (err) => {
            console.warn(
              'MassBoxOpening active boxes primary onSnapshot failed (possibly index missing), trying fallback:',
              err
            );

            const fallbackQ = query(
              collection(db, 'boxes'),
              where('tenantId', '==', tenantId),
              where('status', '==', 'open')
            );

            unsubBoxes = onSnapshot(
              fallbackQ,
              (snapshot) => {
                const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as unknown as MassBoxOpeningBox);
                const filtered = list.filter((box) => {
                  if (!box.openedAt) return false;
                  const date =
                    typeof box.openedAt.toDate === 'function'
                      ? box.openedAt.toDate()
                      : new Date((box.openedAt as unknown as { seconds: number }).seconds * 1000);
                  return date >= startOfToday;
                });
                if (active) setActiveBoxes(filtered);
              },
              (fallbackErr) => {
                console.error('MassBoxOpening fallback onSnapshot failed:', fallbackErr);
              }
            );
          }
        );
      } catch (err) {
        console.error('Error setting up active boxes listener:', err);
      }
    };

    startUsersListener();
    startBoxesListener();

    return () => {
      active = false;
      if (unsubUsers) unsubUsers();
      if (unsubBoxes) unsubBoxes();
    };
  }, [tenantId]);

  return {
    collectors,
    activeBoxes,
    loading,
    loadError,
  };
}
