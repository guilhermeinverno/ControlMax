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

  /** Process the next pending transaction, if any. */
  async processNext(): Promise<void> {
    // Dequeue the next PENDING transaction (FIFO) – status becomes SYNCING.
    const tx = await SyncManager.dequeue<unknown>();
    if (!tx) {
      // No pending work.
      return;
    }

    const handler = this.registry.get<unknown, unknown>(tx.operationType as OperationType);
    if (!handler) {
      // No handler registered – mark as FAILED with a clear message.
      await SyncManager.markFailed(
        tx.id,
        `No handler registered for operation type '${tx.operationType}'`
      );
      return;
    }

    try {
      // Delegate the actual work to the concrete handler.
      await handler.execute(tx.payload);
      // If the handler resolves, mark the transaction as SYNCED.
      await SyncManager.markSynced(tx.id);
    } catch (err) {
      // Any error leads to FAILED state with the error message.
      const message = err instanceof Error ? err.message : String(err);
      await SyncManager.markFailed(tx.id, message);
    }
  }

  /** Process all pending transactions sequentially. */
  async processAll(): Promise<void> {
    // Continue processing until dequeue returns undefined.
    // This loop is safe because each dequeue updates the status to SYNCING.
    // When no more PENDING transactions exist, dequeue returns undefined.
    // eslint-disable-next-line no-constant-condition
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
        const message = err instanceof Error ? err.message : String(err);
        await SyncManager.markFailed(tx.id, message);
      }
    }
  }
}
