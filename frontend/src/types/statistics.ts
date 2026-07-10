import { Timestamp } from 'firebase/firestore';

export interface StatsBox {
  id: string;
  tenantId: string;
  unitName?: string;
  unidade?: string;
  cnName?: string;
  userId: string;
  userName: string;
  status: 'open' | 'closed' | 'confirmed';
  openedAt: Timestamp;
  closedAt?: Timestamp;
  initialAmount: number;
  totalIncomes: number;
  totalExpenses: number;
  totalSales: number;
  totalCollections: number;
  totalTransfers: number;
  finalAmount: number;
}

export interface StatsCollection {
  id: string;
  tenantId: string;
  amount: number;
  createdAt: Timestamp;
}

export interface StatsExpense {
  id: string;
  tenantId: string;
  amount: number;
  createdAt: Timestamp;
}

export interface StatsCreditRequest {
  id: string;
  tenantId: string;
  status: 'pending' | 'approved' | 'rejected' | 'auto';
  createdAt: Timestamp;
}

export interface StatsSale {
  id: string;
  tenantId: string;
  valor: string;
  saldoTotal?: string;
  createdAt: Timestamp;
}

export interface StatsCustomer {
  id: string;
  tenantId: string;
  createdAt?: Timestamp;
}
