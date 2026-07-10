import { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { collection, limit, onSnapshot, query, where } from 'firebase/firestore';
import type {
  TransferBusinessCenter,
  TransferSalesTab,
  TransferSalesUser,
  TransferUnit,
  UnitTransfer,
} from '../types/transferSales';
import {
  acceptUnitTransfer,
  createUnitTransferRequest,
  rejectUnitTransfer,
} from '../utils/transferSalesOperations';

export function useTransferSalesData(
  tenantId?: string,
  userName?: string,
  canApproveAll = false
) {
  const currentUserId = auth.currentUser?.uid;

  const [activeTab, setActiveTab] = useState<TransferSalesTab>('transfer');
  const [businessCenters, setBusinessCenters] = useState<TransferBusinessCenter[]>([]);
  const [users, setUsers] = useState<TransferSalesUser[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(true);

  const [selectedSociedad, setSelectedSociedad] = useState('');
  const [selectedCnId, setSelectedCnId] = useState('');
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [destinationUserId, setDestinationUserId] = useState('');
  const [unitBalances, setUnitBalances] = useState<Record<string, number>>({});
  const [unitBoxes, setUnitBoxes] = useState<Record<string, 'Abierta' | 'Cerrada'>>({});
  const [loadingUnitsData, setLoadingUnitsData] = useState(false);

  const [pendingTransfers, setPendingTransfers] = useState<UnitTransfer[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [selectedDestCnMap, setSelectedDestCnMap] = useState<Record<string, string>>({});

  const [historyTransfers, setHistoryTransfers] = useState<UnitTransfer[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isConfirmTransferOpen, setIsConfirmTransferOpen] = useState(false);
  const [confirmAcceptId, setConfirmAcceptId] = useState<string | null>(null);
  const [confirmRejectId, setConfirmRejectId] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;

    setLoadingMetadata(true);
    const qCenters = query(collection(db, 'business_centers'), where('tenantId', '==', tenantId));
    const unsubCenters = onSnapshot(
      qCenters,
      (snapshot) => {
        setBusinessCenters(
          snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as TransferBusinessCenter[]
        );
      },
      (err) => console.error('Error fetching business centers:', err)
    );

    const qUsers = query(
      collection(db, 'users'),
      where('tenantId', '==', tenantId),
      where('active', '==', true)
    );
    const unsubUsers = onSnapshot(
      qUsers,
      (snapshot) => {
        setUsers(
          snapshot.docs.map((d) => ({
            id: d.id,
            userName:
              d.data().userName ||
              d.data().displayName ||
              d.data().email?.split('@')[0] ||
              'Cobrador',
            ...d.data(),
          })) as TransferSalesUser[]
        );
        setLoadingMetadata(false);
      },
      (err) => {
        console.error('Error fetching users:', err);
        setLoadingMetadata(false);
      }
    );

    return () => {
      unsubCenters();
      unsubUsers();
    };
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId || !selectedCnId) {
      setUnitBalances({});
      setUnitBoxes({});
      return;
    }

    setLoadingUnitsData(true);
    const selectedCn = businessCenters.find((c) => c.id === selectedCnId);
    if (!selectedCn?.linkedUnits?.length) {
      setLoadingUnitsData(false);
      return;
    }

    const unitIds = selectedCn.linkedUnits.map((u) => u.id);
    const qSales = query(
      collection(db, 'sales'),
      where('tenantId', '==', tenantId),
      where('status', '==', 'active')
    );
    const qBoxes = query(
      collection(db, 'boxes'),
      where('tenantId', '==', tenantId),
      where('status', '==', 'open')
    );

    const unsubSales = onSnapshot(
      qSales,
      (snapshot) => {
        const balances: Record<string, number> = {};
        unitIds.forEach((id) => {
          balances[id] = 0;
        });
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const uId = data.unitId as string;
          const bal = Number(data.balance || 0);
          if (uId && unitIds.includes(uId)) {
            balances[uId] = (balances[uId] || 0) + bal;
          }
        });
        setUnitBalances(balances);
        setLoadingUnitsData(false);
      },
      (err) => {
        console.error('Error fetching live unit balances:', err);
        setLoadingUnitsData(false);
      }
    );

    const unsubBoxes = onSnapshot(
      qBoxes,
      (snapshot) => {
        const statuses: Record<string, 'Abierta' | 'Cerrada'> = {};
        unitIds.forEach((id) => {
          statuses[id] = 'Cerrada';
        });
        snapshot.docs.forEach((docSnap) => {
          const uId = docSnap.data().unitId as string;
          if (uId && unitIds.includes(uId)) statuses[uId] = 'Abierta';
        });
        setUnitBoxes(statuses);
      },
      (err) => console.error('Error fetching live boxes:', err)
    );

    return () => {
      unsubSales();
      unsubBoxes();
    };
  }, [tenantId, selectedCnId, businessCenters]);

  useEffect(() => {
    if (!tenantId || activeTab !== 'accept') return;

    setLoadingPending(true);
    const qPending = !canApproveAll && currentUserId
      ? query(
          collection(db, 'unit_transfers'),
          where('tenantId', '==', tenantId),
          where('toUserId', '==', currentUserId),
          where('status', '==', 'pending')
        )
      : query(
          collection(db, 'unit_transfers'),
          where('tenantId', '==', tenantId),
          where('status', '==', 'pending')
        );

    return onSnapshot(
      qPending,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as UnitTransfer[];
        list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setPendingTransfers(list);
        setLoadingPending(false);
      },
      (err) => {
        console.error('Error fetching pending transfers:', err);
        setLoadingPending(false);
      }
    );
  }, [tenantId, activeTab, currentUserId, canApproveAll]);

  useEffect(() => {
    if (!tenantId || activeTab !== 'history') return;

    setLoadingHistory(true);
    const qHistory = query(
      collection(db, 'unit_transfers'),
      where('tenantId', '==', tenantId),
      limit(50)
    );

    return onSnapshot(
      qHistory,
      (snapshot) => {
        const list = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }) as UnitTransfer)
          .filter((t) => t.status !== 'pending');
        list.sort(
          (a, b) =>
            (b.resolvedAt?.seconds || b.createdAt?.seconds || 0) -
            (a.resolvedAt?.seconds || a.createdAt?.seconds || 0)
        );
        setHistoryTransfers(list);
        setLoadingHistory(false);
      },
      (err) => {
        console.error('Error fetching history transfers:', err);
        setLoadingHistory(false);
      }
    );
  }, [tenantId, activeTab]);

  const switchTab = (tab: TransferSalesTab) => {
    setActiveTab(tab);
    setError(null);
    setSuccess(null);
  };

  const toggleUnitSelection = (unitId: string) => {
    setSelectedUnitIds((prev) =>
      prev.includes(unitId) ? prev.filter((id) => id !== unitId) : [...prev, unitId]
    );
  };

  const handleSelectAllUnits = (checked: boolean, units: TransferUnit[]) => {
    setSelectedUnitIds(checked ? units.map((u) => u.id) : []);
  };

  const resetOriginSelection = () => {
    setSelectedCnId('');
    setSelectedUnitIds([]);
  };

  const executeTransferRequest = async () => {
    if (!tenantId || !selectedCnId || selectedUnitIds.length === 0 || !destinationUserId) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    setIsConfirmTransferOpen(false);

    try {
      const message = await createUnitTransferRequest({
        tenantId,
        selectedCnId,
        selectedUnitIds,
        destinationUserId,
        businessCenters,
        users,
        unitBalances,
        unitBoxes,
        userName,
        currentUserId,
      });
      setSuccess(message);
      setSelectedUnitIds([]);
      setDestinationUserId('');
    } catch (err) {
      console.error('Error creating unit transfer request:', err);
      setError('Error al registrar el traslado de unidades en Firestore.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptTransfer = async (transfer: UnitTransfer) => {
    const destCnId = selectedDestCnMap[transfer.id];
    if (!destCnId || !tenantId) {
      setError('Por favor, seleccione el Centro de Negocios de destino.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    setConfirmAcceptId(null);

    try {
      const message = await acceptUnitTransfer({
        tenantId,
        transfer,
        destCnId,
        businessCenters,
        userName,
      });
      setSuccess(message);
      setSelectedDestCnMap((prev) => {
        const next = { ...prev };
        delete next[transfer.id];
        return next;
      });
    } catch (err) {
      console.error('Critical: Error accepting transfer batch:', err);
      setError('Error al procesar la aceptación física en Firestore. Operación cancelada.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectTransfer = async (transferId: string) => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    setConfirmRejectId(null);

    try {
      await rejectUnitTransfer(transferId, userName);
      setSuccess('El traslado de unidades ha sido rechazado correctamente.');
    } catch (err) {
      console.error('Error rejecting transfer:', err);
      setError('Error al procesar el rechazo del traslado.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentCn = businessCenters.find((c) => c.id === selectedCnId);
  const activeUnitsInCn = currentCn?.linkedUnits?.filter((u) => u.active) || [];
  const totalSelectedBalance = selectedUnitIds.reduce(
    (sum, id) => sum + (unitBalances[id] || 0),
    0
  );

  return {
    activeTab,
    switchTab,
    businessCenters,
    users,
    loadingMetadata,
    selectedSociedad,
    setSelectedSociedad,
    selectedCnId,
    setSelectedCnId,
    selectedUnitIds,
    setSelectedUnitIds,
    destinationUserId,
    setDestinationUserId,
    unitBalances,
    unitBoxes,
    loadingUnitsData,
    pendingTransfers,
    loadingPending,
    selectedDestCnMap,
    setSelectedDestCnMap,
    historyTransfers,
    loadingHistory,
    submitting,
    error,
    success,
    isConfirmTransferOpen,
    setIsConfirmTransferOpen,
    confirmAcceptId,
    setConfirmAcceptId,
    confirmRejectId,
    setConfirmRejectId,
    toggleUnitSelection,
    handleSelectAllUnits,
    resetOriginSelection,
    executeTransferRequest,
    handleAcceptTransfer,
    handleRejectTransfer,
    currentCn,
    activeUnitsInCn,
    totalSelectedBalance,
    currentUserId,
  };
}
