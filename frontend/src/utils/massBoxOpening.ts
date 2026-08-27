import { parseCurrencyBRLToCents } from './currency';
import type { MassBoxOpeningBox, MassBoxOpeningUser } from '../hooks/useMassBoxOpeningData';
import { openBoxesBatchViaBff } from './massBoxBatchApi';

interface OpenBoxesBatchInput {
  tenantId: string;
  selectedCollectors: MassBoxOpeningUser[];
  useIndividualAmounts: boolean;
  individualAmounts: Record<string, string>;
  defaultAmountCents: number;
  generalObservation: string;
}

/** Abertura massiva via BFF (P1-04). Mantém assinatura usada por MassBoxOpening. */
export async function openBoxesBatch(input: OpenBoxesBatchInput) {
  return openBoxesBatchViaBff(input);
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

export function expectedBoxAmount(box: MassBoxOpeningBox): number {
  return (
    (box.initialAmount || 0) +
    (box.totalCollections || 0) +
    (box.totalIncomes || 0) -
    (box.totalExpenses || 0) -
    (box.totalSales || 0) -
    (box.totalTransfers || 0)
  );
}

// re-export parse helper used by tests/UI
export { parseCurrencyBRLToCents };
