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
    clientName: 'Cliente Teste',
    amountCents: 100000,
    installmentAmountCents: 5000,
    totalInstallments: 20,
    date: '2026-08-04',
    notes: '',
    frequency: 'diaria',
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

  it('deve executar com sucesso o POST /api/transactions/sale retornando SaleResponse', async () => {
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
      '/api/transactions/sale',
      {
        clientId: 'customer-789',
        clientName: 'Cliente Teste',
        amountCents: 100000,
        installmentAmountCents: 5000,
        totalInstallments: 20,
        date: '2026-08-04',
        notes: '',
        photoUrl: '',
        photoName: '',
        frequency: 'diaria',
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

  it('deve falhar de forma defensiva se amountCents for inválido', async () => {
    const invalidPayload = { ...validPayload, amountCents: 0 };
    await expect(executor.execute(invalidPayload)).rejects.toThrow(
      'Validation Error: amountCents must be greater than 0'
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
