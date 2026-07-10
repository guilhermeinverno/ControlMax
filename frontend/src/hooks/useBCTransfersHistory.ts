import { useEffect, useRef, useState } from 'react';
import { collection, onSnapshot, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toJsDate } from '../utils/firestoreTimestamp';

export interface BCTransfer {
  id: string;
  tenantId: string;
  fromType: 'collector' | 'cn';
  fromId: string;
  fromName: string;
  toCnId: string;
  toCnName: string;
  amount: number;
  description: string;
  status: 'pending' | 'confirmed' | 'rejected';
  confirmedBy?: string;
  confirmedAt?: unknown;
  boxId?: string;
  createdAt?: unknown;
}

export function useBCTransfersHistory(tenantId?: string, selectedDate?: string) {
  const [transfers, setTransfers] = useState<BCTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!tenantId || !selectedDate) return;

    setLoading(true);
    setError(null);

    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const qWithOrder = query(
      collection(db, 'bc_transfers'),
      where('tenantId', '==', tenantId),
      where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
      where('createdAt', '<=', Timestamp.fromDate(endOfDay)),
      orderBy('createdAt', 'desc')
    );

    try {
      unsubRef.current = onSnapshot(
        qWithOrder,
        (snapshot) => {
          const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as BCTransfer[];
          setTransfers(list);
          setLoading(false);
        },
        (err) => {
          console.warn('Index build required for transfers, trying query without orderBy:', err);

          const qNoOrder = query(
            collection(db, 'bc_transfers'),
            where('tenantId', '==', tenantId),
            where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
            where('createdAt', '<=', Timestamp.fromDate(endOfDay))
          );

          unsubRef.current = onSnapshot(
            qNoOrder,
            (snapshot) => {
              const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as BCTransfer[];
              list.sort((a, b) => {
                const timeA = (a.createdAt as { seconds?: number } | undefined)?.seconds || 0;
                const timeB = (b.createdAt as { seconds?: number } | undefined)?.seconds || 0;
                return timeB - timeA;
              });
              setTransfers(list);
              setLoading(false);
            },
            (fallbackErr) => {
              console.warn('Date index failing for transfers, fallback to general tenant query:', fallbackErr);

              const qTenantOnly = query(collection(db, 'bc_transfers'), where('tenantId', '==', tenantId));

              unsubRef.current = onSnapshot(
                qTenantOnly,
                (snapshot) => {
                  const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as BCTransfer[];
                  const filteredList = list.filter((item) => {
                    if (!item.createdAt) return false;
                    const date = toJsDate(item.createdAt as never);
                    return date >= startOfDay && date <= endOfDay;
                  });

                  filteredList.sort((a, b) => {
                    const timeA = (a.createdAt as { seconds?: number } | undefined)?.seconds || 0;
                    const timeB = (b.createdAt as { seconds?: number } | undefined)?.seconds || 0;
                    return timeB - timeA;
                  });

                  setTransfers(filteredList);
                  setLoading(false);
                },
                (errFinal) => {
                  console.error('Critical: BCTransfers fetch failed:', errFinal);
                  setError('Erro ao carregar os dados de transferências.');
                  setLoading(false);
                }
              );
            }
          );
        }
      );
    } catch (err) {
      console.error('Immediate error setting up bc_transfers snapshot:', err);
      setLoading(false);
    }

    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, [tenantId, selectedDate]);

  return {
    transfers,
    loading,
    error,
  };
}
