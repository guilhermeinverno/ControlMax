import { OperationHandler } from "../../operationHandler";
import { SyncHttpClient } from "../syncHttpClient";
import { HttpMethod } from "../httpMethod";
import { PaymentPayload, PaymentResponse } from "../../../types/syncPayloads";

export class PaymentExecutor implements OperationHandler<PaymentPayload, PaymentResponse> {
  constructor(private readonly httpClient: SyncHttpClient) {}

  async execute(payload: PaymentPayload): Promise<PaymentResponse> {
    if (!payload.tenantId) {
      throw new Error("Validation Error: tenantId is required");
    }
    if (!payload.boxId) {
      throw new Error("Validation Error: boxId is required");
    }
    if (!payload.customerId) {
      throw new Error("Validation Error: customerId is required");
    }
    if (!payload.referenceSaleId) {
      throw new Error("Validation Error: referenceSaleId (saleId) is required");
    }
    if (payload.amountCents < 0) {
      throw new Error("Validation Error: amountCents must be greater than or equal to 0");
    }

    // Contrato BFF: /api/transactions/collection
    return await this.httpClient.request<PaymentResponse, Record<string, unknown>>(
      HttpMethod.POST,
      "/api/transactions/collection",
      {
        saleId: payload.referenceSaleId,
        amountCents: payload.amountCents,
        paymentMethod: payload.paymentMethod,
        comment: payload.comment || "",
        idempotencyKey: payload.id,
      },
      {
        "X-Tenant-ID": payload.tenantId,
        "X-Idempotency-Key": payload.id,
      }
    );
  }
}
