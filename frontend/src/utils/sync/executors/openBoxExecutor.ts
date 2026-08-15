import { OperationHandler } from "../../operationHandler";
import { SyncHttpClient } from "../syncHttpClient";
import { HttpMethod } from "../httpMethod";
import { OpenBoxPayload, OpenBoxResponse } from "../../../types/syncPayloads";

export class OpenBoxExecutor implements OperationHandler<OpenBoxPayload, OpenBoxResponse> {
  constructor(private readonly httpClient: SyncHttpClient) {}

  async execute(payload: OpenBoxPayload): Promise<OpenBoxResponse> {
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
    if (payload.initialBalanceCents < 0) {
      throw new Error("Validation Error: initialBalanceCents must be greater than or equal to 0");
    }

    // Chamada BFF
    return await this.httpClient.request<OpenBoxResponse, any>(
      HttpMethod.POST,
      "/api/boxes/open",
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
