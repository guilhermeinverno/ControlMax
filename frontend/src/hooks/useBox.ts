import { getErrorMessage } from '../utils/errorMessage';
import { useState } from 'react';
import { auth } from '../lib/firebase';
import { useTenant } from './useTenant';
import { useActiveBoxSubscription } from './useActiveBoxSubscription';
import { useOfflineSync } from './useOfflineSync';
import {
  confirmBoxByAdmin,
  logBoxError,
  type OpenBoxParams,
} from '../utils/boxLifecycle';
import { hasPermission } from '../utils/rbac';

export type { OpenBoxParams };

export function useBox() {
  const { tenantId, role, permissions, userName, loading: tenantLoading } = useTenant();
  const [refreshKey, setRefreshKey] = useState(0);
  const subscription = useActiveBoxSubscription(tenantId, refreshKey);
  const { openBox: offlineOpenBox, closeBox: offlineCloseBox } = useOfflineSync();

  const refreshBox = () => setRefreshKey((prev) => prev + 1);

  const openBox = async (params: OpenBoxParams): Promise<void> => {
    const userId = auth?.currentUser?.uid;
    if (!userId || !tenantId) {
      throw new Error('Usuario no autenticado o inquilino no configurado.');
    }

    subscription.setLoading(true);
    subscription.setError(null);

    try {
      await offlineOpenBox({
        tenantId,
        unitId: params.unitId,
        unitName: params.unitName,
        cnId: params.cnId,
        cnName: params.cnName,
        initialAmount: params.initialAmount,
        observation: params.observation,
        date: params.date,
      });
      subscription.setLoading(false);
    } catch (err) {
      subscription.setLoading(false);
      const msg = getErrorMessage(err);
      subscription.setError(msg);
      logBoxError(err, 'create', 'boxes');
    }
  };

  const closeBox = async (realFinalAmount: number): Promise<void> => {
    if (!subscription.activeBox) throw new Error('Nenhuma caixa aberta');

    subscription.setLoading(true);
    subscription.setError(null);

    try {
      await offlineCloseBox({
        tenantId,
        boxId: subscription.activeBox.id,
        realFinalAmount,
        notes: '',
      });
      subscription.setLoading(false);
    } catch (err) {
      subscription.setLoading(false);
      subscription.setError(getErrorMessage(err) || 'Erro ao fechar caixa');
      logBoxError(err, 'update', `boxes/${subscription.activeBox.id}`);
    }
  };

  const confirmBox = async (boxId: string): Promise<void> => {
    const user = { role: role || '', permissions };
    if (!hasPermission(user, 'caja:confirmar')) {
      throw new Error('Acceso denegado. Solo administradores o supervisores autorizados pueden confirmar cajas.');
    }

    subscription.setLoading(true);
    subscription.setError(null);

    try {
      await confirmBoxByAdmin(boxId, tenantId);
      subscription.setLoading(false);
    } catch (err) {
      subscription.setLoading(false);
      subscription.setError(getErrorMessage(err));
      logBoxError(err, 'update', `boxes/${boxId}`);
    }
  };

  return {
    activeBox: subscription.activeBox,
    loading: tenantLoading || subscription.loading,
    error: subscription.error,
    openBox,
    closeBox,
    confirmBox,
    refreshBox,
  };
}
