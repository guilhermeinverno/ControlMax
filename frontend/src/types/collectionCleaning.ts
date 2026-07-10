import { Timestamp } from 'firebase/firestore';

export interface CleaningCollection {
  id: string;
  tenantId: string;
  boxId: string;
  userId: string;
  userName: string;
  clientId: string;
  clientName: string;
  saleId: string;
  amount: number;
  type: 'collection';
  status: 'active' | 'cancelled' | 'duplicate';
  cancelReason?: string;
  cancelledBy?: string;
  cancelledAt?: Timestamp;
  createdAt: Timestamp;
}

export type CollectionStatusFilter = 'all' | 'active' | 'cancelled' | 'duplicate';

export function todayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
