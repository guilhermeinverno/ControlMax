import { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { logFirestoreError } from '../utils/firestoreError';
import {
  mapSalesListCollection,
  mapSalesListSale,
  SalesListCollection,
  SalesListSale,
} from '../utils/salesListMapper';

interface UseSalesListDataOptions {
  tenantId?: string;
  role: string;
  consultarPor: 'active' | 'inactive' | 'castigadas';
  verTodasUnidades: boolean;
}

function buildSalesQuery(
  tenantId: string,
  role: string,
  consultarPor: string,
  verTodasUnidades: boolean,
  useOrderBy: boolean
) {
  const baseRef = collection(db, 'sales');
  const queryStatus = consultarPor === 'active' ? 'active' : 'completed';
  const constraints = [where('tenantId', '==', tenantId), where('status', '==', queryStatus)];

  if (role === 'collector' && !verTodasUnidades) {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('controlmax_demo_active') === 'true';
    const targetUserId = isDemo ? (auth.currentUser?.uid || 'col_1') : (auth.currentUser?.uid || '');
    constraints.push(where('userId', '==', targetUserId));
  }

  return useOrderBy ? query(baseRef, ...constraints, orderBy('clientName', 'asc')) : query(baseRef, ...constraints);
}

export function useSalesListData({
  tenantId,
  role,
  consultarPor,
  verTodasUnidades,
}: UseSalesListDataOptions) {
  const [sales, setSales] = useState<SalesListSale[]>([]);
  const [collections, setCollections] = useState<SalesListCollection[]>([]);
  const [loadingSales, setLoadingSales] = useState(true);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [cnOptions, setCnOptions] = useState<string[]>([]);
  const [unitOptions, setUnitOptions] = useState<string[]>([]);

  useEffect(() => {
    if (!tenantId) return;

    const q = query(collection(db, 'boxes'), where('tenantId', '==', tenantId));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const cns = new Set<string>();
        const units = new Set<string>();
        snap.docs.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.cnName) cns.add(String(data.cnName));
          if (data.unitName) units.add(String(data.unitName));
        });
        setCnOptions(Array.from(cns));
        setUnitOptions(Array.from(units));
      },
      (error) => {
        logFirestoreError(error, 'list', 'boxes', {
          throwError: true,
          extraAuth: { userId: auth.currentUser?.uid || 'system_user' },
        });
      }
    );

    return () => unsubscribe();
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId) return;

    setLoadingSales(true);
    let unsubscribe: (() => void) | null = null;

    const attach = (useOrderBy: boolean) =>
      onSnapshot(
        buildSalesQuery(tenantId, role, consultarPor, verTodasUnidades, useOrderBy),
        (snapshot) => {
          const loaded = snapshot.docs.map((docSnap) =>
            mapSalesListSale(docSnap.id, docSnap.data())
          );
          if (!useOrderBy) {
            loaded.sort((a, b) => a.clientName.localeCompare(b.clientName, 'pt-BR'));
          }
          setSales(loaded);
          setLoadingSales(false);
        },
        (error) => {
          console.warn('Sales query error, fallback to no orderBy:', error);
          if (useOrderBy) {
            unsubscribe = attach(false);
          } else {
            setLoadingSales(false);
          }
        }
      );

    unsubscribe = attach(true);
    return () => unsubscribe?.();
  }, [tenantId, role, consultarPor, verTodasUnidades]);

  useEffect(() => {
    if (!tenantId) return;

    setLoadingCollections(true);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const q = query(collection(db, 'collections'), where('tenantId', '==', tenantId));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: SalesListCollection[] = [];

        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const isDemo = typeof window !== 'undefined' && localStorage.getItem('controlmax_demo_active') === 'true';
          const createdAtDate = data.createdAt?.toDate() || null;
          const isToday = isDemo ? true : (createdAtDate ? createdAtDate.getTime() >= startOfToday.getTime() : true);
          const targetUserId = isDemo ? (auth.currentUser?.uid || 'col_1') : (auth.currentUser?.uid || '');
          const matchesCollector =
            role !== 'collector' || verTodasUnidades || data.userId === targetUserId;

          if (isToday && matchesCollector) {
            loaded.push(mapSalesListCollection(docSnap.id, data));
          }
        });

        loaded.sort((a, b) => {
          const timeA = a.createdAt?.toDate()?.getTime() || 0;
          const timeB = b.createdAt?.toDate()?.getTime() || 0;
          return timeB - timeA;
        });

        setCollections(loaded);
        setLoadingCollections(false);
      },
      (error) => {
        console.error('Collections onSnapshot error:', error);
        setLoadingCollections(false);
      }
    );

    return () => unsubscribe();
  }, [tenantId, role, verTodasUnidades]);

  return {
    sales,
    collections,
    loadingSales,
    loadingCollections,
    cnOptions,
    unitOptions,
  };
}
