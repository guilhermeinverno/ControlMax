import { OperationHandler } from "../../operationHandler";
import { SyncHttpClient } from "../syncHttpClient";
import { HttpMethod } from "../httpMethod";
import { CloseBoxPayload, CloseBoxResponse } from "../../../types/syncPayloads";

export class CloseBoxExecutor implements OperationHandler<CloseBoxPayload, CloseBoxResponse> {
  constructor(private readonly httpClient: SyncHttpClient) {}

  async execute(payload: CloseBoxPayload): Promise<CloseBoxResponse> {
    if (!payload.tenantId) {
      throw new Error("Validation Error: tenantId is required");
    }
    if (!payload.boxId) {
      throw new Error("Validation Error: boxId is required");
    }
    const realFinalAmount = payload.realFinalAmount ?? payload.finalBalanceCents;
    if (realFinalAmount === undefined || realFinalAmount < 0) {
      throw new Error("Validation Error: realFinalAmount must be greater than or equal to 0");
    }

    return await this.httpClient.request<CloseBoxResponse, Record<string, unknown>>(
      HttpMethod.POST,
      "/api/boxes/close",
      {
        boxId: payload.boxId,
        realFinalAmount,
        idempotencyKey: payload.id,
      },
      {
        "X-Tenant-ID": payload.tenantId,
        "X-Idempotency-Key": payload.id,
      }
    );
  }
}
