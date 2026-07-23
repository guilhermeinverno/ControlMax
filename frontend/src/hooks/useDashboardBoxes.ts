import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { mapBoxRecord, sortBoxesByOpenedAtDesc } from '../utils/boxRecordMapper';
import type { DashboardBoxRecord } from '../types/dashboardBox';

function mapSnapshotToBoxes(docs: { id: string; data: () => Record<string, unknown> }[]): DashboardBoxRecord[] {
  return docs.map((docSnap) => {
    const mapped = mapBoxRecord(docSnap);
    return {
      ...mapped,
      status: mapped.status as DashboardBoxRecord['status'],
    };
  });
}

export function useDashboardBoxes(tenantId?: string, usuarioUnidades?: string[]) {
  const [boxes, setBoxes] = useState<DashboardBoxRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);

    const boxesRef = collection(db, 'boxes');
    const constraints = [where('tenantId', '==', tenantId)];

    if (usuarioUnidades && usuarioUnidades.length > 0) {
      if (usuarioUnidades.length === 1) {
        constraints.push(where('unitId', '==', usuarioUnidades[0]));
      } else {
        constraints.push(where('unitId', 'in', usuarioUnidades));
      }
    } else {
      constraints.push(where('unitId', '==', 'none_assigned'));
    }

    const q = query(boxesRef, ...constraints, orderBy('openedAt', 'desc'), limit(30));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setBoxes(mapSnapshotToBoxes(snapshot.docs));
        setLoading(false);
      },
      (err) => {
        console.warn('Boxes query with orderBy failed, using fallback query without orderBy:', err);

        const fallbackQuery = query(boxesRef, ...constraints);
        const unsubFallback = onSnapshot(
          fallbackQuery,
          (snapshot) => {
            setBoxes(sortBoxesByOpenedAtDesc(mapSnapshotToBoxes(snapshot.docs)) as DashboardBoxRecord[]);
            setLoading(false);
          },
          (fallbackErr) => {
            console.error('Fallback query failed:', fallbackErr);
            setError(fallbackErr.message);
            setLoading(false);
          }
        );

        return () => unsubFallback();
      }
    );

    return () => unsubscribe();
  }, [tenantId, usuarioUnidades]);

  return { boxes, loading, error };
}
