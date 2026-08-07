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
import { parseUnknownTimestamp } from '../utils/timestampParsing';

interface UseSalesListDataOptions {
  tenantId?: string;
  role: string;
  consultarPor: 'active' | 'inactive' | 'castigadas';
  verTodasUnidades: boolean;
  usuarioUnidades?: string[];
}

function buildSalesQuery(
  tenantId: string,
  role: string,
  consultarPor: string,
  verTodasUnidades: boolean,
  useOrderBy: boolean,
  usuarioUnidades: string[] = []
) {
  const baseRef = collection(db, 'sales');
  const queryStatus = consultarPor === 'active' ? 'active' : 'completed';
  const constraints = [where('tenantId', '==', tenantId), where('status', '==', queryStatus)];

  if (role === 'collector' && !verTodasUnidades) {
    const targetUserId = auth.currentUser?.uid || '';
    constraints.push(where('userId', '==', targetUserId));
  }

  // Unit security isolation: Force filter by usuarioUnidades
  if (usuarioUnidades && usuarioUnidades.length > 0) {
    if (usuarioUnidades.length === 1) {
      constraints.push(where('unitId', '==', usuarioUnidades[0]));
    } else {
      constraints.push(where('unitId', 'in', usuarioUnidades));
    }
  }

  return useOrderBy ? query(baseRef, ...constraints, orderBy('clientName', 'asc')) : query(baseRef, ...constraints);
}

export function useSalesListData({
  tenantId,
  role,
  consultarPor,
  verTodasUnidades,
  usuarioUnidades = [],
}: UseSalesListDataOptions) {
  const [sales, setSales] = useState<SalesListSale[]>([]);
  const [collections, setCollections] = useState<SalesListCollection[]>([]);
  const [loadingSales, setLoadingSales] = useState(true);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [cnOptions, setCnOptions] = useState<string[]>([]);
  const [unitOptions, setUnitOptions] = useState<string[]>([]);

  useEffect(() => {
    if (!tenantId) return;

    const boxConstraints = [where('tenantId', '==', tenantId)];
    if (usuarioUnidades && usuarioUnidades.length > 0) {
      if (usuarioUnidades.length === 1) {
        boxConstraints.push(where('unitId', '==', usuarioUnidades[0]));
      } else {
        boxConstraints.push(where('unitId', 'in', usuarioUnidades));
      }
    } else {
      boxConstraints.push(where('unitId', '==', 'none_assigned'));
    }

    const q = query(collection(db, 'boxes'), ...boxConstraints);
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
  }, [tenantId, usuarioUnidades]);

  useEffect(() => {
    if (!tenantId) return;

    setLoadingSales(true);
    let unsubscribe: (() => void) | null = null;

    const attach = (useOrderBy: boolean) =>
      onSnapshot(
        buildSalesQuery(tenantId, role, consultarPor, verTodasUnidades, useOrderBy, usuarioUnidades),
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
  }, [tenantId, role, consultarPor, verTodasUnidades, usuarioUnidades]);

  useEffect(() => {
    if (!tenantId) return;

    setLoadingCollections(true);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const collectionConstraints = [where('tenantId', '==', tenantId)];
    if (usuarioUnidades && usuarioUnidades.length > 0) {
      if (usuarioUnidades.length === 1) {
        collectionConstraints.push(where('unitId', '==', usuarioUnidades[0]));
      } else {
        collectionConstraints.push(where('unitId', 'in', usuarioUnidades));
      }
    }

    const q = query(collection(db, 'collections'), ...collectionConstraints);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: SalesListCollection[] = [];

        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const createdAtDate = parseUnknownTimestamp(data.createdAt);

          const isToday = createdAtDate ? createdAtDate.getTime() >= startOfToday.getTime() : true;
          const targetUserId = auth.currentUser?.uid || '';
          const matchesCollector =
            role !== 'collector' || verTodasUnidades || data.userId === targetUserId;

          if (isToday && matchesCollector) {
            loaded.push(mapSalesListCollection(docSnap.id, data));
          }
        });

        loaded.sort((a, b) => {
          const timeA = parseUnknownTimestamp(a.createdAt)?.getTime() || 0;
          const timeB = parseUnknownTimestamp(b.createdAt)?.getTime() || 0;
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
  }, [tenantId, role, verTodasUnidades, usuarioUnidades]);

  return {
    sales,
    collections,
    loadingSales,
    loadingCollections,
    cnOptions,
    unitOptions,
  };
}
