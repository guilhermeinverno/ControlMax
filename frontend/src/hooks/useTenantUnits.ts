import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface TenantUnitOption {
  id: string;
  name: string;
  cnId?: string;
  cnName?: string;
}

/** Lista unidades/rotas ativas do tenant (fonte usada no escopo operacional). */
export function useTenantUnits(tenantId?: string) {
  const [units, setUnits] = useState<TenantUnitOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) {
      setUnits([]);
      return undefined;
    }

    setLoading(true);
    setError(null);
    const q = query(
      collection(db, 'routes'),
      where('tenantId', '==', tenantId),
      where('active', '==', true),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs
          .map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              name: String(data.name || docSnap.id),
              cnId: data.cnId ? String(data.cnId) : undefined,
              cnName: data.cnName ? String(data.cnName) : undefined,
            } satisfies TenantUnitOption;
          })
          .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
        setUnits(list);
        setLoading(false);
      },
      (err) => {
        console.error('Erro ao carregar unidades do tenant:', err);
        setError('Não foi possível carregar as unidades.');
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [tenantId]);

  return { units, loading, error };
}
