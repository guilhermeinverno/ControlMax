import { Timestamp } from 'firebase/firestore';

export interface BoxRecord {
  id: string;
  unitId: string;
  unitName: string;
  cnId: string;
  cnName: string;
  userId: string;
  userName: string;
  status: string;
  openedAt: Timestamp | null;
  closedAt: Timestamp | null;
  confirmedAt: Timestamp | null;
  initialAmount: number;
  finalAmount: number;
}

export function mapBoxRecord(
  doc: { id: string; data: () => Record<string, unknown> }
): BoxRecord {
  const d = doc.data();
  return {
    id: doc.id,
    unitId: String(d.unitId || ''),
    unitName: String(d.unitName || ''),
    cnId: String(d.cnId || ''),
    cnName: String(d.cnName || ''),
    userId: String(d.userId || ''),
    userName: String(d.userName || ''),
    status: String(d.status || 'open'),
    openedAt: (d.openedAt as Timestamp) || null,
    closedAt: (d.closedAt as Timestamp) || null,
    confirmedAt: (d.confirmedAt as Timestamp) || null,
    initialAmount: Number(d.initialAmount || 0),
    finalAmount: Number(d.finalAmount || 0),
  };
}

export function sortBoxesByOpenedAtDesc(list: BoxRecord[]): BoxRecord[] {
  return [...list].sort((a, b) => {
    const tA = a.openedAt?.toDate().getTime() || 0;
    const tB = b.openedAt?.toDate().getTime() || 0;
    return tB - tA;
  });
}
