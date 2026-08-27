import type { CleaningCollection } from '../types/collectionCleaning';

/**
 * Cancelamento de cobrança no client SDK não é permitido (FIN-01: collections/boxes write=false).
 * Use o estorno via BFF: POST /api/transactions/reversal.
 */
export async function cancelCollectionAndUpdateBox(
  _collectionToCancel: CleaningCollection,
  _cancelReason: string,
  _userName?: string
): Promise<void> {
  throw new Error(
    'Cancelamento de cobrança pelo client não é permitido. Utilize o estorno via BFF (/api/transactions/reversal).'
  );
}
