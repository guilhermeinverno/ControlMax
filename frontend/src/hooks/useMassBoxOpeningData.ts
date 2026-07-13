import { useEffect, useState } from 'react';
import {
  subscribeMassBoxActiveBoxes,
  subscribeMassBoxCollectors,
} from '../utils/massBoxOpeningListeners';

export interface MassBoxOpeningUser {
  id: string;
  tenantId: string;
  userName: string;
  role: 'admin' | 'supervisor' | 'collector';
  email: string;
  active: boolean;
  defaultUnitId?: string;
  defaultUnitName?: string;
  defaultCnId?: string;
  defaultCnName?: string;
}

export interface MassBoxOpeningBox {
  id: string;
  tenantId: string;
  unitId: string;
  unitName: string;
  cnId: string;
  cnName: string;
  userId: string;
  userName: string;
  status: 'open' | 'closed' | 'confirmed';
  openedAt: import('firebase/firestore').Timestamp;
  initialAmount: number;
  totalIncomes: number;
  totalExpenses: number;
  totalSales: number;
  totalCollections: number;
  totalTransfers: number;
  finalAmount: number;
}

export function useMassBoxOpeningData(tenantId?: string) {
  const [collectors, setCollectors] = useState<MassBoxOpeningUser[]>([]);
  const [activeBoxes, setActiveBoxes] = useState<MassBoxOpeningBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;

    setLoading(true);
    setLoadError(null);

    const unsubUsers = subscribeMassBoxCollectors(
      tenantId,
      setCollectors,
      setLoading,
      setLoadError
    );
    const unsubBoxes = subscribeMassBoxActiveBoxes(tenantId, setActiveBoxes);

    return () => {
      unsubUsers();
      unsubBoxes();
    };
  }, [tenantId]);

  return { collectors, activeBoxes, loading, loadError };
}
