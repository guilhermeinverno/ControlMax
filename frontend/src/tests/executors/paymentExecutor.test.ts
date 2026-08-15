import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PaymentExecutor } from '../../utils/sync/executors/paymentExecutor';
import { SyncHttpClient } from '../../utils/sync/syncHttpClient';
import { HttpMethod } from '../../utils/sync/httpMethod';
import { PaymentPayload, PaymentResponse } from '../../types/syncPayloads';

describe('PaymentExecutor', () => {
  let mockRequest: ReturnType<typeof vi.fn<(
    method: HttpMethod,
    url: string,
    data?: unknown,
    headers?: Record<string, string>
  ) => Promise<unknown>>>;
  let mockHttpClient: SyncHttpClient;
  let executor: PaymentExecutor;

  const validPayload: PaymentPayload = {
    id: 'pay-123',
    tenantId: 'tenant-abc',
    boxId: 'box-456',
    customerId: 'customer-789',
    amountCents: 5000,
    paymentMethod: 'cash',
    referenceSaleId: 'sale-999',
    createdAt: '2026-08-04T12:00:00Z',
  };

  beforeEach(() => {
    mockRequest = vi.fn<(
      method: HttpMethod,
      url: string,
      data?: unknown,
      headers?: Record<string, string>
    ) => Promise<unknown>>();
    mockHttpClient = {
      request: mockRequest,
    } as unknown as SyncHttpClient;
    executor = new PaymentExecutor(mockHttpClient);
  });

  it('deve executar com sucesso o POST /api/transactions/payment retornando PaymentResponse', async () => {
    const mockResponse: PaymentResponse = {
      success: true,
      transactionId: 'txn-abc-123',
      newBalanceCents: 15000,
      syncedAt: '2026-08-04T12:05:00Z',
    };

    mockRequest.mockResolvedValue(mockResponse);

    const result = await executor.execute(validPayload);

    expect(result).toEqual(mockResponse);
    expect(mockRequest).toHaveBeenCalledWith(
      HttpMethod.POST,
      '/api/transactions/collection',
      {
        ...validPayload,
        idempotencyKey: 'pay-123',
      },
      {
        'X-Tenant-ID': 'tenant-abc',
        'X-Idempotency-Key': 'pay-123',
      }
    );
  });

  it('deve falhar de forma defensiva se faltar tenantId', async () => {
    const invalidPayload = { ...validPayload, tenantId: '' };
    await expect(executor.execute(invalidPayload)).rejects.toThrow(
      'Validation Error: tenantId is required'
    );
  });

  it('deve falhar de forma defensiva se faltar boxId', async () => {
    const invalidPayload = { ...validPayload, boxId: '' };
    await expect(executor.execute(invalidPayload)).rejects.toThrow(
      'Validation Error: boxId is required'
    );
  });

  it('deve falhar de forma defensiva se faltar customerId', async () => {
    const invalidPayload = { ...validPayload, customerId: '' };
    await expect(executor.execute(invalidPayload)).rejects.toThrow(
      'Validation Error: customerId is required'
    );
  });

  it('deve falhar de forma defensiva se amountCents for menor que 0', async () => {
    const negativePayload = { ...validPayload, amountCents: -500 };
    await expect(executor.execute(negativePayload)).rejects.toThrow(
      'Validation Error: amountCents must be greater than or equal to 0'
    );
  });

  it('deve relançar erro se o SyncHttpClient retornar falha HTTP/rede', async () => {
    const mockError = new Error('HTTP 400: Bad Request');
    mockRequest.mockRejectedValue(mockError);

    await expect(executor.execute(validPayload)).rejects.toThrow(
      'HTTP 400: Bad Request'
    );
  });
});
