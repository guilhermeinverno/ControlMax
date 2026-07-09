export type {
  BusinessCenter,
  BusinessCenterUnit,
  CustomerAddress,
  CustomerPhone,
  CustomerReference,
  CustomerSaleRow,
  CustomerPaymentRow,
} from './company';

export interface RouteOption {
  id: string;
  name: string;
  code?: string;
  cnId?: string;
}

export interface OpenBoxOption {
  id: string;
  userId?: string;
  userName?: string;
  unitId?: string;
  unitName?: string;
  cnId?: string;
  cnName?: string;
}

export interface SaleOption {
  id: string;
  clientId?: string;
  clientName?: string;
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  userName: string;
  paymentMethod: string;
  comment: string;
  clientName: string;
  status: string;
}

/** Verifica permissão administrativa (admin ou superadmin via flag). */
export function hasAdminAccess(role: string, isSuperAdmin: boolean): boolean {
  return role === 'admin' || isSuperAdmin;
}
