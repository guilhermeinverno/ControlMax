import { Timestamp } from 'firebase/firestore';
import type {
  BoxDoc,
  CollectionDoc,
  SaleDoc,
  TenantDoc,
  TenantMetrics,
  TenantSortBy,
  TenantStatusFilter,
  UserDoc,
} from '../types/superAdmin';

export function buildTenantMetrics(
  tenants: TenantDoc[],
  users: UserDoc[],
  boxes: BoxDoc[],
  sales: SaleDoc[],
  collections: CollectionDoc[]
): TenantMetrics[] {
  const todayStr = new Date().toDateString();

  return tenants.map((tenant) => {
    const tenantUsers = users.filter((u) => u.tenantId === tenant.id);
    const tenantBoxes = boxes.filter((b) => b.tenantId === tenant.id);
    const tenantCollections = collections.filter((c) => c.tenantId === tenant.id);

    const openBoxes = tenantBoxes.filter((b) => b.status === 'open').length;
    const closedBoxes = tenantBoxes.filter((b) => b.status === 'closed' || b.status === 'confirmed').length;
    const totalRecaudo = tenantCollections.reduce((sum, col) => sum + (col.amount || 0), 0);

    let lastActivityAt: Timestamp | null = null;
    let isActiveToday = false;

    for (const box of tenantBoxes) {
      if (!box.openedAt) continue;
      if (!lastActivityAt || box.openedAt.seconds > lastActivityAt.seconds) {
        lastActivityAt = box.openedAt;
      }
      if (box.openedAt.toDate().toDateString() === todayStr) {
        isActiveToday = true;
      }
    }

    return {
      tenantId: tenant.id,
      tenantName: tenant.name,
      active: tenant.active,
      createdAt: tenant.createdAt || Timestamp.now(),
      plan: tenant.plan || 'Completo',
      monthlyPrice: tenant.monthlyPrice !== undefined ? tenant.monthlyPrice / 100 : 199,
      totalUsers: tenantUsers.length,
      totalClients: sales.filter((s) => s.tenantId === tenant.id && s.clientId).length,
      totalBoxes: tenantBoxes.length,
      openBoxes,
      closedBoxes,
      totalRecaudo,
      lastActivityAt,
      isActiveToday,
    };
  });
}

export function filterAndSortTenants(
  processedTenants: TenantMetrics[],
  searchQuery: string,
  statusFilter: TenantStatusFilter,
  sortBy: TenantSortBy
): TenantMetrics[] {
  const query = searchQuery.toLowerCase();

  return processedTenants
    .filter((t) => {
      const matchesSearch =
        t.tenantName.toLowerCase().includes(query) || t.tenantId.toLowerCase().includes(query);
      if (statusFilter === 'active') return matchesSearch && t.active;
      if (statusFilter === 'inactive') return matchesSearch && !t.active;
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'users':
          return b.totalUsers - a.totalUsers;
        case 'name':
          return a.tenantName.localeCompare(b.tenantName);
        default:
          return b.totalRecaudo - a.totalRecaudo;
      }
    });
}

export function computeSuperAdminKpis(
  processedTenants: TenantMetrics[],
  users: UserDoc[],
  collections: CollectionDoc[]
) {
  const activeTenantsCount = processedTenants.filter((t) => t.active).length;
  const mrrEstimated = processedTenants.filter((t) => t.active).reduce((sum, t) => sum + t.monthlyPrice, 0);
  const totalGlobalUsers = users.length;
  const totalGlobalRecaudoVolume = collections.reduce((sum, col) => sum + (col.amount || 0), 0);

  return { activeTenantsCount, mrrEstimated, totalGlobalUsers, totalGlobalRecaudoVolume };
}
