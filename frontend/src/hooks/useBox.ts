import { getErrorMessage } from '../utils/errorMessage';
import { useState } from 'react';
import { auth } from '../lib/firebase';
import { useTenant } from './useTenant';
import { useActiveBoxSubscription } from './useActiveBoxSubscription';
import {
  closeActiveBox,
  confirmBoxByAdmin,
  createOpenBox,
  logBoxError,
  type OpenBoxParams,
} from '../utils/boxLifecycle';

export type { OpenBoxParams };

export function useBox() {
  const { tenantId, role, userName, loading: tenantLoading } = useTenant();
  const [refreshKey, setRefreshKey] = useState(0);
  const subscription = useActiveBoxSubscription(tenantId, refreshKey);

  const refreshBox = () => setRefreshKey((prev) => prev + 1);

  const openBox = async (params: OpenBoxParams): Promise<void> => {
    const userId = auth?.currentUser?.uid;
    if (!userId || !tenantId) {
      throw new Error('Usuario no autenticado o inquilino no configurado.');
    }

    subscription.setLoading(true);
    subscription.setError(null);

    try {
      await createOpenBox(tenantId, userId, userName, params);
      subscription.setLoading(false);
    } catch (err) {
      subscription.setLoading(false);
      const msg = getErrorMessage(err);
      subscription.setError(msg);
      logBoxError(err, 'create', 'boxes');
    }
  };

  const closeBox = async (): Promise<void> => {
    if (!subscription.activeBox) throw new Error('Nenhuma caixa aberta');

    subscription.setLoading(true);
    subscription.setError(null);

    try {
      await closeActiveBox(subscription.activeBox);
      subscription.setLoading(false);
    } catch (err) {
      subscription.setLoading(false);
      subscription.setError(getErrorMessage(err) || 'Erro ao fechar caixa');
      logBoxError(err, 'update', `boxes/${subscription.activeBox.id}`);
    }
  };

  const confirmBox = async (boxId: string): Promise<void> => {
    if (role !== 'admin' && role !== 'supervisor') {
      throw new Error('Acceso denegado. Solo administradores o supervisores pueden confirmar cajas.');
    }

    subscription.setLoading(true);
    subscription.setError(null);

    try {
      await confirmBoxByAdmin(boxId);
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
