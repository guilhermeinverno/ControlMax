import { describe, expect, it } from 'vitest';
import {
  aggregateAuditLogs,
  cutoffForWindow,
  filterRowsByWindow,
  type AuditAnalyticsRow,
} from '../utils/auditAnalytics';

function row(partial: Partial<AuditAnalyticsRow> & Pick<AuditAnalyticsRow, 'id' | 'at'>): AuditAnalyticsRow {
  return {
    source: 'audit_logs',
    tenantId: 't1',
    userId: 'u1',
    userName: 'User',
    userEmail: 'a@test.com',
    action: 'UPDATE',
    status: 'RECORDED',
    entity: 'boxes',
    entityId: 'b1',
    detail: '',
    changesCount: 0,
    ...partial,
  };
}

describe('ENT-08 auditAnalytics', () => {
  const now = new Date('2026-08-27T12:00:00.000Z');

  it('calcula cutoff por janela', () => {
    expect(cutoffForWindow('7d', now).toISOString()).toBe('2026-08-20T12:00:00.000Z');
    expect(cutoffForWindow('30d', now).toISOString()).toBe('2026-07-28T12:00:00.000Z');
    expect(cutoffForWindow('90d', now).toISOString()).toBe('2026-05-29T12:00:00.000Z');
  });

  it('filtra fora da janela e linhas sem data', () => {
    const rows = [
      row({ id: '1', at: new Date('2026-08-25T00:00:00.000Z') }),
      row({ id: '2', at: new Date('2026-07-01T00:00:00.000Z') }),
      row({ id: '3', at: null }),
    ];
    const { filtered } = filterRowsByWindow(rows, '7d', now);
    expect(filtered.map((r) => r.id)).toEqual(['1']);
  });

  it('agrega vazio sem erro', () => {
    const result = aggregateAuditLogs([], '7d', { now });
    expect(result.total).toBe(0);
    expect(result.byAction).toEqual([]);
    expect(result.byUser).toEqual([]);
    expect(result.byDay).toEqual([]);
  });

  it('agrega por ação, usuário, dia e flags', () => {
    const rows: AuditAnalyticsRow[] = [
      row({
        id: 'a1',
        at: new Date('2026-08-26T10:00:00.000Z'),
        action: 'REVERSAL',
        userEmail: 'ops@test.com',
        source: 'audit_logs',
      }),
      row({
        id: 'a2',
        at: new Date('2026-08-26T11:00:00.000Z'),
        action: 'UPDATE',
        userEmail: 'ops@test.com',
        entity: 'sales',
      }),
      row({
        id: 's1',
        at: new Date('2026-08-25T09:00:00.000Z'),
        source: 'security_logs',
        action: 'BOX_CONFIRM',
        status: 'DENIED',
        userEmail: 'sec@test.com',
        entity: 'security',
      }),
      row({
        id: 'old',
        at: new Date('2026-01-01T00:00:00.000Z'),
        action: 'OVERRIDE',
      }),
    ];

    const result = aggregateAuditLogs(rows, '7d', { now, topN: 10 });
    expect(result.sampleSize).toBe(4);
    expect(result.total).toBe(3);
    expect(result.securityCount).toBe(1);
    expect(result.auditCount).toBe(2);
    expect(result.deniedCount).toBe(1);
    expect(result.reversalOverrideCount).toBe(1);

    expect(result.byAction.find((b) => b.key === 'UPDATE')?.count).toBe(1);
    expect(result.byAction.find((b) => b.key === 'REVERSAL')?.count).toBe(1);
    expect(result.byUser.find((b) => b.key === 'ops@test.com')?.count).toBe(2);
    expect(result.byDay.map((d) => d.key)).toEqual(['2026-08-25', '2026-08-26']);
    expect(result.byEntity.find((b) => b.key === 'sales')?.count).toBe(1);
  });

  it('respeita topN em byUser', () => {
    const rows = Array.from({ length: 20 }, (_, i) =>
      row({
        id: `u${i}`,
        at: new Date('2026-08-26T00:00:00.000Z'),
        userEmail: `u${i}@t.com`,
        userId: `id${i}`,
      })
    );
    const result = aggregateAuditLogs(rows, '7d', { now, topN: 5 });
    expect(result.byUser).toHaveLength(5);
    expect(result.total).toBe(20);
  });
});
