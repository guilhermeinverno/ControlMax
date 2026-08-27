// src/utils/sync/syncExecutor.ts

import { SyncManager, OperationType } from "../syncManager";
import { OperationRegistry } from "./operationRegistry";
import { SyncHttpClient } from "./syncHttpClient";
import { isRetryableSyncError, MAX_SYNC_RETRIES } from "./syncRetry";

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
    if (typeof navigator !== "undefined" && !navigator.onLine) {
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
      await this.handleFailure(tx.id, tx.retryCount, err);
    }
  }

  /** Process all pending transactions sequentially. */
  async processAll(): Promise<void> {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
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
        const retryable = await this.handleFailure(tx.id, tx.retryCount, err);
        // Para a fila em erro de rede/5xx para não martelar sem conectividade
        if (retryable) break;
      }
    }
  }

  /**
   * @returns true se a tx voltou para PENDING (retryável).
   */
  private async handleFailure(
    txId: string,
    retryCount: number,
    err: unknown
  ): Promise<boolean> {
    const message = err instanceof Error ? err.message : String(err);

    if (!isRetryableSyncError(err)) {
      await SyncManager.markFailed(txId, message);
      return false;
    }

    if (retryCount >= MAX_SYNC_RETRIES) {
      await SyncManager.markFailed(
        txId,
        `Máximo de tentativas (${MAX_SYNC_RETRIES}) excedido: ${message}`
      );
      return false;
    }

    console.warn(
      `[SyncExecutor] Falha temporária para ${txId} (retry ${retryCount + 1}/${MAX_SYNC_RETRIES}): ${message}`
    );
    await SyncManager.resetToPending(txId, message);
    return true;
  }
}
