export interface ItemSalePayload {
  productId: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
}

export interface SalePayload {
  id: string;
  tenantId: string;
  boxId: string;
  customerId: string;
  items: ItemSalePayload[];
  totalCents: number;
  paymentMethod: string;
  createdAt: string;
}

export interface SaleResponse {
  success: boolean;
  saleId: string;
  syncedAt: string;
}

export interface PaymentPayload {
  id: string;
  tenantId: string;
  boxId: string;
  customerId: string;
  amountCents: number;
  paymentMethod: string;
  referenceSaleId?: string;
  createdAt: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  newBalanceCents: number;
  syncedAt: string;
}

export interface OpenBoxPayload {
  id: string;
  tenantId: string;
  boxId: string;
  collectorId: string;
  initialBalanceCents: number;
  openedAt: string;
}

export interface OpenBoxResponse {
  success: boolean;
  boxId: string;
  openedAt: string;
  status: string;
}

export interface CloseBoxPayload {
  id: string;
  tenantId: string;
  boxId: string;
  collectorId: string;
  finalBalanceCents: number;
  notes?: string;
  closedAt: string;
}

export interface CloseBoxResponse {
  success: boolean;
  boxId: string;
  closedAt: string;
  totalTransactions: number;
  status: string;
}
