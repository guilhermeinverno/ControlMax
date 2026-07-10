import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { BoxDoc, CollectionDoc, SaleDoc, TenantDoc, UserDoc } from '../types/superAdmin';

export interface SuperAdminRawData {
  tenants: TenantDoc[];
  users: UserDoc[];
  boxes: BoxDoc[];
  sales: SaleDoc[];
  collections: CollectionDoc[];
}

export async function loadSuperAdminData(): Promise<SuperAdminRawData> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [tenantsSnap, usersSnap, boxesSnap, salesSnap, collectionsSnap] = await Promise.all([
    getDocs(collection(db, 'tenants')),
    getDocs(collection(db, 'users')),
    getDocs(query(collection(db, 'boxes'), where('openedAt', '>=', Timestamp.fromDate(thirtyDaysAgo)))),
    getDocs(collection(db, 'sales')),
    getDocs(query(collection(db, 'collections'), where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo)))),
  ]);

  const tenants = tenantsSnap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name || '',
      active: data.active !== undefined ? data.active : true,
      createdAt: data.createdAt,
      plan: 'Completo' as const,
      monthlyPrice: data.monthlyPrice !== undefined ? data.monthlyPrice : 19900,
    };
  });

  const users = usersSnap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      email: data.email || '',
      name: data.name || '',
      userName: data.userName || '',
      role: data.role || 'collector',
      tenantId: data.tenantId || '',
      active: data.active !== undefined ? data.active : true,
    };
  });

  return {
    tenants,
    users,
    boxes: boxesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as BoxDoc)),
    sales: salesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as SaleDoc)),
    collections: collectionsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as CollectionDoc)),
  };
}
