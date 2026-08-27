import { OperationHandler } from "../../operationHandler";
import { SyncHttpClient } from "../syncHttpClient";
import { HttpMethod } from "../httpMethod";
import { SalePayload, SaleResponse } from "../../../types/syncPayloads";

export class SaleExecutor implements OperationHandler<SalePayload, SaleResponse> {
  constructor(private readonly httpClient: SyncHttpClient) {}

  async execute(payload: SalePayload): Promise<SaleResponse> {
    if (!payload.tenantId) {
      throw new Error("Validation Error: tenantId is required");
    }
    if (!payload.boxId) {
      throw new Error("Validation Error: boxId is required");
    }
    if (!payload.customerId) {
      throw new Error("Validation Error: customerId is required");
    }
    if (!payload.clientName) {
      throw new Error("Validation Error: clientName is required");
    }
    if (!Number.isFinite(payload.amountCents) || payload.amountCents <= 0) {
      throw new Error("Validation Error: amountCents must be greater than 0");
    }
    if (!Number.isFinite(payload.installmentAmountCents) || payload.installmentAmountCents <= 0) {
      throw new Error("Validation Error: installmentAmountCents must be greater than 0");
    }
    if (!Number.isInteger(payload.totalInstallments) || payload.totalInstallments <= 0) {
      throw new Error("Validation Error: totalInstallments must be a positive integer");
    }

    return await this.httpClient.request<SaleResponse, Record<string, unknown>>(
      HttpMethod.POST,
      "/api/transactions/sale",
      {
        clientId: payload.customerId,
        clientName: payload.clientName,
        amountCents: payload.amountCents,
        installmentAmountCents: payload.installmentAmountCents,
        totalInstallments: payload.totalInstallments,
        date: payload.date,
        notes: payload.notes || "",
        photoUrl: payload.photoUrl || "",
        photoName: payload.photoName || "",
        frequency: payload.frequency || "diaria",
        idempotencyKey: payload.id,
      },
      {
        "X-Tenant-ID": payload.tenantId,
        "X-Idempotency-Key": payload.id,
      }
    );
  }
}
