import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { parseCurrencyBRLToCents } from './currency';
import type { MassBoxOpeningBox, MassBoxOpeningUser } from '../hooks/useMassBoxOpeningData';

interface OpenBoxesBatchInput {
  tenantId: string;
  selectedCollectors: MassBoxOpeningUser[];
  useIndividualAmounts: boolean;
  individualAmounts: Record<string, string>;
  defaultAmountCents: number;
  generalObservation: string;
}

export async function openBoxesBatch({
  tenantId,
  selectedCollectors,
  useIndividualAmounts,
  individualAmounts,
  defaultAmountCents,
  generalObservation,
}: OpenBoxesBatchInput) {
  const batchSize = 500;

  for (let i = 0; i < selectedCollectors.length; i += batchSize) {
    const chunk = selectedCollectors.slice(i, i + batchSize);
    const batch = writeBatch(db);
    const boxesRef = collection(db, 'boxes');

    chunk.forEach((collector) => {
      const newBoxRef = doc(boxesRef);
      const amount = useIndividualAmounts
        ? parseCurrencyBRLToCents(individualAmounts[collector.id] || '0,00')
        : defaultAmountCents;

      batch.set(newBoxRef, {
        tenantId,
        unitId: collector.defaultUnitId || '',
        unitName: collector.defaultUnitName || 'Sin asignar',
        cnId: collector.defaultCnId || '',
        cnName: collector.defaultCnName || 'Sin asignar',
        userId: collector.id,
        userName: collector.userName,
        status: 'open',
        openedAt: serverTimestamp(),
        initialAmount: amount,
        observation: generalObservation,
        totalIncomes: 0,
        totalExpenses: 0,
        totalSales: 0,
        totalCollections: 0,
        totalTransfers: 0,
        finalAmount: amount,
      });
    });

    await batch.commit();
  }
}

export function filterCollectors(collectors: MassBoxOpeningUser[], searchQuery: string): MassBoxOpeningUser[] {
  return collectors.filter((collector) => collector.userName?.toLowerCase().includes(searchQuery.toLowerCase()));
}

interface ToggleSelectAllInput {
  filteredCollectors: MassBoxOpeningUser[];
  activeBoxes: MassBoxOpeningBox[];
  selectedIds: string[];
}

export function toggleSelectAll({ filteredCollectors, activeBoxes, selectedIds }: ToggleSelectAllInput): string[] {
  const hasOpenBox = (collectorId: string) => activeBoxes.some((box) => box.userId === collectorId);

  const eligibleIds = filteredCollectors
    .filter((collector) => !hasOpenBox(collector.id))
    .map((collector) => collector.id);

  const allEligibleSelected = eligibleIds.length > 0 && eligibleIds.every((id) => selectedIds.includes(id));
  if (allEligibleSelected) {
    return selectedIds.filter((id) => !eligibleIds.includes(id));
  }

  return Array.from(new Set([...selectedIds, ...eligibleIds]));
}
