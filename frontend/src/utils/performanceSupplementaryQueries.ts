import {
  collection,
  getDocs,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CollectionRecord, CreditRequestRecord } from '../hooks/usePerformanceData';

async function fetchTodayCollectionsWithFallback(
  tenantId: string,
  uid: string,
  startOfToday: Date
): Promise<CollectionRecord[]> {
  try {
    const colQuery = query(
      collection(db, 'collections'),
      where('tenantId', '==', tenantId),
      where('userId', '==', uid),
      where('createdAt', '>=', Timestamp.fromDate(startOfToday))
    );
    const colSnap = await getDocs(colQuery);
    return colSnap.docs.map(
      (docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as CollectionRecord
    );
  } catch (colErr) {
    console.warn('Primary collections query failed, trying index-free fallback...', colErr);
    const colSnapFallback = await getDocs(
      query(collection(db, 'collections'), where('tenantId', '==', tenantId))
    );
    const list: CollectionRecord[] = [];
    colSnapFallback.forEach((docSnap) => {
      const data = docSnap.data() as CollectionRecord;
      if (data.userId === uid && data.createdAt && data.createdAt.toDate() >= startOfToday) {
        list.push({ id: docSnap.id, ...data });
      }
    });
    return list;
  }
}

async function fetchTodayCreditRequestsWithFallback(
  tenantId: string,
  uid: string,
  startOfToday: Date
): Promise<CreditRequestRecord[]> {
  try {
    const reqQuery = query(
      collection(db, 'credit_requests'),
      where('tenantId', '==', tenantId),
      where('requestedById', '==', uid),
      where('createdAt', '>=', Timestamp.fromDate(startOfToday))
    );
    const reqSnap = await getDocs(reqQuery);
    return reqSnap.docs.map(
      (docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as CreditRequestRecord
    );
  } catch (reqErr) {
    console.warn('Primary credit requests query failed, trying index-free fallback...', reqErr);
    const reqSnapFallback = await getDocs(
      query(collection(db, 'credit_requests'), where('tenantId', '==', tenantId))
    );
    const list: CreditRequestRecord[] = [];
    reqSnapFallback.forEach((docSnap) => {
      const data = docSnap.data() as CreditRequestRecord;
      if (
        data.requestedById === uid &&
        data.createdAt &&
        data.createdAt.toDate() >= startOfToday
      ) {
        list.push({ id: docSnap.id, ...data });
      }
    });
    return list;
  }
}

export async function fetchTodayCollections(
  tenantId: string,
  uid: string,
  startOfToday: Date
): Promise<CollectionRecord[]> {
  return fetchTodayCollectionsWithFallback(tenantId, uid, startOfToday);
}

export async function fetchTodayCreditRequests(
  tenantId: string,
  uid: string,
  startOfToday: Date
): Promise<CreditRequestRecord[]> {
  return fetchTodayCreditRequestsWithFallback(tenantId, uid, startOfToday);
}
