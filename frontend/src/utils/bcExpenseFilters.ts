import type { BCExpense, BCExpenseCategoryFilter, BCExpenseStatusFilter } from '../types/bcExpense';
import { BC_EXPENSE_CATEGORY_MAP } from '../types/bcExpense';

export function filterBCExpenses(
  expenses: BCExpense[],
  statusFilter: BCExpenseStatusFilter,
  categoryFilter: BCExpenseCategoryFilter,
  searchQuery: string
): BCExpense[] {
  return expenses.filter((exp) => {
    if (statusFilter !== 'all' && exp.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && exp.category !== categoryFilter) return false;
    if (searchQuery.trim() === '') return true;

    const q = searchQuery.toLowerCase();
    return (
      (exp.description || '').toLowerCase().includes(q) ||
      (exp.userName || '').toLowerCase().includes(q) ||
      (BC_EXPENSE_CATEGORY_MAP[exp.category] || '').toLowerCase().includes(q) ||
      String(exp.amount / 100).includes(q)
    );
  });
}

export function computeBCExpenseStats(expenses: BCExpense[]) {
  const pending = expenses.filter((e) => e.status === 'pending');
  const rejected = expenses.filter((e) => e.status === 'rejected');
  return {
    approvedTotal: expenses.filter((e) => e.status === 'approved').reduce((s, e) => s + (e.amount || 0), 0),
    pendingCount: pending.length,
    pendingTotal: pending.reduce((s, e) => s + (e.amount || 0), 0),
    rejectedCount: rejected.length,
    rejectedTotal: rejected.reduce((s, e) => s + (e.amount || 0), 0),
  };
}
