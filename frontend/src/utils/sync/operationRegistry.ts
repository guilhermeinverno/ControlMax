// src/utils/sync/operationRegistry.ts

import { OperationType } from "../syncManager";
import { OperationHandler } from "../operationHandler";

/**
 * Registry that holds a mapping from an operation type to its concrete handler.
 * Allows dynamic registration at runtime without modifying the core executor.
 */
export class OperationRegistry {
  private handlers = new Map<OperationType, OperationHandler<unknown, unknown>>();

  /** Register a handler for a specific operation type. */
  register<P, R>(operation: OperationType, handler: OperationHandler<P, R>): void {
    this.handlers.set(operation, handler as OperationHandler<unknown, unknown>);
  }

  /** Retrieve the handler for the given operation type, or undefined if none. */
  get<P, R>(operation: OperationType): OperationHandler<P, R> | undefined {
    return this.handlers.get(operation) as OperationHandler<P, R> | undefined;
  }
}
