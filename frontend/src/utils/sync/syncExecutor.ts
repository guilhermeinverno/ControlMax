// src/utils/sync/syncExecutor.ts

import { SyncManager, SyncTransaction, SyncStatus, OperationType } from "../syncManager";
import { OperationRegistry } from "./operationRegistry";
import { OperationHandler } from "../operationHandler";
import { SyncHttpClient } from "./syncHttpClient";

/**
 * Core executor that processes pending SyncTransactions.
 * It is completely generic – the concrete business logic is provided
 * by the registered OperationHandler implementations.
 */
export class SyncExecutor {
  constructor(
    private readonly registry: OperationRegistry,
    private readonly httpClient: SyncHttpClient
  ) {}

  private isNetworkError(err: unknown): boolean {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return true;
    }
    if (err instanceof Error) {
      const msg = err.message.toLowerCase();
      return (
        msg.includes('failed to fetch') ||
        msg.includes('networkerror') ||
        msg.includes('network error') ||
        msg.includes('abort') ||
        err.name === 'AbortError'
      );
    }
    return false;
  }

  /** Process the next pending transaction, if any. */
  async processNext(): Promise<void> {
    // If browser is explicitly offline, don't attempt network calls
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return;
    }

    const tx = await SyncManager.dequeue<unknown>();
    if (!tx) {
      return;
    }

    const handler = this.registry.get<unknown, unknown>(tx.operationType as OperationType);
    if (!handler) {
      await SyncManager.markFailed(
        tx.id,
        `No handler registered for operation type '${tx.operationType}'`
      );
      return;
    }

    try {
      await handler.execute(tx.payload);
      await SyncManager.markSynced(tx.id);
    } catch (err) {
      if (this.isNetworkError(err)) {
        console.warn(`[SyncExecutor] Falha temporária de rede detectada para transação ${tx.id}. Mantendo como PENDING para tentar quando online.`);
        await SyncManager.resetToPending(tx.id);
      } else {
        const message = err instanceof Error ? err.message : String(err);
        await SyncManager.markFailed(tx.id, message);
      }
    }
  }

  /** Process all pending transactions sequentially. */
  async processAll(): Promise<void> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return;
    }

    while (true) {
      const tx = await SyncManager.dequeue<unknown>();
      if (!tx) break;
      const handler = this.registry.get<unknown, unknown>(tx.operationType as OperationType);
      if (!handler) {
        await SyncManager.markFailed(
          tx.id,
          `No handler registered for operation type '${tx.operationType}'`
        );
        continue;
      }
      try {
        await handler.execute(tx.payload);
        await SyncManager.markSynced(tx.id);
      } catch (err) {
        if (this.isNetworkError(err)) {
          console.warn(`[SyncExecutor] Falha temporária de rede detectada para transação ${tx.id}. Mantendo como PENDING.`);
          await SyncManager.resetToPending(tx.id);
          // Stop processing queue when network fails
          break;
        } else {
          const message = err instanceof Error ? err.message : String(err);
          await SyncManager.markFailed(tx.id, message);
        }
      }
    }
  }
}
