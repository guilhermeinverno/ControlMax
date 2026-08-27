import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SyncManager, SyncStatus } from '../utils/syncManager';
import { SyncExecutor } from '../utils/sync/syncExecutor';
import { OperationRegistry } from '../utils/sync/operationRegistry';
import { SyncHttpClient } from '../utils/sync/syncHttpClient';
import { MAX_SYNC_RETRIES } from '../utils/sync/syncRetry';

async function clearSyncDb(): Promise<void> {
  const txs = await SyncManager.getAll();
  await Promise.all(txs.map((tx) => SyncManager.remove(tx.id)));
}

function setOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', {
    configurable: true,
    get: () => value,
  });
}

describe('ENT-05 SyncExecutor — offline, 5xx retry, conflitos', () => {
  let registry: OperationRegistry;
  let executor: SyncExecutor;
  let executeMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    await clearSyncDb();
    setOnline(true);
    registry = new OperationRegistry();
    executeMock = vi.fn(async (_payload: unknown) => undefined);
    registry.register('payment', {
      execute: executeMock as (payload: unknown) => Promise<unknown>,
    });
    executor = new SyncExecutor(registry, {} as SyncHttpClient);
  });

  it('offline: processAll não drena a fila (txs permanecem PENDING)', async () => {
    await SyncManager.enqueue('payment', { id: 'p1' }, 't1', 'u1');
    setOnline(false);

    await executor.processAll();

    expect(executeMock).not.toHaveBeenCalled();
    const pending = (await SyncManager.getAll()).filter((t) => t.status === SyncStatus.PENDING);
    expect(pending).toHaveLength(1);
  });

  it('offline→online: processAll sincroniza PENDING → SYNCED', async () => {
    await SyncManager.enqueue('payment', { id: 'p-offline' }, 't1', 'u1');
    setOnline(false);
    await executor.processAll();
    expect(executeMock).not.toHaveBeenCalled();

    setOnline(true);
    executeMock.mockResolvedValue({ success: true });
    await executor.processAll();

    expect(executeMock).toHaveBeenCalledTimes(1);
    const synced = (await SyncManager.getAll()).filter((t) => t.status === SyncStatus.SYNCED);
    expect(synced).toHaveLength(1);
  });

  it('Failed to fetch → volta para PENDING e incrementa retryCount', async () => {
    const tx = await SyncManager.enqueue('payment', { id: 'p-net' }, 't1', 'u1');
    executeMock.mockRejectedValue(new Error('Failed to fetch'));

    await executor.processNext();

    const updated = (await SyncManager.getAll()).find((t) => t.id === tx.id);
    expect(updated?.status).toBe(SyncStatus.PENDING);
    expect(updated?.retryCount).toBe(1);
  });

  it('HTTP 500 → retryável (PENDING + retryCount)', async () => {
    const tx = await SyncManager.enqueue('payment', { id: 'p-500' }, 't1', 'u1');
    executeMock.mockRejectedValue(new Error('HTTP 500: Server Error'));

    await executor.processNext();

    const updated = (await SyncManager.getAll()).find((t) => t.id === tx.id);
    expect(updated?.status).toBe(SyncStatus.PENDING);
    expect(updated?.retryCount).toBe(1);
  });

  it('HTTP 409 conflito → FAILED definitivo (não retry)', async () => {
    const tx = await SyncManager.enqueue('payment', { id: 'p-409' }, 't1', 'u1');
    executeMock.mockRejectedValue(new Error('HTTP 409: Conflict'));

    await executor.processNext();

    const updated = (await SyncManager.getAll()).find((t) => t.id === tx.id);
    expect(updated?.status).toBe(SyncStatus.FAILED);
    expect(updated?.errorMessage).toContain('409');
  });

  it('após MAX_SYNC_RETRIES falhas 5xx → FAILED', async () => {
    const tx = await SyncManager.enqueue('payment', { id: 'p-max' }, 't1', 'u1');
    executeMock.mockRejectedValue(new Error('HTTP 503: Unavailable'));

    for (let i = 0; i <= MAX_SYNC_RETRIES; i++) {
      await executor.processNext();
    }

    const updated = (await SyncManager.getAll()).find((t) => t.id === tx.id);
    expect(updated?.status).toBe(SyncStatus.FAILED);
    expect(updated?.errorMessage).toMatch(/Máximo de tentativas/i);
  });

  it('handler ausente → FAILED', async () => {
    const emptyRegistry = new OperationRegistry();
    const emptyExecutor = new SyncExecutor(emptyRegistry, {} as SyncHttpClient);
    const tx = await SyncManager.enqueue('sale', { id: 's1' }, 't1', 'u1');

    await emptyExecutor.processNext();

    const updated = (await SyncManager.getAll()).find((t) => t.id === tx.id);
    expect(updated?.status).toBe(SyncStatus.FAILED);
    expect(updated?.errorMessage).toMatch(/No handler/i);
  });

  it('duplo enqueue + processAll: duas execuções (dedupe no BFF via payload.id)', async () => {
    const payload = { id: 'same-idempotency-key', amountCents: 500 };
    await SyncManager.enqueue('payment', payload, 't1', 'u1');
    await SyncManager.enqueue('payment', payload, 't1', 'u1');
    executeMock.mockResolvedValue({ success: true });

    await executor.processAll();

    expect(executeMock).toHaveBeenCalledTimes(2);
    expect(executeMock.mock.calls[0][0]).toEqual(payload);
    expect(executeMock.mock.calls[1][0]).toEqual(payload);
    const synced = (await SyncManager.getAll()).filter((t) => t.status === SyncStatus.SYNCED);
    expect(synced).toHaveLength(2);
  });
});
