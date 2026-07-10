import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, limit, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { logFirestoreError } from '../utils/firestoreError';
import { Box } from '../types';

function mapBoxDoc(docSnap: { id: string; data: () => Record<string, unknown> }): Box {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    tenantId: String(data.tenantId || ''),
    unitId: String(data.unitId || ''),
    unitName: String(data.unitName || ''),
    cnId: String(data.cnId || ''),
    cnName: String(data.cnName || ''),
    userId: String(data.userId || ''),
    userName: String(data.userName || ''),
    status: data.status as Box['status'],
    openedAt: data.openedAt as Box['openedAt'],
    closedAt: data.closedAt as Box['closedAt'],
    confirmedAt: data.confirmedAt as Box['confirmedAt'],
    confirmedBy: data.confirmedBy as string | undefined,
    initialAmount: Number(data.initialAmount || 0),
    observation: String(data.observation || ''),
    totalIncomes: Number(data.totalIncomes || 0),
    totalExpenses: Number(data.totalExpenses || 0),
    totalSales: Number(data.totalSales || 0),
    totalCollections: Number(data.totalCollections || 0),
    totalTransfers: Number(data.totalTransfers || 0),
    finalAmount: Number(data.finalAmount || 0),
  };
}

export function useActiveBoxSubscription(tenantId?: string, refreshKey = 0) {
  const [activeBox, setActiveBox] = useState<Box | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeSnap: (() => void) | null = null;

    const handleBoxSync = (userId: string) => {
      if (!tenantId) return;
      setLoading(true);
      setError(null);

      if (unsubscribeSnap) {
        unsubscribeSnap();
        unsubscribeSnap = null;
      }

      const q = query(
        collection(db, 'boxes'),
        where('tenantId', '==', tenantId),
        where('userId', '==', userId),
        where('status', '==', 'open'),
        limit(1)
      );

      unsubscribeSnap = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            setActiveBox(mapBoxDoc(snapshot.docs[0]));
          } else {
            setActiveBox(null);
          }
          setLoading(false);
        },
        (err) => {
          setLoading(false);
          setError(err.message);
          try {
            logFirestoreError(err, 'list', 'boxes', { throwError: true });
          } catch {
            /* logged */
          }
        }
      );
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user || !tenantId) {
        if (unsubscribeSnap) {
          unsubscribeSnap();
          unsubscribeSnap = null;
        }
        setActiveBox(null);
        setLoading(false);
        return;
      }
      handleBoxSync(user.uid);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnap) unsubscribeSnap();
    };
  }, [tenantId, refreshKey]);

  return { activeBox, loading, error, setError, setLoading };
}
