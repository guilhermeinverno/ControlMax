import { OperationHandler } from "../../operationHandler";
import { SyncHttpClient } from "../syncHttpClient";
import { HttpMethod } from "../httpMethod";
import { OpenBoxPayload, OpenBoxResponse } from "../../../types/syncPayloads";

export class OpenBoxExecutor implements OperationHandler<OpenBoxPayload, OpenBoxResponse> {
  constructor(private readonly httpClient: SyncHttpClient) {}

  async execute(payload: OpenBoxPayload): Promise<OpenBoxResponse> {
    if (!payload.tenantId) {
      throw new Error("Validation Error: tenantId is required");
    }
    if (!payload.unitId) {
      throw new Error("Validation Error: unitId is required");
    }
    if (!payload.cnId) {
      throw new Error("Validation Error: cnId is required");
    }
    if (!payload.date) {
      throw new Error("Validation Error: date is required");
    }
    const initialAmount = payload.initialAmount ?? payload.initialBalanceCents;
    if (initialAmount === undefined || initialAmount < 0) {
      throw new Error("Validation Error: initialAmount must be greater than or equal to 0");
    }

    return await this.httpClient.request<OpenBoxResponse, Record<string, unknown>>(
      HttpMethod.POST,
      "/api/boxes/open",
      {
        unitId: payload.unitId,
        unitName: payload.unitName || "",
        cnId: payload.cnId,
        cnName: payload.cnName || "",
        initialAmount,
        observation: payload.observation || "",
        date: payload.date,
        idempotencyKey: payload.id,
      },
      {
        "X-Tenant-ID": payload.tenantId,
        "X-Idempotency-Key": payload.id,
      }
    );
  }
}
