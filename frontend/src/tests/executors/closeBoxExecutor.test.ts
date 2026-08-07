import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CloseBoxExecutor } from '../../utils/sync/executors/closeBoxExecutor';
import { SyncHttpClient } from '../../utils/sync/syncHttpClient';
import { HttpMethod } from '../../utils/sync/httpMethod';
import { CloseBoxPayload, CloseBoxResponse } from '../../types/syncPayloads';

describe('CloseBoxExecutor', () => {
  let mockRequest: ReturnType<typeof vi.fn<(
    method: HttpMethod,
    url: string,
    data?: unknown,
    headers?: Record<string, string>
  ) => Promise<unknown>>>;
  let mockHttpClient: SyncHttpClient;
  let executor: CloseBoxExecutor;

  const validPayload: CloseBoxPayload = {
    id: 'close-123',
    tenantId: 'tenant-abc',
    boxId: 'box-456',
    collectorId: 'collector-789',
    finalBalanceCents: 15000,
    notes: 'Caixa fechado com saldo correto.',
    closedAt: '2026-08-04T18:00:00Z',
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
    executor = new CloseBoxExecutor(mockHttpClient);
  });

  it('deve executar com sucesso o POST /api/boxes/close retornando CloseBoxResponse', async () => {
    const mockResponse: CloseBoxResponse = {
      success: true,
      boxId: 'box-456',
      closedAt: '2026-08-04T18:00:00Z',
      totalTransactions: 10,
      status: 'closed',
    };

    mockRequest.mockResolvedValue(mockResponse);

    const result = await executor.execute(validPayload);

    expect(result).toEqual(mockResponse);
    expect(mockRequest).toHaveBeenCalledWith(
      HttpMethod.POST,
      '/api/boxes/close',
      validPayload,
      {
        'X-Tenant-ID': 'tenant-abc',
        'X-Idempotency-Key': 'close-123',
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

  it('deve falhar de forma defensiva se faltar collectorId', async () => {
    const invalidPayload = { ...validPayload, collectorId: '' };
    await expect(executor.execute(invalidPayload)).rejects.toThrow(
      'Validation Error: collectorId is required'
    );
  });

  it('deve falhar de forma defensiva se finalBalanceCents for menor que 0', async () => {
    const invalidPayload = { ...validPayload, finalBalanceCents: -50 };
    await expect(executor.execute(invalidPayload)).rejects.toThrow(
      'Validation Error: finalBalanceCents must be greater than or equal to 0'
    );
  });

  it('deve relançar erro se o SyncHttpClient retornar falha HTTP/rede', async () => {
    const mockError = new Error('HTTP 403: Forbidden');
    mockRequest.mockRejectedValue(mockError);

    await expect(executor.execute(validPayload)).rejects.toThrow(
      'HTTP 403: Forbidden'
    );
  });
});
