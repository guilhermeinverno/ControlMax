import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BusinessCenter } from '../types/company';

export async function fetchActiveBusinessCenters(tenantId: string): Promise<BusinessCenter[]> {
  const centersQuery = query(collection(db, 'business_centers'), where('tenantId', '==', tenantId));
  const snap = await getDocs(centersQuery);

  return snap.docs
    .map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: (data.name as string) || '',
        code: (data.code as string) || '',
        linkedUnits: (data.linkedUnits as BusinessCenter['linkedUnits']) || [],
        status: (data.status as string) || 'Activo',
      };
    })
    .filter((center) => center.status === 'Activo')
    .map(({ status: _status, ...center }) => center);
}

export function pickDefaultCnSelection(centers: BusinessCenter[]): { cnId: string; unitId: string } {
  if (centers.length === 0) {
    return { cnId: '', unitId: '' };
  }

  const activeUnits = centers[0].linkedUnits.filter((unit) => unit.active);
  return {
    cnId: centers[0].id,
    unitId: activeUnits.length > 0 ? 'all' : '',
  };
}
