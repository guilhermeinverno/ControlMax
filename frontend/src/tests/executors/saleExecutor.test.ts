import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SaleExecutor } from '../../utils/sync/executors/saleExecutor';
import { SyncHttpClient } from '../../utils/sync/syncHttpClient';
import { HttpMethod } from '../../utils/sync/httpMethod';
import { SalePayload, SaleResponse } from '../../types/syncPayloads';

describe('SaleExecutor', () => {
  let mockRequest: ReturnType<typeof vi.fn<(
    method: HttpMethod,
    url: string,
    data?: unknown,
    headers?: Record<string, string>
  ) => Promise<unknown>>>;
  let mockHttpClient: SyncHttpClient;
  let executor: SaleExecutor;

  const validPayload: SalePayload = {
    id: 'sale-123',
    tenantId: 'tenant-abc',
    boxId: 'box-456',
    customerId: 'customer-789',
    items: [
      {
        productId: 'prod-1',
        quantity: 2,
        unitPriceCents: 500,
        totalCents: 1000,
      },
    ],
    totalCents: 1000,
    paymentMethod: 'cash',
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
    executor = new SaleExecutor(mockHttpClient);
  });

  it('deve executar com sucesso o POST /api/sales retornando SaleResponse', async () => {
    const mockResponse: SaleResponse = {
      success: true,
      saleId: 'sale-123',
      syncedAt: '2026-08-04T12:05:00Z',
    };

    mockRequest.mockResolvedValue(mockResponse);

    const result = await executor.execute(validPayload);

    expect(result).toEqual(mockResponse);
    expect(mockRequest).toHaveBeenCalledWith(
      HttpMethod.POST,
      '/api/sales',
      {
        ...validPayload,
        idempotencyKey: 'sale-123',
      },
      {
        'X-Tenant-ID': 'tenant-abc',
        'X-Idempotency-Key': 'sale-123',
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

  it('deve falhar de forma defensiva se a lista de itens estiver vazia', async () => {
    const invalidPayload = { ...validPayload, items: [] };
    await expect(executor.execute(invalidPayload)).rejects.toThrow(
      'Validation Error: sale must contain at least 1 item'
    );
  });

  it('deve relançar erro se o SyncHttpClient retornar falha HTTP/rede', async () => {
    const mockError = new Error('HTTP 500: Internal Server Error');
    mockRequest.mockRejectedValue(mockError);

    await expect(executor.execute(validPayload)).rejects.toThrow(
      'HTTP 500: Internal Server Error'
    );
  });
});
