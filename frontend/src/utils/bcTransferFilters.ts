import type { BCTransfer } from '../hooks/useBCTransfersHistory';

interface BCTransferFilterOptions {
  statusFilter: 'all' | 'pending' | 'confirmed' | 'rejected';
  typeFilter: 'all' | 'collector' | 'cn';
  targetCnFilter: 'all' | 'cn_padrao' | 'cn_b';
  searchQuery: string;
}

export function filterTransfers(transfers: BCTransfer[], options: BCTransferFilterOptions): BCTransfer[] {
  const { statusFilter, typeFilter, targetCnFilter, searchQuery } = options;

  return transfers.filter((transfer) => {
    if (statusFilter !== 'all' && transfer.status !== statusFilter) return false;
    if (typeFilter !== 'all' && transfer.fromType !== typeFilter) return false;
    if (targetCnFilter !== 'all' && transfer.toCnId !== targetCnFilter) return false;

    if (searchQuery.trim() !== '') {
      const normalizedQuery = searchQuery.toLowerCase();
      const matchFromName = (transfer.fromName || '').toLowerCase().includes(normalizedQuery);
      const matchToName = (transfer.toCnName || '').toLowerCase().includes(normalizedQuery);
      const matchDesc = (transfer.description || '').toLowerCase().includes(normalizedQuery);
      const matchAmount = String(transfer.amount / 100).includes(normalizedQuery);

      if (!matchFromName && !matchToName && !matchDesc && !matchAmount) {
        return false;
      }
    }

    return true;
  });
}

export function computeTransferTotals(transfers: BCTransfer[]) {
  const totalConfirmed = transfers
    .filter((transfer) => transfer.status === 'confirmed')
    .reduce((sum, transfer) => sum + (transfer.amount || 0), 0);

  const pendingTransfers = transfers.filter((transfer) => transfer.status === 'pending');
  const totalPending = pendingTransfers.reduce((sum, transfer) => sum + (transfer.amount || 0), 0);
  const pendingCount = pendingTransfers.length;

  const totalDay = transfers.reduce((sum, transfer) => sum + (transfer.amount || 0), 0);

  return {
    totalConfirmed,
    totalPending,
    totalDay,
    pendingCount,
  };
}
