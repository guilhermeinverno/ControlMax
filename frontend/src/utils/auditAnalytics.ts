import * as XLSX from 'xlsx';

/** Janela de análise relativa a `now`. */
export type AuditAnalyticsWindow = '7d' | '30d' | '90d';

export interface AuditAnalyticsRow {
  id: string;
  source: 'security_logs' | 'audit_logs';
  tenantId: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  status: string;
  entity: string;
  entityId: string;
  detail: string;
  changesCount: number;
  at: Date | null;
}

export interface CountBucket {
  key: string;
  label: string;
  count: number;
}

export interface AuditAnalyticsResult {
  window: AuditAnalyticsWindow;
  cutoff: Date;
  sampleSize: number;
  filtered: AuditAnalyticsRow[];
  total: number;
  securityCount: number;
  auditCount: number;
  deniedCount: number;
  reversalOverrideCount: number;
  byAction: CountBucket[];
  byUser: CountBucket[];
  byDay: CountBucket[];
  byEntity: CountBucket[];
}

const WINDOW_DAYS: Record<AuditAnalyticsWindow, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

function startOfUtcDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function userLabel(row: AuditAnalyticsRow): string {
  const email = row.userEmail?.trim();
  if (email) return email;
  const name = row.userName?.trim();
  if (name) return name;
  const id = row.userId?.trim();
  if (id) return id;
  return '(sem usuário)';
}

function userKey(row: AuditAnalyticsRow): string {
  return row.userEmail?.trim() || row.userId?.trim() || row.userName?.trim() || '(unknown)';
}

function sortBucketsDesc(buckets: Map<string, CountBucket>): CountBucket[] {
  return [...buckets.values()].sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

/** Cutoff inclusivo: eventos com `at >= cutoff` entram na janela. */
export function cutoffForWindow(window: AuditAnalyticsWindow, now: Date = new Date()): Date {
  const days = WINDOW_DAYS[window];
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

export function filterRowsByWindow(
  rows: AuditAnalyticsRow[],
  window: AuditAnalyticsWindow,
  now: Date = new Date()
): { cutoff: Date; filtered: AuditAnalyticsRow[] } {
  const cutoff = cutoffForWindow(window, now);
  const filtered = rows.filter((r) => r.at != null && r.at.getTime() >= cutoff.getTime());
  return { cutoff, filtered };
}

/**
 * Agrega linhas unificadas de auditoria (client-side).
 * `topN` limita tabelas por usuário/ação/entidade (byDay sem corte).
 */
export function aggregateAuditLogs(
  rows: AuditAnalyticsRow[],
  window: AuditAnalyticsWindow,
  options?: { now?: Date; topN?: number }
): AuditAnalyticsResult {
  const now = options?.now ?? new Date();
  const topN = options?.topN ?? 15;
  const { cutoff, filtered } = filterRowsByWindow(rows, window, now);

  const byActionMap = new Map<string, CountBucket>();
  const byUserMap = new Map<string, CountBucket>();
  const byDayMap = new Map<string, CountBucket>();
  const byEntityMap = new Map<string, CountBucket>();

  let securityCount = 0;
  let auditCount = 0;
  let deniedCount = 0;
  let reversalOverrideCount = 0;

  for (const row of filtered) {
    if (row.source === 'security_logs') securityCount += 1;
    else auditCount += 1;

    const status = String(row.status || '').toUpperCase();
    if (status === 'DENIED' || status === 'FAIL') deniedCount += 1;

    const actionUpper = String(row.action || '').toUpperCase();
    if (actionUpper === 'REVERSAL' || actionUpper === 'OVERRIDE' || actionUpper.includes('REVERSAL')) {
      reversalOverrideCount += 1;
    }

    const actionKey = row.action || '(sem ação)';
    const actionBucket = byActionMap.get(actionKey) || { key: actionKey, label: actionKey, count: 0 };
    actionBucket.count += 1;
    byActionMap.set(actionKey, actionBucket);

    const uKey = userKey(row);
    const uBucket = byUserMap.get(uKey) || { key: uKey, label: userLabel(row), count: 0 };
    uBucket.count += 1;
    byUserMap.set(uKey, uBucket);

    const day = row.at ? startOfUtcDay(row.at) : '(sem data)';
    const dayBucket = byDayMap.get(day) || { key: day, label: day, count: 0 };
    dayBucket.count += 1;
    byDayMap.set(day, dayBucket);

    const entityKey = row.entity || '(sem entidade)';
    const entityBucket = byEntityMap.get(entityKey) || { key: entityKey, label: entityKey, count: 0 };
    entityBucket.count += 1;
    byEntityMap.set(entityKey, entityBucket);
  }

  const byDay = sortBucketsDesc(byDayMap).sort((a, b) => a.key.localeCompare(b.key));

  return {
    window,
    cutoff,
    sampleSize: rows.length,
    filtered,
    total: filtered.length,
    securityCount,
    auditCount,
    deniedCount,
    reversalOverrideCount,
    byAction: sortBucketsDesc(byActionMap).slice(0, topN),
    byUser: sortBucketsDesc(byUserMap).slice(0, topN),
    byDay,
    byEntity: sortBucketsDesc(byEntityMap).slice(0, topN),
  };
}

export function exportAuditAnalyticsXlsx(
  result: AuditAnalyticsResult,
  fileName?: string
): void {
  const wb = XLSX.utils.book_new();

  const resumo = [
    ['Janela', result.window],
    ['Cutoff (ISO)', result.cutoff.toISOString()],
    ['Amostra bruta (listeners)', result.sampleSize],
    ['Eventos no período', result.total],
    ['Security', result.securityCount],
    ['Audit', result.auditCount],
    ['DENIED/FAIL', result.deniedCount],
    ['REVERSAL/OVERRIDE', result.reversalOverrideCount],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumo), 'Resumo');

  const porUsuario = [
    ['Usuário', 'Chave', 'Contagem'],
    ...result.byUser.map((b) => [b.label, b.key, b.count]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(porUsuario), 'Por_Usuario');

  const porAcao = [
    ['Ação', 'Contagem'],
    ...result.byAction.map((b) => [b.label, b.count]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(porAcao), 'Por_Acao');

  const detalhe = [
    [
      'Data',
      'Fonte',
      'Usuário',
      'UserId',
      'Ação',
      'Status',
      'Entidade',
      'EntityId',
      'Detalhe',
      'Changes',
    ],
    ...result.filtered.map((r) => [
      r.at ? r.at.toISOString() : '',
      r.source,
      userLabel(r),
      r.userId,
      r.action,
      r.status,
      r.entity,
      r.entityId,
      r.detail,
      r.changesCount,
    ]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(detalhe), 'Detalhe');

  const name =
    fileName ||
    `ControlMax_Audit_Analytics_${result.window}_${startOfUtcDay(new Date())}.xlsx`;
  XLSX.writeFile(wb, name);
}
