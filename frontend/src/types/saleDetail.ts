export interface SaleDetailRecord {
  id: string;
  clientName: string;
  score?: string;
  unidade?: string;
  createdAt?: unknown;
  valor: string;
  interes?: string;
  saldoTotal: string;
  saldoPendiente: string;
  saldoTotalCents?: number;
  saldoPendienteCents?: number;
  status: string;
  idPreVenta?: string;
}

export interface SalePaymentRecord {
  id: string;
  date: string;
  amount: number;
  userName: string;
  status: string;
}
