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
    unitId: 'unit-1',
    unitName: 'Rota 1',
    cnId: 'cn-1',
    cnName: 'CN Centro',
    initialAmount: 10000,
    date: '2026-08-04',
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
      {
        unitId: 'unit-1',
        unitName: 'Rota 1',
        cnId: 'cn-1',
        cnName: 'CN Centro',
        initialAmount: 10000,
        observation: '',
        date: '2026-08-04',
        idempotencyKey: 'open-123',
      },
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

  it('deve falhar de forma defensiva se faltar unitId', async () => {
    const invalidPayload = { ...validPayload, unitId: '' };
    await expect(executor.execute(invalidPayload)).rejects.toThrow(
      'Validation Error: unitId is required'
    );
  });

  it('deve falhar de forma defensiva se faltar cnId', async () => {
    const invalidPayload = { ...validPayload, cnId: '' };
    await expect(executor.execute(invalidPayload)).rejects.toThrow(
      'Validation Error: cnId is required'
    );
  });

  it('deve falhar de forma defensiva se initialAmount for menor que 0', async () => {
    const invalidPayload = { ...validPayload, initialAmount: -1 };
    await expect(executor.execute(invalidPayload)).rejects.toThrow(
      'Validation Error: initialAmount must be greater than or equal to 0'
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
