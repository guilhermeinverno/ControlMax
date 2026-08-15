import { OperationHandler } from "../../operationHandler";
import { SyncHttpClient } from "../syncHttpClient";
import { HttpMethod } from "../httpMethod";
import { CloseBoxPayload, CloseBoxResponse } from "../../../types/syncPayloads";

export class CloseBoxExecutor implements OperationHandler<CloseBoxPayload, CloseBoxResponse> {
  constructor(private readonly httpClient: SyncHttpClient) {}

  async execute(payload: CloseBoxPayload): Promise<CloseBoxResponse> {
    // Validações defensivas
    if (!payload.tenantId) {
      throw new Error("Validation Error: tenantId is required");
    }
    if (!payload.boxId) {
      throw new Error("Validation Error: boxId is required");
    }
    if (!payload.collectorId) {
      throw new Error("Validation Error: collectorId is required");
    }
    if (payload.finalBalanceCents < 0) {
      throw new Error("Validation Error: finalBalanceCents must be greater than or equal to 0");
    }

    // Chamada BFF
    return await this.httpClient.request<CloseBoxResponse, any>(
      HttpMethod.POST,
      "/api/boxes/close",
      {
        ...payload,
        idempotencyKey: payload.id,
      },
      {
        "X-Tenant-ID": payload.tenantId,
        "X-Idempotency-Key": payload.id,
      }
    );
  }
}
