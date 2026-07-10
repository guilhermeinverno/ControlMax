export interface BCExpense {
  id: string;
  tenantId: string;
  cnId: string;
  cnName: string;
  userId: string;
  userName: string;
  amount: number;
  description: string;
  category: 'salary' | 'rent' | 'supplies' | 'transport' | 'other';
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: unknown;
  createdAt: { seconds?: number };
}

export const BC_EXPENSE_CATEGORY_MAP: Record<string, string> = {
  salary: 'Salário',
  rent: 'Aluguel',
  supplies: 'Suprimentos',
  transport: 'Transporte',
  other: 'Outro',
};

export type BCExpenseStatusFilter = 'all' | 'pending' | 'approved' | 'rejected';
export type BCExpenseCategoryFilter = 'all' | BCExpense['category'];

export function todayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
