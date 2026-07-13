import { auth } from '../lib/firebase';
import { Box } from '../types';
import { subscribeTodayBox } from '../utils/performanceBoxSubscription';
import {
  fetchTodayCollections,
  fetchTodayCreditRequests,
} from '../utils/performanceSupplementaryQueries';

export interface CollectionRecord {
  id: string;
  amount: number;
  status: string;
  tenantId: string;
  userId: string;
  createdAt: import('firebase/firestore').Timestamp;
}

export interface CreditRequestRecord {
  id: string;
  status: 'pending' | 'rejected' | 'approved' | string;
  tenantId: string;
  requestedById: string;
  createdAt: import('firebase/firestore').Timestamp;
}

function getStartOfToday(): Date {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
}

export async function loadPerformanceSupplementaryData(tenantId: string) {
  const startOfToday = getStartOfToday();
  const uid = auth.currentUser?.uid || 'test-user-id';

  const [collections, creditRequests] = await Promise.all([
    fetchTodayCollections(tenantId, uid, startOfToday),
    fetchTodayCreditRequests(tenantId, uid, startOfToday),
  ]);

  return { collections, creditRequests };
}

export function subscribePerformanceData(
  tenantId: string,
  onBox: (box: Box | null) => void,
  onSupplementary: (data: {
    collections: CollectionRecord[];
    creditRequests: CreditRequestRecord[];
  }) => void,
  onLoadingChange: (loading: boolean) => void
) {
  const startOfToday = getStartOfToday();
  const uid = auth.currentUser?.uid || 'test-user-id';

  onLoadingChange(true);

  const unsubscribeBox = subscribeTodayBox(tenantId, uid, startOfToday, onBox);

  loadPerformanceSupplementaryData(tenantId)
    .then(onSupplementary)
    .catch((err) => console.error('General error fetching supplementary performance data:', err))
    .finally(() => onLoadingChange(false));

  return unsubscribeBox;
}
