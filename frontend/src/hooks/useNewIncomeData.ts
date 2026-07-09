import { useCallback, useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BusinessCenter } from '../types/company';
import { OpenBoxOption, SaleOption } from '../types/operational';
import {
  findUnitInCenter,
  mapBusinessCenterDoc,
  pickUnitInCenter,
  resolveDefaultCnUnitSelection,
} from '../utils/businessCenterSelection';

export interface FirestoreIncome {
  id: string;
  tenantId: string;
  boxId: string;
  boxName: string;
  cnId: string;
  cnName: string;
  type: string;
  incomeType?: string;
  amount: number;
  comment: string;
  description: string;
  registeredBy: string;
  createdAt?: unknown;
  attachmentName?: string;
  attachmentUrl?: string;
}

function mapIncomeDoc(id: string, data: Record<string, unknown>): FirestoreIncome {
  return {
    id,
    tenantId: data.tenantId as string,
    boxId: data.boxId as string,
    boxName: data.boxName as string,
    cnId: data.cnId as string,
    cnName: data.cnName as string,
    type: (data.type as string) || 'income',
    incomeType: (data.incomeType as string) || '',
    amount: (data.amount as number) || 0,
    comment: (data.comment as string) || '',
    description: (data.description as string) || '',
    registeredBy: (data.registeredBy as string) || (data.userName as string) || 'Usuario',
    createdAt: data.createdAt,
    attachmentName: (data.attachmentName as string) || '',
    attachmentUrl: (data.attachmentUrl as string) || '',
  };
}

function mapSaleDoc(id: string, data: Record<string, unknown>): SaleOption {
  return {
    id,
    clientName: (data.clientName as string) || 'Cliente sin nombre',
    ...data,
  };
}

interface UseNewIncomeDataOptions {
  tenantId?: string;
  activeBox?: OpenBoxOption | null;
}

export function useNewIncomeData({ tenantId, activeBox }: UseNewIncomeDataOptions) {
  const [centers, setCenters] = useState<BusinessCenter[]>([]);
  const [selectedCnId, setSelectedCnId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [selectedUnitName, setSelectedUnitName] = useState('');
  const [openBoxes, setOpenBoxes] = useState<OpenBoxOption[]>([]);
  const [incomes, setIncomes] = useState<FirestoreIncome[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [salesList, setSalesList] = useState<SaleOption[]>([]);

  useEffect(() => {
    if (!tenantId) return undefined;

    const q = query(collection(db, 'business_centers'), where('tenantId', '==', tenantId));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs
          .map((docSnap) => mapBusinessCenterDoc(docSnap.id, docSnap.data()))
          .filter((center): center is BusinessCenter => center != null);

        setCenters(list);

        const selection = resolveDefaultCnUnitSelection(list, activeBox ?? undefined);
        if (selection) {
          setSelectedCnId(selection.cnId);
          setSelectedUnitId(selection.unitId);
          setSelectedUnitName(selection.unitName);
        }
      },
      (error) => console.error('Error loading business centers:', error),
    );

    return () => unsubscribe();
  }, [tenantId, activeBox]);

  useEffect(() => {
    if (!tenantId) return undefined;

    const q = query(
      collection(db, 'boxes'),
      where('tenantId', '==', tenantId),
      where('status', '==', 'open'),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setOpenBoxes(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
      },
      (error) => console.error('Error loading open boxes:', error),
    );

    return () => unsubscribe();
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId) return undefined;

    const q = query(
      collection(db, 'incomes'),
      where('tenantId', '==', tenantId),
      orderBy('createdAt', 'desc'),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setIncomes(snapshot.docs.map((docSnap) => mapIncomeDoc(docSnap.id, docSnap.data())));
        setLoadingHistory(false);
      },
      (error) => {
        console.error('Error loading incomes:', error);
        setLoadingHistory(false);
      },
    );

    return () => unsubscribe();
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId) return undefined;

    const q = query(
      collection(db, 'sales'),
      where('tenantId', '==', tenantId),
      where('status', '==', 'active'),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded = snapshot.docs.map((docSnap) => mapSaleDoc(docSnap.id, docSnap.data()));
        loaded.sort((a, b) => (a.clientName ?? '').localeCompare(b.clientName ?? ''));
        setSalesList(loaded);
      },
      (error) => console.error('Error loading sales for NewIncome:', error),
    );

    return () => unsubscribe();
  }, [tenantId]);

  const handleCnChange = useCallback((cnId: string) => {
    const cn = centers.find((center) => center.id === cnId);
    if (!cn) return;

    const selection = pickUnitInCenter(cn);
    setSelectedCnId(selection.cnId);
    setSelectedUnitId(selection.unitId);
    setSelectedUnitName(selection.unitName);
  }, [centers]);

  const handleUnitChange = useCallback((unitId: string) => {
    const selection = findUnitInCenter(centers, selectedCnId, unitId);
    if (!selection) return;

    setSelectedUnitId(selection.unitId);
    setSelectedUnitName(selection.unitName);
  }, [centers, selectedCnId]);

  const currentSelectedBox = openBoxes.find(
    (box) =>
      box.cnId === selectedCnId &&
      (box.unitId === selectedUnitId || box.unitName === selectedUnitName),
  );

  return {
    centers,
    selectedCnId,
    selectedUnitId,
    selectedUnitName,
    openBoxes,
    incomes,
    loadingHistory,
    salesList,
    handleCnChange,
    handleUnitChange,
    currentSelectedBox,
  };
}
