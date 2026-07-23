import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { logFirestoreError } from './firestoreError';

export async function fetchCollectionWithFallback<T>(
  colName: string,
  targetTenantId: string,
  usuarioUnidades?: string[]
): Promise<T[]> {
  try {
    const constraints = [where('tenantId', '==', targetTenantId)];

    const collectionsWithUnitId = ['sales', 'boxes', 'collections', 'expenses', 'incomes', 'bc_expenses', 'bc_incomes'];
    if (collectionsWithUnitId.includes(colName)) {
      if (usuarioUnidades && usuarioUnidades.length > 0) {
        if (usuarioUnidades.length === 1) {
          constraints.push(where('unitId', '==', usuarioUnidades[0]));
        } else {
          constraints.push(where('unitId', 'in', usuarioUnidades));
        }
      } else {
        constraints.push(where('unitId', '==', 'none_assigned'));
      }
    }

    const q = query(collection(db, colName), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as unknown as T);
  } catch (err) {
    logFirestoreError(err, 'get', colName, { label: 'Firestore Error in Statistics' });
    return [];
  }
}
