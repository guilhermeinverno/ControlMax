import { vi, describe, it, expect, beforeEach } from 'vitest';
import { OpenBoxExecutor } from '../../utils/sync/executors/openBoxExecutor';
import { SyncHttpClient } from '../../utils/sync/syncHttpClient';
import { HttpMethod } from '../../utils/sync/httpMethod';
import { OpenBoxPayload, OpenBoxResponse } from '../../types/syncPayloads';

describe('OpenBoxExecutor', () => {
  let mockRequest: ReturnType<typeof vi.fn<(
    method: HttpMethod,
    url: string,
    data?: unknown,
    headers?: Record<string, string>
  ) => Promise<unknown>>>;
  let mockHttpClient: SyncHttpClient;
  let executor: OpenBoxExecutor;

  const validPayload: OpenBoxPayload = {
    id: 'open-123',
    tenantId: 'tenant-abc',
    boxId: 'box-456',
    collectorId: 'collector-789',
    initialBalanceCents: 10000,
    openedAt: '2026-08-04T12:00:00Z',
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
    executor = new OpenBoxExecutor(mockHttpClient);
  });

  it('deve executar com sucesso o POST /api/boxes/open retornando OpenBoxResponse', async () => {
    const mockResponse: OpenBoxResponse = {
      success: true,
      boxId: 'box-456',
      openedAt: '2026-08-04T12:00:00Z',
      status: 'open',
    };

    mockRequest.mockResolvedValue(mockResponse);

    const result = await executor.execute(validPayload);

    expect(result).toEqual(mockResponse);
    expect(mockRequest).toHaveBeenCalledWith(
      HttpMethod.POST,
      '/api/boxes/open',
      validPayload,
      {
        'X-Tenant-ID': 'tenant-abc',
        'X-Idempotency-Key': 'open-123',
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

  it('deve falhar de forma defensiva se initialBalanceCents for menor que 0', async () => {
    const invalidPayload = { ...validPayload, initialBalanceCents: -1 };
    await expect(executor.execute(invalidPayload)).rejects.toThrow(
      'Validation Error: initialBalanceCents must be greater than or equal to 0'
    );
  });

  it('deve relançar erro se o SyncHttpClient retornar falha HTTP/rede', async () => {
    const mockError = new Error('HTTP 500: Server Error');
    mockRequest.mockRejectedValue(mockError);

    await expect(executor.execute(validPayload)).rejects.toThrow(
      'HTTP 500: Server Error'
    );
  });
});
