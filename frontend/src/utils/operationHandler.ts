export interface OperationHandler<Payload, Result> {
  /**
   * Execute the operation with the given payload.
   * Must resolve with a result of type `Result` or reject with an error.
   */
  execute(payload: Payload): Promise<Result>;
}
