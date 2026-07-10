import type { BCIncome, BCIncomeStatusFilter } from '../types/bcIncome';
import { BC_INCOME_CATEGORY_MAP } from '../types/bcIncome';

export function filterBCIncomes(
  incomes: BCIncome[],
  statusFilter: BCIncomeStatusFilter,
  searchQuery: string
): BCIncome[] {
  return incomes.filter((inc) => {
    if (statusFilter !== 'all' && inc.status !== statusFilter) return false;
    if (searchQuery.trim() === '') return true;

    const queryLower = searchQuery.toLowerCase();
    return (
      (inc.description || '').toLowerCase().includes(queryLower) ||
      (inc.userName || '').toLowerCase().includes(queryLower) ||
      (BC_INCOME_CATEGORY_MAP[inc.category] || '').toLowerCase().includes(queryLower) ||
      String(inc.amount / 100).includes(queryLower)
    );
  });
}

export function computeBCIncomeStats(incomes: BCIncome[]) {
  return {
    totalApproved: incomes.filter((i) => i.status === 'approved').reduce((s, i) => s + (i.amount || 0), 0),
    pendingCount: incomes.filter((i) => i.status === 'pending').length,
    rejectedCount: incomes.filter((i) => i.status === 'rejected').length,
  };
}
