import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { logFirestoreError } from './firestoreError';

export async function fetchCollectionWithFallback<T>(
  colName: string,
  targetTenantId: string
): Promise<T[]> {
  try {
    const q = query(collection(db, colName), where('tenantId', '==', targetTenantId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as unknown as T);
  } catch (err) {
    logFirestoreError(err, 'get', colName, { label: 'Firestore Error in Statistics' });
    return [];
  }
}
