import { addDoc, collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BusinessCenter, DEFAULT_BUSINESS_CENTERS } from '../types/businessCenter';

const DEFAULT_FINANCIAL_PARAMS = {
  maxAmountPerCredit: 5000000,
  annualInterestRate: 20,
  lateFeePercentage: 5,
  allowRefinance: true,
  minCapitalRequirement: 10000000,
};

export function mapBusinessCenterDoc(id: string, data: Record<string, unknown>): BusinessCenter {
  return {
    id,
    name: String(data.name || ''),
    code: String(data.code || ''),
    status: (data.status as BusinessCenter['status']) || 'Activo',
    unitCount: Number(data.unitCount || 0),
    responsible: String(data.responsible || ''),
    observations: String(data.observations || ''),
    linkedUnits: (data.linkedUnits as BusinessCenter['linkedUnits']) || [],
    financialParams: (data.financialParams as BusinessCenter['financialParams']) || DEFAULT_FINANCIAL_PARAMS,
  };
}

async function seedDefaultBusinessCenters(tenantId: string): Promise<void> {
  const collectionRef = collection(db, 'business_centers');
  for (const item of DEFAULT_BUSINESS_CENTERS) {
    await addDoc(collectionRef, { ...item, tenantId });
  }
}

export function subscribeBusinessCenters(
  tenantId: string,
  onCenters: (centers: BusinessCenter[]) => void,
  onLoadingChange: (loading: boolean) => void
): () => void {
  const collectionRef = collection(db, 'business_centers');
  const q = query(collectionRef, where('tenantId', '==', tenantId));

  return onSnapshot(
    q,
    async (snapshot) => {
      if (snapshot.empty) {
        onLoadingChange(true);
        try {
          await seedDefaultBusinessCenters(tenantId);
        } catch (err) {
          console.error('Error seeding default business centers:', err);
        }
        onLoadingChange(false);
        return;
      }

      onCenters(snapshot.docs.map((docSnap) => mapBusinessCenterDoc(docSnap.id, docSnap.data())));
      onLoadingChange(false);
    },
    (error) => {
      console.error('Error loading business centers:', error);
      onLoadingChange(false);
    }
  );
}
