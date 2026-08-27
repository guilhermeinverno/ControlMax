import { auth } from '../lib/firebase';
import { syncExecutor } from '../utils/sync/setupSync';
import { SyncManager } from '../utils/syncManager';
import {
  OpenBoxPayload,
  SalePayload,
  PaymentPayload,
  CloseBoxPayload,
} from '../types/syncPayloads';

export function useOfflineSync() {
  const openBox = async (data: Omit<OpenBoxPayload, 'id' | 'createdAt'>): Promise<void> => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    // OpenBoxPayload tem openedAt. Se não estiver no data, definimos como agora.
    const payload: OpenBoxPayload = {
      ...data,
      id,
      openedAt: (data as any).openedAt || now,
    };

    const userId = auth?.currentUser?.uid || data.collectorId || "anonymous";
    await SyncManager.enqueue('openBox', payload, data.tenantId, userId);

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      setTimeout(() => {
        syncExecutor.processAll().catch((err) => {
          console.error('[OfflineSync] Error processing queue after openBox:', err);
        });
      }, 0);
    }
  };

  const createSale = async (data: Omit<SalePayload, 'id' | 'createdAt'>): Promise<void> => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const payload: SalePayload = {
      ...data,
      id,
      createdAt: now,
    };

    const userId = auth?.currentUser?.uid || data.customerId;
    await SyncManager.enqueue('sale', payload, data.tenantId, userId);

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      setTimeout(() => {
        syncExecutor.processAll().catch((err) => {
          console.error('[OfflineSync] Error processing queue after createSale:', err);
        });
      }, 0);
    }
  };

  const recordPayment = async (data: Omit<PaymentPayload, 'id' | 'createdAt'>): Promise<void> => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const payload: PaymentPayload = {
      ...data,
      id,
      createdAt: now,
    };

    const userId = auth?.currentUser?.uid || data.customerId;
    await SyncManager.enqueue('payment', payload, data.tenantId, userId);

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      setTimeout(() => {
        syncExecutor.processAll().catch((err) => {
          console.error('[OfflineSync] Error processing queue after recordPayment:', err);
        });
      }, 0);
    }
  };

  const closeBox = async (data: Omit<CloseBoxPayload, 'id' | 'createdAt'>): Promise<void> => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // CloseBoxPayload tem closedAt. Se não estiver no data, definimos como agora.
    const payload: CloseBoxPayload = {
      ...data,
      id,
      closedAt: (data as any).closedAt || now,
    };

    const userId = auth?.currentUser?.uid || data.collectorId || "anonymous";
    await SyncManager.enqueue('closeBox', payload, data.tenantId, userId);

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      setTimeout(() => {
        syncExecutor.processAll().catch((err) => {
          console.error('[OfflineSync] Error processing queue after closeBox:', err);
        });
      }, 0);
    }
  };

  return {
    openBox,
    createSale,
    recordPayment,
    closeBox,
  };
}
