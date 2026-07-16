import { Timestamp } from 'firebase/firestore';

export type Screen = 'dashboard' | 'statistics' | 'forms' | 'sales' | 'summary' | 'holidays' | 'edit-route' | 'route-list' | 'user-list' | 'device-list' | 'edit-device' | 'company-list' | 'sale-detail' | 'register-payment' | 'payment-history' | 'open-box' | 'close-box' | 'new-income' | 'new-expense' | 'performance' | 'box-summary' | 'transfer-sales' | 'mass-box-opening' | 'auto-keys' | 'credit-requests' | 'business-centers' | 'collection-cleaning' | 'period-summary' | 'superadmin' | 'bc-incomes' | 'bc-expenses' | 'bc-transfers' | 'bc-approvals' | 'bc-map' | 'insurance' | 'finance' | 'platform-management' | 'ai-assistant' | 'collector-map' | 'worker-profile';

export type UserRole = 'admin' | 'supervisor' | 'collector';

export interface Box {
  id: string;
  tenantId: string;
  unitId: string;
  unitName: string;
  cnId: string;
  cnName: string;
  userId: string;
  userName: string;
  status: 'open' | 'closed' | 'confirmed';
  openedAt: Timestamp;
  closedAt?: Timestamp;
  confirmedAt?: Timestamp;
  confirmedBy?: string;
  initialAmount: number;
  observation?: string;
  totalIncomes: number;
  totalExpenses: number;
  totalSales: number;
  totalCollections: number;
  totalTransfers: number;
  finalAmount: number;
}

export interface Sale {
  id: string;
  clientId: string;
  clientName: string;
  clientDoc: string;
  amount: number;
  balance: number;
  status: string;
  tenantId: string;
  idPreVenta?: string;
  saldoPendiente?: string;
  saldoPendienteCents?: number;
  installments?: number;
  installmentAmount?: number;
  paidInstallments?: number;
  unitName?: string;
  lateDays?: number;
  lastPaymentAt?: any;
  userId?: string;
}

export interface Device {
  id: string;
  tenantId: string;
  deviceName: string;
  deviceModel: string;
  deviceId: string;
  assignedUserId: string;
  assignedUserName: string;
  status: 'active' | 'inactive' | 'blocked';
  appVersion: string;
  lastSync: Timestamp | null;
  linkedAt: Timestamp | null;
  createdAt: Timestamp | null;
}

export interface AppUser {
  id: string;
  username: string;
  firstName?: string;
  lastName1?: string;
  role: string;
}

export interface Tenant {
  id: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  plan: string;
  billingStatus: string;
  createdAt: Timestamp;
}

export interface Route {
  id: string;
  tenantId: string;
  name: string;
  assignedUserId?: string;
  assignedUserName?: string;
  status?: string;
}

export interface Collection {
  id: string;
  tenantId: string;
  saleId: string;
  amount: number;
  date: Timestamp;
  collectedBy: string;
}

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox';
  required: boolean;
  options?: string[];
}

export interface FormDefinition {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  tenantId: string;
  createdBy: string;
  createdAt: Timestamp | null;
}

export interface FormResponse {
  id: string;
  formId: string;
  formTitle: string;
  answers: Record<string, unknown>;
  tenantId: string;
  submittedBy: string;
  createdAt: Timestamp | null;
}

