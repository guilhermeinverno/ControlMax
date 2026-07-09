import { collection, getDocs, query, where, type QueryConstraint } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { isOnOrAfterToday } from './assistantDate';

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

async function fetchTenantDocs(
  collectionName: string,
  tenantId: string,
  isSuperAdmin: boolean,
  constraints: QueryConstraint[] = [],
): Promise<Record<string, unknown>[]> {
  const tenantConstraints = isSuperAdmin
    ? constraints
    : [where('tenantId', '==', tenantId), ...constraints];

  const snapshot = await getDocs(query(collection(db, collectionName), ...tenantConstraints));
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

function sumAmountCents(items: Record<string, unknown>[], field: string, fallbackField?: string): number {
  return items.reduce((sum, item) => {
    const primary = item[field] as number | undefined;
    const fallback = fallbackField ? (item[fallbackField] as number | undefined) : undefined;
    return sum + (primary ?? fallback ?? 0);
  }, 0);
}

function buildContextText(params: {
  tenantId: string;
  isSuperAdmin: boolean;
  collectors: Array<{ id: string; name: string }>;
  onRouteCollectors: Array<{ id: string; name: string }>;
  notOnRouteCollectors: Array<{ id: string; name: string }>;
  routes: Record<string, unknown>[];
  totalSalesToday: number;
  totalCollectedToday: number;
}): string {
  const activeRoutesText =
    params.routes
      .map((route) => `${route.name} (Atribuída a: ${route.assignedUserName || 'Ninguém'})`)
      .join('; ') || 'Nenhuma';

  const salesText = params.totalSalesToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const collectedText = params.totalCollectedToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  return `
--- CONTEXTO EM TEMPO REAL DO SISTEMA ---
TenantID sendo consultado: ${params.tenantId} (${params.isSuperAdmin ? 'SaaS Global' : 'Empresa Específica'})
Data/Hora Atual do Servidor: ${new Date().toLocaleString('pt-BR')}
Cobradores Ativos Cadastrados (Total ${params.collectors.length}): ${params.collectors.map((c) => c.name).join(', ') || 'Nenhum'}
Cobradores em Rota Hoje (Caixa Aberto Hoje) (Total ${params.onRouteCollectors.length}): ${params.onRouteCollectors.map((c) => c.name).join(', ') || 'Nenhum'}
Cobradores que ainda NÃO saíram para a rota hoje (Sem caixa aberto hoje) (Total ${params.notOnRouteCollectors.length}): ${params.notOnRouteCollectors.map((c) => c.name).join(', ') || 'Nenhum'}
Rotas Ativas Cadastradas: ${activeRoutesText}
Faturamento Hoje (Vendas): R$ ${salesText}
Total Cobrado Hoje (Recebimentos): R$ ${collectedText}
----------------------------------------`;
}

export async function getOperationalContext(tenantId: string): Promise<string> {
  try {
    const todayStart = startOfToday();
    const isSuperAdmin = tenantId === 'super_admin_tenant';

    const collectors = await fetchTenantDocs('users', tenantId, isSuperAdmin, [
      where('role', '==', 'collector'),
      where('active', '==', true),
    ]).then((items) =>
      items.map((item) => ({
        id: String(item.id),
        name: String(item.userName || item.name || item.username || 'Coletor'),
      })),
    );

    const openBoxes = (await fetchTenantDocs(
      'boxes',
      tenantId,
      isSuperAdmin,
      [where('status', '==', 'open')],
    )).filter((box) => isOnOrAfterToday(box.openedAt, todayStart));

    const routes = (await fetchTenantDocs('routes', tenantId, isSuperAdmin)).filter(
      (route) => route.active !== false,
    );

    const collectionsToday = (await fetchTenantDocs('collections', tenantId, isSuperAdmin)).filter(
      (item) => isOnOrAfterToday(item.createdAt, todayStart),
    );

    const salesToday = (await fetchTenantDocs('sales', tenantId, isSuperAdmin)).filter((item) =>
      isOnOrAfterToday(item.createdAt, todayStart),
    );

    const collectorIdsWithOpenBox = new Set(openBoxes.map((box) => box.userId));
    const onRouteCollectors = collectors.filter((collector) => collectorIdsWithOpenBox.has(collector.id));
    const notOnRouteCollectors = collectors.filter((collector) => !collectorIdsWithOpenBox.has(collector.id));

    const context = buildContextText({
      tenantId,
      isSuperAdmin,
      collectors,
      onRouteCollectors,
      notOnRouteCollectors,
      routes,
      totalSalesToday: sumAmountCents(salesToday, 'totalAmount', 'amount') / 100,
      totalCollectedToday: sumAmountCents(collectionsToday, 'amount') / 100,
    });

    console.log('GENERATED REAL-TIME AI OPERATIONAL CONTEXT:', context);
    return context;
  } catch (err) {
    console.error('Error fetching client-side operational context for assistant:', err);
    return '';
  }
}
