import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SyncManager, SyncStatus } from '../utils/syncManager';

async function clearSyncDb(): Promise<void> {
  const txs = await SyncManager.getAll();
  await Promise.all(txs.map((tx) => SyncManager.remove(tx.id)));
}

describe('ENT-05 SyncManager — fila e conflitos', () => {
  beforeEach(async () => {
    await clearSyncDb();
  });

  it('duplo enqueue cria duas transações PENDING distintas', async () => {
    const payload = { id: 'pay-same', amountCents: 1000 };
    const a = await SyncManager.enqueue('payment', payload, 't1', 'u1');
    const b = await SyncManager.enqueue('payment', payload, 't1', 'u1');

    expect(a.id).not.toBe(b.id);
    const all = await SyncManager.getAll();
    expect(all.filter((tx) => tx.status === SyncStatus.PENDING)).toHaveLength(2);
    // Dedupe financeiro permanece no BFF via payload.id / X-Idempotency-Key
    expect((a.payload as { id: string }).id).toBe('pay-same');
    expect((b.payload as { id: string }).id).toBe('pay-same');
  });

  it('dequeue promove um PENDING para SYNCING (FIFO)', async () => {
    const first = await SyncManager.enqueue('sale', { n: 1 }, 't1', 'u1');
    await new Promise((r) => setTimeout(r, 5));
    await SyncManager.enqueue('sale', { n: 2 }, 't1', 'u1');

    const dequeued = await SyncManager.dequeue();
    expect(dequeued?.id).toBe(first.id);
    expect(dequeued?.status).toBe(SyncStatus.SYNCING);

    const remaining = await SyncManager.getAll();
    const syncing = remaining.filter((tx) => tx.status === SyncStatus.SYNCING);
    const pending = remaining.filter((tx) => tx.status === SyncStatus.PENDING);
    expect(syncing).toHaveLength(1);
    expect(pending).toHaveLength(1);
  });

  it('resetToPending incrementa retryCount', async () => {
    const tx = await SyncManager.enqueue('openBox', { box: 1 }, 't1', 'u1');
    await SyncManager.dequeue();
    await SyncManager.resetToPending(tx.id, 'HTTP 500');

    const updated = (await SyncManager.getAll()).find((t) => t.id === tx.id);
    expect(updated?.status).toBe(SyncStatus.PENDING);
    expect(updated?.retryCount).toBe(1);
    expect(updated?.errorMessage).toBe('HTTP 500');
  });

  it('recoverStuckTransactions devolve SYNCING antigo para PENDING', async () => {
    const tx = await SyncManager.enqueue('closeBox', { box: 1 }, 't1', 'u1');
    const stuck = await SyncManager.dequeue();
    expect(stuck?.status).toBe(SyncStatus.SYNCING);

    await new Promise((r) => setTimeout(r, 5));
    await SyncManager.recoverStuckTransactions(0);

    const recovered = (await SyncManager.getAll()).find((t) => t.id === tx.id);
    expect(recovered?.status).toBe(SyncStatus.PENDING);
  });

  it('markSynced e markFailed alteram status', async () => {
    const ok = await SyncManager.enqueue('payment', { ok: true }, 't1', 'u1');
    const bad = await SyncManager.enqueue('payment', { ok: false }, 't1', 'u1');

    await SyncManager.markSynced(ok.id);
    await SyncManager.markFailed(bad.id, 'HTTP 409: Conflict');

    const all = await SyncManager.getAll();
    expect(all.find((t) => t.id === ok.id)?.status).toBe(SyncStatus.SYNCED);
    expect(all.find((t) => t.id === bad.id)?.status).toBe(SyncStatus.FAILED);
    expect(all.find((t) => t.id === bad.id)?.errorMessage).toContain('409');
  });
});
