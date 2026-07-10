import type { CreditRequest } from './creditRequestMapper';

export type CreditRequestTab = 'all' | 'pending' | 'approved' | 'rejected' | 'auto';

export function filterCreditRequests(
  requests: CreditRequest[],
  activeTab: CreditRequestTab,
  searchTerm: string
): CreditRequest[] {
  return requests.filter((req) => {
    if (activeTab !== 'all' && req.status !== activeTab) return false;
    if (searchTerm.trim() === '') return true;
    const term = searchTerm.toLowerCase();
    return (
      req.clientName?.toLowerCase().includes(term) ||
      req.clientDoc?.toLowerCase().includes(term)
    );
  });
}

export function countPendingCreditRequests(requests: CreditRequest[]): number {
  return requests.filter((r) => r.status === 'pending').length;
}
