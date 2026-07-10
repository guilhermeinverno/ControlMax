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

export function useDashboardBoxes(tenantId?: string) {
  const [boxes, setBoxes] = useState<DashboardBoxRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);

    const boxesRef = collection(db, 'boxes');
    const q = query(boxesRef, where('tenantId', '==', tenantId), orderBy('openedAt', 'desc'), limit(30));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setBoxes(mapSnapshotToBoxes(snapshot.docs));
        setLoading(false);
      },
      (err) => {
        console.warn('Boxes query with orderBy failed, using fallback query without orderBy:', err);

        const fallbackQuery = query(boxesRef, where('tenantId', '==', tenantId));
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
  }, [tenantId]);

  return { boxes, loading, error };
}
