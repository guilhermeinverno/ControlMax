export interface BCIncome {
  id: string;
  tenantId: string;
  cnId: string;
  cnName: string;
  userId: string;
  userName: string;
  amount: number;
  description: string;
  category: 'deposit' | 'transfer' | 'contribution' | 'other';
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: unknown;
  createdAt?: { seconds?: number };
}

export const BC_INCOME_CATEGORY_MAP: Record<string, string> = {
  deposit: 'Depósito Bancário',
  transfer: 'Transferência Pix',
  contribution: 'Aporte de Capital',
  other: 'Outros Recebimentos',
};

export type BCIncomeStatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

export function todayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
