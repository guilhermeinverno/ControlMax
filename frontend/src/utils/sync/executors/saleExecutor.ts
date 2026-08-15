import { OperationHandler } from "../../operationHandler";
import { SyncHttpClient } from "../syncHttpClient";
import { HttpMethod } from "../httpMethod";
import { SalePayload, SaleResponse } from "../../../types/syncPayloads";

export class SaleExecutor implements OperationHandler<SalePayload, SaleResponse> {
  constructor(private readonly httpClient: SyncHttpClient) {}

  async execute(payload: SalePayload): Promise<SaleResponse> {
    // Validações defensivas
    if (!payload.tenantId) {
      throw new Error("Validation Error: tenantId is required");
    }
    if (!payload.boxId) {
      throw new Error("Validation Error: boxId is required");
    }
    if (!payload.customerId) {
      throw new Error("Validation Error: customerId is required");
    }
    if (!payload.items || payload.items.length === 0) {
      throw new Error("Validation Error: sale must contain at least 1 item");
    }

    // Chamada BFF
    return await this.httpClient.request<SaleResponse, any>(
      HttpMethod.POST,
      "/api/sales",
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
