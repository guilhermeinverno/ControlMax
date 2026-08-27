import type { Timestamp } from 'firebase/firestore';

export interface TenantDoc {
  id: string;
  name: string;
  active: boolean;
  createdAt?: Timestamp;
  plan?: 'Free' | 'Pro' | 'Enterprise' | 'Completo';
  /** Mensalidade acordada em centavos. */
  monthlyPrice?: number;
  billingStatus?: 'active' | 'past_due' | 'suspended';
  billingMethod?: 'pix' | 'boleto' | 'contrato';
}

export interface SaasInvoice {
  id: string;
  tenantId: string;
  tenantName?: string;
  period: string;
  amountCents: number;
  status: 'open' | 'paid' | 'canceled';
  method: 'pix' | 'boleto' | 'contrato';
  externalRef?: string;
  notes?: string;
  dueAt?: string | null;
  paidAt?: unknown;
  createdAt?: unknown;
}

export interface SaasBillingSummary {
  period: string;
  mrrCents: number;
  activeLicenses: number;
  pastDue: number;
  suspended: number;
  invoices: {
    openCents: number;
    paidCents: number;
    openCount: number;
    paidCount: number;
  };
}

export interface UserDoc {
  id: string;
  name?: string;
  userName?: string;
  email: string;
  role: string;
  tenantId: string;
  active: boolean;
}

export interface BoxDoc {
  id: string;
  tenantId: string;
  userId: string;
  status: string;
  openedAt?: Timestamp;
  finalAmount?: number;
  totalExpenses?: number;
}

export interface SaleDoc {
  id: string;
  tenantId: string;
  amount?: number;
  clientId?: string;
  clientName?: string;
}

export interface CollectionDoc {
  id: string;
  tenantId: string;
  amount?: number;
  createdAt?: Timestamp;
}

export interface TenantMetrics {
  tenantId: string;
  tenantName: string;
  active: boolean;
  createdAt: Timestamp;
  plan: 'Free' | 'Pro' | 'Enterprise' | 'Completo';
  /** Unidade major (ex.: 199.00), já convertida de cents. */
  monthlyPrice: number;
  billingStatus: 'active' | 'past_due' | 'suspended';
  billingMethod: 'pix' | 'boleto' | 'contrato';
  totalUsers: number;
  totalClients: number;
  totalBoxes: number;
  openBoxes: number;
  closedBoxes: number;
  totalRecaudo: number;
  lastActivityAt: Timestamp | null;
  isActiveToday: boolean;
}

export type TerminalLogType = 'INFO' | 'SUCCESS' | 'WARN' | 'ALERT';

export interface TerminalLog {
  id: string;
  time: string;
  type: TerminalLogType;
  message: string;
}

export type SuperAdminMenu = 'overview' | 'tenants' | 'users' | 'plans' | 'logs';
export type TenantStatusFilter = 'all' | 'active' | 'inactive';
export type TenantSortBy = 'recaudo' | 'users' | 'name';
