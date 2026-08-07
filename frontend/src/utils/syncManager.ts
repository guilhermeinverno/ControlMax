// src/utils/syncManager.ts
// Sync Manager infrastructure (Fase 1) – offline queue using IndexedDB.
// No UI integration, no Service Worker, no retry logic.

import { createTransactionStore, openDatabase } from "./indexedDB";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export enum SyncStatus {
  PENDING = "PENDING",
  SYNCING = "SYNCING",
  SYNCED = "SYNCED",
  FAILED = "FAILED",
}

export type OperationType =
  | "openBox"
  | "closeBox"
  | "sale"
  | "payment"
  | "adjustment"
  | "reversal";

export interface SyncTransaction<P = unknown> {
  // Unique identifier (also used as idempotencyKey)
  id: string;
  tenantId: string;
  userId: string;
  idempotencyKey: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  retryCount: number;
  status: SyncStatus;
  operationType: OperationType;
  payload: P; // Data sent to BFF
  errorMessage?: string; // Optional error description on failure
}

// ---------------------------------------------------------------------------
// SyncManager – static singleton handling the queue
// ---------------------------------------------------------------------------
export class SyncManager {
  private static store = createTransactionStore<SyncTransaction>();

  /** Enqueue a new operation. Caller provides tenantId and userId. */
  public static async enqueue<P = unknown>(
    operationType: OperationType,
    payload: P,
    tenantId: string,
    userId: string
  ): Promise<SyncTransaction<P>> {
    const run = async () => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const transaction: SyncTransaction<P> = {
        id,
        tenantId,
        userId,
        idempotencyKey: id,
        createdAt: now,
        updatedAt: now,
        retryCount: 0,
        status: SyncStatus.PENDING,
        operationType,
        payload,
      };
      await this.store.add(transaction);
      console.log(`[SyncManager] Enqueued ${operationType} transaction:`, transaction);
      return transaction;
    };

    if (typeof navigator !== 'undefined' && 'locks' in navigator && navigator.locks) {
      return await navigator.locks.request('sync-manager', run);
    }
    return await run();
  }

  /** Retrieve all queued transactions (debug / tests). */
  public static async getAll(): Promise<SyncTransaction[]> {
    return this.store.getAll();
  }

  /** Dequeue the next PENDING transaction (FIFO). Returns undefined if none. */
  public static async dequeue<P = unknown>(): Promise<SyncTransaction<P> | undefined> {
    const run = async (): Promise<SyncTransaction<P> | undefined> => {
      const db = await openDatabase();
      return new Promise<SyncTransaction<P> | undefined>((resolve, reject) => {
        const tx = db.transaction('transactions', 'readwrite');
        const store = tx.objectStore('transactions');
        const index = store.index('createdAt');
        const cursorRequest = index.openCursor();
        cursorRequest.onsuccess = () => {
          const cursor = cursorRequest.result;
          if (!cursor) {
            resolve(undefined);
            return;
          }
          const record = cursor.value as SyncTransaction<P>;
          if (record.status === SyncStatus.PENDING) {
            const updated = { ...record, status: SyncStatus.SYNCING, updatedAt: new Date().toISOString() };
            const updateReq = cursor.update(updated);
            updateReq.onsuccess = () => resolve(updated);
            updateReq.onerror = () => reject(updateReq.error);
          } else {
            cursor.continue();
          }
        };
        cursorRequest.onerror = () => reject(cursorRequest.error);
      });
    };
    if (typeof navigator !== 'undefined' && 'locks' in navigator && navigator.locks) {
      return await navigator.locks.request('sync-manager', async () => await run());
    }
    return await run();
  }

  /** Remove a transaction permanently (after successful sync). */
  public static async remove(id: string): Promise<void> {
    await this.store.delete(id);
  }

  /** Mark transaction as SYNCING – internal use only. */
  private static async markSyncing(id: string): Promise<void> {
    const tx = await this.store.get(id);
    if (!tx) return;
    const updated = { ...tx, status: SyncStatus.SYNCING, updatedAt: new Date().toISOString() };
    await this.store.update(updated);
  }

  /** Mark transaction as SYNCED – after successful BFF call. */
  public static async markSynced(id: string): Promise<void> {
    const tx = await this.store.get(id);
    if (!tx) return;
    const updated = { ...tx, status: SyncStatus.SYNCED, updatedAt: new Date().toISOString() };
    await this.store.update(updated);
  }

  /** Mark transaction as FAILED – after an unrecoverable error. */
  public static async markFailed(id: string, errorMessage?: string): Promise<void> {
    const tx = await this.store.get(id);
    if (!tx) return;
    const updated = {
      ...tx,
      status: SyncStatus.FAILED,
      updatedAt: new Date().toISOString(),
      errorMessage,
    };
    await this.store.update(updated);
  }
  /** Recover transactions stuck in SYNCING state longer than timeoutMs (default 5 min). */
  public static async recoverStuckTransactions(timeoutMs: number = 5 * 60 * 1000): Promise<void> {
    const now = Date.now();
    const run = async () => {
      const db = await openDatabase();
      const tx = db.transaction('transactions', 'readwrite');
      const store = tx.objectStore('transactions');
      const index = store.index('status');
      const range = IDBKeyRange.only(SyncStatus.SYNCING);
      const cursorRequest = index.openCursor(range);
      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result;
        if (!cursor) return;
        const record = cursor.value as SyncTransaction<unknown>;
        const updatedAt = new Date(record.updatedAt).getTime();
        if (now - updatedAt > timeoutMs) {
          const recovered = { ...record, status: SyncStatus.PENDING, updatedAt: new Date().toISOString() };
          cursor.update(recovered);
        }
        cursor.continue();
      };
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    };
    if (typeof navigator !== 'undefined' && 'locks' in navigator && navigator.locks) {
      await navigator.locks.request('sync-manager', async () => await run());
    } else {
      await run();
    }
  }
}
