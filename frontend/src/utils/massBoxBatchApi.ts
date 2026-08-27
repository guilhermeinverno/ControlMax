import { auth } from '../lib/firebase';
import { financialFetchHeaders } from './financialFetchHeaders';
import { parseCurrencyBRLToCents } from './currency';
import type { MassBoxOpeningUser } from '../hooks/useMassBoxOpeningData';

function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

interface OpenBoxesBatchInput {
  tenantId: string;
  selectedCollectors: MassBoxOpeningUser[];
  useIndividualAmounts: boolean;
  individualAmounts: Record<string, string>;
  defaultAmountCents: number;
  generalObservation: string;
  date?: string;
}

/** P1-04 — abertura massiva via BFF (substitui writeBatch client). */
export async function openBoxesBatchViaBff({
  selectedCollectors,
  useIndividualAmounts,
  individualAmounts,
  defaultAmountCents,
  generalObservation,
  date,
}: OpenBoxesBatchInput): Promise<{ createdCount: number; skipped: unknown[] }> {
  if (!auth?.currentUser) throw new Error('Usuario no autenticado.');

  const idempotencyKey = crypto.randomUUID();
  const token = await auth.currentUser.getIdToken();

  const items = selectedCollectors.map((collector) => {
    const amount = useIndividualAmounts
      ? parseCurrencyBRLToCents(individualAmounts[collector.id] || '0,00')
      : defaultAmountCents;
    return {
      userId: collector.id,
      userName: collector.userName,
      unitId: collector.defaultUnitId || '',
      unitName: collector.defaultUnitName || 'Sin asignar',
      cnId: collector.defaultCnId || '',
      cnName: collector.defaultCnName || 'Sin asignar',
      initialAmount: amount,
    };
  });

  const response = await fetch('/api/boxes/open-batch', {
    method: 'POST',
    headers: financialFetchHeaders(token, idempotencyKey),
    body: JSON.stringify({
      date: date || todayIsoDate(),
      observation: generalObservation,
      items,
      idempotencyKey,
    }),
  });

  const data = await response.json().catch(() => ({} as { error?: string; createdCount?: number; skipped?: unknown[] }));
  if (!response.ok) {
    throw new Error(data.error || `Erro na abertura massiva (${response.status}).`);
  }

  return {
    createdCount: Number(data.createdCount || 0),
    skipped: Array.isArray(data.skipped) ? data.skipped : [],
  };
}

/** P1-04 — fechamento massivo via BFF (usa expected se realFinalAmount omitido). */
export async function closeBoxesBatchViaBff(
  items: Array<{ boxId: string; realFinalAmount?: number }>
): Promise<{ closedCount: number; failed: Array<{ boxId: string; error: string }> }> {
  if (!auth?.currentUser) throw new Error('Usuario no autenticado.');

  const idempotencyKey = crypto.randomUUID();
  const token = await auth.currentUser.getIdToken();

  const response = await fetch('/api/boxes/close-batch', {
    method: 'POST',
    headers: financialFetchHeaders(token, idempotencyKey),
    body: JSON.stringify({ items, idempotencyKey }),
  });

  const data = await response.json().catch(
    () => ({} as { error?: string; closedCount?: number; failed?: Array<{ boxId: string; error: string }> })
  );
  if (!response.ok) {
    throw new Error(data.error || `Erro no fechamento massivo (${response.status}).`);
  }

  return {
    closedCount: Number(data.closedCount || 0),
    failed: Array.isArray(data.failed) ? data.failed : [],
  };
}
