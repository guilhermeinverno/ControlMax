import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BusinessCenter } from '../types/company';
import { OpenBoxOption } from '../types/operational';
import { mapBusinessCenterDoc } from '../utils/businessCenterSelection';

export interface FirestoreExpense {
  id: string;
  tenantId: string;
  boxId?: string;
  boxName?: string;
  cnId: string;
  cnName: string;
  type: string;
  expenseType?: string;
  amount: number;
  comment: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: string;
  requestedById: string;
  createdAt?: unknown;
  attachmentName?: string;
  attachmentUrl?: string;
}

function mapBoxExpenseDoc(id: string, data: Record<string, unknown>): FirestoreExpense {
  return {
    id,
    tenantId: data.tenantId as string,
    boxId: data.boxId as string | undefined,
    boxName: data.boxName as string | undefined,
    cnId: data.cnId as string,
    cnName: data.cnName as string,
    type: 'Gasto Caja',
    expenseType: (data.expenseType as string) || '',
    amount: (data.amount as number) || 0,
    comment: (data.comment as string) || '',
    description: (data.description as string) || '',
    status: (data.status as FirestoreExpense['status']) || 'approved',
    requestedBy: (data.requestedBy as string) || (data.userName as string) || 'Usuario',
    requestedById: (data.requestedById as string) || (data.userId as string) || '',
    createdAt: data.createdAt,
    attachmentName: (data.attachmentName as string) || '',
    attachmentUrl: (data.attachmentUrl as string) || '',
  };
}

function mapBcExpenseDoc(id: string, data: Record<string, unknown>): FirestoreExpense {
  return {
    id,
    tenantId: data.tenantId as string,
    cnId: data.cnId as string,
    cnName: data.cnName as string,
    type: 'Retiro CN',
    expenseType: (data.expenseType as string) || (data.category as string) || '',
    amount: (data.amount as number) || 0,
    comment: (data.comment as string) || (data.description as string) || '',
    description: (data.description as string) || '',
    status: (data.status as FirestoreExpense['status']) || 'approved',
    requestedBy: (data.userName as string) || 'Usuario',
    requestedById: (data.userId as string) || '',
    createdAt: data.createdAt,
    attachmentName: (data.attachmentName as string) || '',
    attachmentUrl: (data.attachmentUrl as string) || '',
  };
}

function resolveDefaultCn(centers: BusinessCenter[], activeBox?: OpenBoxOption | null) {
  if (activeBox?.cnId) {
    const match = centers.find((center) => center.id === activeBox.cnId);
    if (match) return { cnId: match.id, cnName: match.name };
  }

  if (centers.length > 0) {
    return { cnId: centers[0].id, cnName: centers[0].name };
  }

  return { cnId: '', cnName: '' };
}

function pickBoxForCn(openBoxes: OpenBoxOption[], cnId: string) {
  const matchingBox = openBoxes.find((box) => box.cnId === cnId);
  if (!matchingBox) {
    return { boxId: '', boxName: '' };
  }

  return {
    boxId: matchingBox.id,
    boxName: matchingBox.userName || 'Caja',
  };
}

function expenseTimestamp(expense: FirestoreExpense): number {
  const createdAt = expense.createdAt as { seconds?: number } | undefined;
  return createdAt?.seconds ?? 0;
}

interface UseNewExpenseDataOptions {
  tenantId?: string;
  activeBox?: OpenBoxOption | null;
}

export function useNewExpenseData({ tenantId, activeBox }: UseNewExpenseDataOptions) {
  const [centers, setCenters] = useState<BusinessCenter[]>([]);
  const [selectedCnId, setSelectedCnId] = useState('');
  const [selectedCnName, setSelectedCnName] = useState('');
  const [selectedBoxId, setSelectedBoxId] = useState('');
  const [selectedBoxName, setSelectedBoxName] = useState('');
  const [openBoxes, setOpenBoxes] = useState<OpenBoxOption[]>([]);
  const [boxExpenses, setBoxExpenses] = useState<FirestoreExpense[]>([]);
  const [bcExpenses, setBcExpenses] = useState<FirestoreExpense[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

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

        const defaults = resolveDefaultCn(list, activeBox ?? undefined);
        setSelectedCnId(defaults.cnId);
        setSelectedCnName(defaults.cnName);
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
        const loaded = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            cnId: data.cnId || '',
            userName: data.userName || '',
            unitName: data.unitName || '',
            status: data.status || 'open',
          };
        });
        setOpenBoxes(loaded);
      },
      (error) => console.error('Error loading open boxes:', error),
    );

    return () => unsubscribe();
  }, [tenantId]);

  useEffect(() => {
    if (!selectedCnId) return;

    const selection = pickBoxForCn(openBoxes, selectedCnId);
    setSelectedBoxId(selection.boxId);
    setSelectedBoxName(selection.boxName);
  }, [openBoxes, selectedCnId]);

  useEffect(() => {
    if (!tenantId) return undefined;

    const q = query(
      collection(db, 'expenses'),
      where('tenantId', '==', tenantId),
      orderBy('createdAt', 'desc'),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setBoxExpenses(snapshot.docs.map((docSnap) => mapBoxExpenseDoc(docSnap.id, docSnap.data())));
      },
      (error) => console.error('Error loading box expenses:', error),
    );

    return () => unsubscribe();
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId) return undefined;

    const q = query(
      collection(db, 'bc_expenses'),
      where('tenantId', '==', tenantId),
      orderBy('createdAt', 'desc'),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setBcExpenses(snapshot.docs.map((docSnap) => mapBcExpenseDoc(docSnap.id, docSnap.data())));
        setLoadingHistory(false);
      },
      (error) => {
        console.error('Error loading bc_expenses:', error);
        setLoadingHistory(false);
      },
    );

    return () => unsubscribe();
  }, [tenantId]);

  const handleCnChange = useCallback(
    (cnId: string) => {
      const cn = centers.find((center) => center.id === cnId);
      if (!cn) return;

      setSelectedCnId(cn.id);
      setSelectedCnName(cn.name);

      const selection = pickBoxForCn(openBoxes, cn.id);
      setSelectedBoxId(selection.boxId);
      setSelectedBoxName(selection.boxName);
    },
    [centers, openBoxes],
  );

  const handleBoxChange = useCallback(
    (boxId: string) => {
      setSelectedBoxId(boxId);
      const box = openBoxes.find((item) => item.id === boxId);
      setSelectedBoxName(box?.userName || 'Caja');
    },
    [openBoxes],
  );

  const unifiedHistory = useMemo(
    () => [...boxExpenses, ...bcExpenses].sort((a, b) => expenseTimestamp(b) - expenseTimestamp(a)),
    [boxExpenses, bcExpenses],
  );

  const cnOpenBoxes = useMemo(
    () => openBoxes.filter((box) => box.cnId === selectedCnId),
    [openBoxes, selectedCnId],
  );

  return {
    centers,
    selectedCnId,
    selectedCnName,
    selectedBoxId,
    selectedBoxName,
    openBoxes,
    cnOpenBoxes,
    unifiedHistory,
    loadingHistory,
    handleCnChange,
    handleBoxChange,
  };
}
