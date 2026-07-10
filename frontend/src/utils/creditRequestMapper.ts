import { Timestamp } from 'firebase/firestore';

export interface CreditRequest {
  id: string;
  tenantId: string;
  clientId: string;
  clientName: string;
  clientDoc: string;
  amount: number;
  requestedBy: string;
  requestedById: string;
  status: string;
  score: number;
  currentBalance: number;
  observations: string;
  createdAt: Timestamp | null;
  reviewedAt: Timestamp | null;
  reviewedBy: string;
  reviewedById: string;
  historyLogs: unknown[];
}

function readCreditRequestClientFields(data: Record<string, unknown>) {
  return {
    tenantId: String(data.tenantId || ''),
    clientId: String(data.clientId || ''),
    clientName: String(data.clientName || ''),
    clientDoc: String(data.clientDoc || ''),
  };
}

function readCreditRequestRequestFields(data: Record<string, unknown>) {
  return {
    amount: Number(data.amount || 0),
    requestedBy: String(data.requestedBy || ''),
    requestedById: String(data.requestedById || ''),
    status: String(data.status || 'pending'),
    score: Number(data.score || 0),
    currentBalance: Number(data.currentBalance || 0),
    observations: String(data.observations || ''),
  };
}

function readCreditRequestReviewFields(data: Record<string, unknown>) {
  return {
    createdAt: (data.createdAt as Timestamp) || null,
    reviewedAt: (data.reviewedAt as Timestamp) || null,
    reviewedBy: String(data.reviewedBy || ''),
    reviewedById: String(data.reviewedById || ''),
    historyLogs: Array.isArray(data.historyLogs) ? data.historyLogs : [],
  };
}

export function mapCreditRequestDoc(
  docSnap: { id: string; data: () => Record<string, unknown> }
): CreditRequest {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...readCreditRequestClientFields(data),
    ...readCreditRequestRequestFields(data),
    ...readCreditRequestReviewFields(data),
  };
}

export function sortCreditRequestsByDate(items: CreditRequest[]): CreditRequest[] {
  return [...items].sort((a, b) => {
    const timeA = a.createdAt?.seconds || 0;
    const timeB = b.createdAt?.seconds || 0;
    return timeB - timeA;
  });
}
