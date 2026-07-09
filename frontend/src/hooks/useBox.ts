import { getErrorMessage } from '../utils/errorMessage';
import { logFirestoreError } from '../utils/firestoreError';
import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  query, 
  where, 
  limit, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  serverTimestamp, 
  getDocs,
  runTransaction 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Box } from '../types';
import { useTenant } from './useTenant';

interface OpenBoxParams {
  unitId: string;
  unitName: string;
  cnId: string;
  cnName: string;
  initialAmount: number;
  observation?: string;
}

export function useBox() {
  const { tenantId, role, userName, loading: tenantLoading } = useTenant();
  const [activeBox, setActiveBox] = useState<Box | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const refreshBox = () => {
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    if (tenantLoading) {
      return;
    }

    let unsubscribeSnap: (() => void) | null = null;

    const handleBoxSync = (userId: string) => {
      setLoading(true);
      setError(null);

      if (unsubscribeSnap) {
        unsubscribeSnap();
        unsubscribeSnap = null;
      }

      const boxesRef = collection(db, 'boxes');
      const q = query(
        boxesRef,
        where('tenantId', '==', tenantId),
        where('userId', '==', userId),
        where('status', '==', 'open'),
        limit(1)
      );

      unsubscribeSnap = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          const data = docSnap.data();
          const box: Box = {
            id: docSnap.id,
            tenantId: data.tenantId,
            unitId: data.unitId,
            unitName: data.unitName,
            cnId: data.cnId,
            cnName: data.cnName,
            userId: data.userId,
            userName: data.userName,
            status: data.status,
            openedAt: data.openedAt,
            closedAt: data.closedAt,
            confirmedAt: data.confirmedAt,
            confirmedBy: data.confirmedBy,
            initialAmount: data.initialAmount,
            observation: data.observation,
            totalIncomes: data.totalIncomes,
            totalExpenses: data.totalExpenses,
            totalSales: data.totalSales,
            totalCollections: data.totalCollections,
            totalTransfers: data.totalTransfers,
            finalAmount: data.finalAmount,
          };
          setActiveBox(box);
        } else {
          setActiveBox(null);
        }
        setLoading(false);
      }, (err) => {
        setLoading(false);
        setError(err.message);
        try {
          logFirestoreError(err, 'list', 'boxes', { throwError: true });
        } catch (e) {
          // Exception logged and passed through
        }
      });
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
      if (unsubscribeSnap) {
        unsubscribeSnap();
      }
    };
  }, [tenantLoading, tenantId, refreshKey]);

  const openBox = async (params: OpenBoxParams): Promise<void> => {
    const userId = auth?.currentUser?.uid;
    if (!userId || !tenantId) {
      throw new Error('Usuario no autenticado o inquilino no configurado.');
    }

    setLoading(true);
    setError(null);

    const pathForBoxes = 'boxes';
    try {
      // 1. Check if user already has an active open box
      const boxesRef = collection(db, 'boxes');
      const activeCheckQuery = query(
        boxesRef,
        where('tenantId', '==', tenantId),
        where('userId', '==', userId),
        where('status', '==', 'open'),
        limit(1)
      );

      const checkSnap = await getDocs(activeCheckQuery);
      if (!checkSnap.empty) {
        throw new Error('El usuario ya tiene una caja abierta.');
      }

      // 2. Open new box
      const newBoxData = {
        tenantId,
        unitId: params.unitId,
        unitName: params.unitName,
        cnId: params.cnId,
        cnName: params.cnName,
        userId,
        userName: userName || auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Cobrador',
        status: 'open' as const,
        openedAt: serverTimestamp(),
        initialAmount: Math.round(params.initialAmount),
        observation: params.observation || '',
        totalIncomes: 0,
        totalExpenses: 0,
        totalSales: 0,
        totalCollections: 0,
        totalTransfers: 0,
        finalAmount: Math.round(params.initialAmount),
      };

      await addDoc(collection(db, pathForBoxes), newBoxData);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      const msg = getErrorMessage(err);
      setError(msg);
      logFirestoreError(err, 'create', pathForBoxes, { throwError: true });
    }
  };

  const closeBox = async (): Promise<void> => {
    if (!activeBox) {
      throw new Error('Nenhuma caixa aberta');
    }

    setLoading(true);
    setError(null);

    const pathForClose = `boxes/${activeBox.id}`;
    const boxRef = doc(db, 'boxes', activeBox.id);

    try {
      // Buscar totais ANTES da transação (getDocs não pode estar dentro)
      const [incomesSnap, expensesSnap, salesSnap, collectionsSnap, transfersSnap] =
        await Promise.all([
          getDocs(query(collection(db, 'incomes'),
            where('boxId', '==', activeBox.id),
            where('tenantId', '==', activeBox.tenantId))),
          getDocs(query(collection(db, 'expenses'),
            where('boxId', '==', activeBox.id),
            where('tenantId', '==', activeBox.tenantId),
            where('status', 'in', ['approved', 'pending']))),
          getDocs(query(collection(db, 'sales'),
            where('boxId', '==', activeBox.id),
            where('tenantId', '==', activeBox.tenantId))),
          getDocs(query(collection(db, 'collections'),
            where('boxId', '==', activeBox.id),
            where('tenantId', '==', activeBox.tenantId))),
          getDocs(query(collection(db, 'transfers'),
            where('boxId', '==', activeBox.id),
            where('tenantId', '==', activeBox.tenantId))),
        ]);

      const totalIncomes = incomesSnap.docs
        .reduce((s, d) => s + (d.data().amount || 0), 0);
      const totalExpenses = expensesSnap.docs
        .reduce((s, d) => s + (d.data().amount || 0), 0);
      const totalSales = salesSnap.docs
        .reduce((s, d) => s + (d.data().amount || 0), 0);
      const totalCollections = collectionsSnap.docs
        .reduce((s, d) => s + (d.data().amount || 0), 0);
      const totalTransfers = transfersSnap.docs
        .reduce((s, d) => s + (d.data().amount || 0), 0);

      const finalAmount = activeBox.initialAmount
        + totalCollections
        + totalIncomes
        - totalExpenses
        - totalSales
        - totalTransfers;

      // Transação atômica — só a escrita final
      await runTransaction(db, async (transaction) => {
        const boxSnap = await transaction.get(boxRef);
        if (!boxSnap.exists()) throw new Error('Caixa não encontrada');
        if (boxSnap.data().status !== 'open') {
          throw new Error('Caixa já foi fechada');
        }

        transaction.update(boxRef, {
          status: 'closed',
          closedAt: serverTimestamp(),
          totalIncomes,
          totalExpenses,
          totalSales,
          totalCollections,
          totalTransfers,
          finalAmount,
        });
      });

      setLoading(false);
    } catch (err) {
      setLoading(false);
      const msg = getErrorMessage(err) || 'Erro ao fechar caixa';
      setError(msg);
      logFirestoreError(err, 'update', pathForClose, { throwError: true });
    }
  };

  const confirmBox = async (boxId: string): Promise<void> => {
    if (role !== 'admin' && role !== 'supervisor') {
      throw new Error('Acceso denegado. Solo administradores o supervisores pueden confirmar cajas.');
    }

    setLoading(true);
    setError(null);

    const pathForConfirm = `boxes/${boxId}`;
    try {
      const updateData = {
        status: 'confirmed' as const,
        confirmedAt: serverTimestamp(),
        confirmedBy: auth?.currentUser?.uid || 'test-user-id'
      };

      await updateDoc(doc(db, 'boxes', boxId), updateData);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      const msg = getErrorMessage(err);
      setError(msg);
      logFirestoreError(err, 'update', pathForConfirm, { throwError: true });
    }
  };

  return {
    activeBox,
    loading,
    error,
    openBox,
    closeBox,
    confirmBox,
    refreshBox,
  };
}
