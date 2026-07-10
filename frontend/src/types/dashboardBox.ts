import { Timestamp } from 'firebase/firestore';

export interface DashboardBoxRecord {
  id: string;
  unitId: string;
  unitName: string;
  cnId: string;
  cnName: string;
  userId: string;
  userName: string;
  status: 'open' | 'closed' | 'confirmed';
  openedAt: Timestamp | null;
  closedAt: Timestamp | null;
  confirmedAt: Timestamp | null;
  initialAmount: number;
  finalAmount: number;
}
