export interface ItemSalePayload {
  productId: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
}

/** Payload alinhado a POST /api/transactions/sale (venda a crédito / parcelas). */
export interface SalePayload {
  id: string;
  tenantId: string;
  boxId: string;
  customerId: string;
  clientName: string;
  amountCents: number;
  installmentAmountCents: number;
  totalInstallments: number;
  date: string;
  notes?: string;
  photoUrl?: string;
  photoName?: string;
  frequency?: string;
  /** @deprecated legado de carrinho; ignorado pelo BFF atual */
  items?: ItemSalePayload[];
  paymentMethod?: string;
  createdAt: string;
}

export interface SaleResponse {
  success: boolean;
  saleId: string;
  syncedAt?: string;
}

export interface PaymentPayload {
  id: string;
  tenantId: string;
  boxId: string;
  customerId: string;
  amountCents: number;
  paymentMethod: string;
  referenceSaleId?: string;
  comment?: string;
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
  /** Unidade operacional (contrato BFF `/api/boxes/open`). */
  unitId: string;
  unitName?: string;
  cnId: string;
  cnName?: string;
  initialAmount: number;
  observation?: string;
  date: string;
  openedAt?: string;
  /** @deprecated legado Sync; preferir unitId/cnId/date/initialAmount */
  boxId?: string;
  collectorId?: string;
  initialBalanceCents?: number;
}

export interface OpenBoxResponse {
  success: boolean;
  boxId: string;
  openedAt?: string;
  status?: string;
}

export interface CloseBoxPayload {
  id: string;
  tenantId: string;
  boxId: string;
  realFinalAmount: number;
  notes?: string;
  closedAt?: string;
  /** @deprecated legado Sync */
  collectorId?: string;
  finalBalanceCents?: number;
}

export interface CloseBoxResponse {
  success: boolean;
  boxId: string;
  closedAt: string;
  totalTransactions: number;
  status: string;
}
