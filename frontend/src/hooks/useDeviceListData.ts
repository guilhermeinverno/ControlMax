import { useEffect, useRef, useState } from 'react';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DEFAULT_DEVICE_APP_VERSION } from '../constants/device';
import type { HtmlFormSubmitEvent } from '../types/reactEvents';
import { Device, AppUser } from '../types';

function collectorDisplayName(c: AppUser): string {
  return `${c.firstName || ''} ${c.lastName1 || ''}`.trim() || c.username || 'Cobrador';
}

export function useDeviceListData(tenantId?: string, isAdmin = false) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [collectors, setCollectors] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isBindModalOpen, setIsBindModalOpen] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [deviceIdInput, setDeviceIdInput] = useState('');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deviceToToggleBlock, setDeviceToToggleBlock] = useState<Device | null>(null);

  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);

    const qWithOrder = query(
      collection(db, 'devices'),
      where('tenantId', '==', tenantId),
      orderBy('createdAt', 'desc')
    );

    try {
      unsubRef.current = onSnapshot(
        qWithOrder,
        (snapshot) => {
          setDevices(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Device[]);
          setLoading(false);
        },
        (err) => {
          console.warn('Index needed, retrying device list without orderBy:', err);
          const qFallback = query(collection(db, 'devices'), where('tenantId', '==', tenantId));
          unsubRef.current = onSnapshot(
            qFallback,
            (snapshot) => {
              const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Device[];
              list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
              setDevices(list);
              setLoading(false);
            },
            (fallbackErr) => {
              console.error('Error fetching devices with fallback query:', fallbackErr);
              setError('Erro ao carregar dispositivos.');
              setLoading(false);
            }
          );
        }
      );
    } catch (e) {
      console.error('Immediate error setting up devices snapshot:', e);
      setLoading(false);
    }

    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId) return;

    const usersQuery = query(collection(db, 'users'), where('tenantId', '==', tenantId));
    const unsubscribeUsers = onSnapshot(
      usersQuery,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as AppUser[];
        setCollectors(list.filter((u) => (u.role || '').toLowerCase() === 'collector'));
      },
      (err) => console.error('Error fetching collectors for devices assignment:', err)
    );

    return () => unsubscribeUsers();
  }, [tenantId]);

  const resetBindForm = () => {
    setDeviceName('');
    setDeviceModel('');
    setDeviceIdInput('');
    setAssignedUserId('');
  };

  const handleConfirmToggleBlock = async () => {
    if (!deviceToToggleBlock || !isAdmin) return;
    try {
      const newStatus = deviceToToggleBlock.status === 'blocked' ? 'active' : 'blocked';
      await updateDoc(doc(db, 'devices', deviceToToggleBlock.id), {
        status: newStatus,
        lastSync: serverTimestamp(),
      });
      setDeviceToToggleBlock(null);
    } catch (err) {
      console.error('Error toggling device blocked status:', err);
      alert('Erro ao alterar o status do aparelho.');
    }
  };

  const handleBindDeviceSubmit = async (e: HtmlFormSubmitEvent) => {
    e.preventDefault();
    if (!isAdmin || !tenantId) return;
    if (!deviceName.trim() || !deviceIdInput.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      let assignedUserName = 'Sem cobrador';
      if (assignedUserId) {
        const found = collectors.find((c) => c.id === assignedUserId);
        if (found) assignedUserName = collectorDisplayName(found);
      }

      await addDoc(collection(db, 'devices'), {
        tenantId,
        deviceName: deviceName.trim(),
        deviceModel: deviceModel.trim() || 'Modelo não especificado',
        deviceId: deviceIdInput.trim(),
        assignedUserId,
        assignedUserName,
        status: 'active',
        appVersion: DEFAULT_DEVICE_APP_VERSION,
        lastSync: serverTimestamp(),
        linkedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });

      resetBindForm();
      setIsBindModalOpen(false);
    } catch (err) {
      console.error('Error binding device:', err);
      setError('Erro ao vincular dispositivo.');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    devices,
    collectors,
    loading,
    error,
    isBindModalOpen,
    setIsBindModalOpen,
    deviceName,
    setDeviceName,
    deviceModel,
    setDeviceModel,
    deviceIdInput,
    setDeviceIdInput,
    assignedUserId,
    setAssignedUserId,
    submitting,
    deviceToToggleBlock,
    setDeviceToToggleBlock,
    handleConfirmToggleBlock,
    handleBindDeviceSubmit,
  };
}
