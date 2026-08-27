import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SyncHttpClient } from '../utils/sync/syncHttpClient';
import { HttpMethod } from '../utils/sync/httpMethod';
import { auth } from '../lib/firebase';
import { OpenBoxExecutor } from '../utils/sync/executors/openBoxExecutor';
import { CloseBoxExecutor } from '../utils/sync/executors/closeBoxExecutor';
import { SaleExecutor } from '../utils/sync/executors/saleExecutor';
import { PaymentExecutor } from '../utils/sync/executors/paymentExecutor';
import { OpenBoxPayload, CloseBoxPayload, SalePayload, PaymentPayload } from '../types/syncPayloads';

// Mock do módulo de autenticação do Firebase
vi.mock('../lib/firebase', () => ({
  auth: {
    currentUser: null,
  },
}));

describe('6. Teste de Autenticação e Idempotência no SyncHttpClient e Executors (Frontend)', () => {
  let httpClient: SyncHttpClient;
  let globalFetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();
    httpClient = new SyncHttpClient();

    globalFetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    vi.stubGlobal('fetch', globalFetchMock);
  });

  it('deve anexar o header "Authorization: Bearer <token>" se o usuário estiver autenticado no Firebase Auth', async () => {
    // Simula usuário logado com token de autenticação ativo
    (auth as any).currentUser = {
      getIdToken: vi.fn().mockResolvedValue('fake-jwt-token-xyz-123'),
    };

    const response = await httpClient.request(
      HttpMethod.POST,
      '/api/boxes/open',
      { boxId: 'box-1' }
    );

    expect(response).toEqual({ success: true });
    expect(globalFetchMock).toHaveBeenCalledTimes(1);

    const [calledUrl, calledInit] = globalFetchMock.mock.calls[0];
    expect(calledUrl).toBe('/api/boxes/open');
    expect(calledInit.headers['Authorization']).toBe('Bearer fake-jwt-token-xyz-123');
  });

  it('deve lançar um erro claro ANTES de fazer a requisição fetch se auth.currentUser for null', async () => {
    // Simula usuário deslogado
    (auth as any).currentUser = null;

    await expect(
      httpClient.request(HttpMethod.POST, '/api/boxes/open', { boxId: 'box-1' })
    ).rejects.toThrow('Usuário não autenticado no Firebase Auth para envio da requisição (auth.currentUser é null).');

    // Garante que o fetch NÃO foi chamado sem o token
    expect(globalFetchMock).not.toHaveBeenCalled();
  });

  it('OpenBoxExecutor deve incluir idempotencyKey no corpo do payload enviado ao httpClient', async () => {
    const mockRequest = vi.fn().mockResolvedValue({ success: true, boxId: 'box-101' });
    const mockClient = { request: mockRequest } as unknown as SyncHttpClient;
    const executor = new OpenBoxExecutor(mockClient);

    const payload: OpenBoxPayload = {
      id: 'idemp-open-101',
      tenantId: 'tenant-1',
      boxId: 'box-101',
      collectorId: 'collector-1',
      initialBalanceCents: 5000,
      openedAt: '2026-08-15T12:00:00Z',
    };

    await executor.execute(payload);

    expect(mockRequest).toHaveBeenCalledWith(
      HttpMethod.POST,
      '/api/boxes/open',
      {
        ...payload,
        idempotencyKey: 'idemp-open-101',
      },
      {
        'X-Tenant-ID': 'tenant-1',
        'X-Idempotency-Key': 'idemp-open-101',
      }
    );
  });

  it('CloseBoxExecutor deve incluir idempotencyKey no corpo do payload enviado ao httpClient', async () => {
    const mockRequest = vi.fn().mockResolvedValue({ success: true });
    const mockClient = { request: mockRequest } as unknown as SyncHttpClient;
    const executor = new CloseBoxExecutor(mockClient);

    const payload: CloseBoxPayload = {
      id: 'idemp-close-202',
      tenantId: 'tenant-1',
      boxId: 'box-202',
      collectorId: 'collector-1',
      finalBalanceCents: 15000,
      closedAt: '2026-08-15T18:00:00Z',
    };

    await executor.execute(payload);

    expect(mockRequest).toHaveBeenCalledWith(
      HttpMethod.POST,
      '/api/boxes/close',
      {
        ...payload,
        idempotencyKey: 'idemp-close-202',
      },
      {
        'X-Tenant-ID': 'tenant-1',
        'X-Idempotency-Key': 'idemp-close-202',
      }
    );
  });

  it('SaleExecutor deve incluir idempotencyKey no corpo do payload enviado ao httpClient', async () => {
    const mockRequest = vi.fn().mockResolvedValue({ success: true, saleId: 'sale-303' });
    const mockClient = { request: mockRequest } as unknown as SyncHttpClient;
    const executor = new SaleExecutor(mockClient);

    const payload: SalePayload = {
      id: 'idemp-sale-303',
      tenantId: 'tenant-1',
      boxId: 'box-101',
      customerId: 'customer-1',
      clientName: 'Cliente 1',
      amountCents: 2000,
      installmentAmountCents: 200,
      totalInstallments: 10,
      date: '2026-08-15',
      createdAt: '2026-08-15T12:30:00Z',
    };

    await executor.execute(payload);

    expect(mockRequest).toHaveBeenCalledWith(
      HttpMethod.POST,
      '/api/transactions/sale',
      expect.objectContaining({
        clientId: 'customer-1',
        clientName: 'Cliente 1',
        amountCents: 2000,
        idempotencyKey: 'idemp-sale-303',
      }),
      {
        'X-Tenant-ID': 'tenant-1',
        'X-Idempotency-Key': 'idemp-sale-303',
      }
    );
  });

  it('PaymentExecutor deve incluir idempotencyKey no corpo do payload enviado ao httpClient', async () => {
    const mockRequest = vi.fn().mockResolvedValue({ success: true, collectionId: 'coll-404' });
    const mockClient = { request: mockRequest } as unknown as SyncHttpClient;
    const executor = new PaymentExecutor(mockClient);

    const payload: PaymentPayload = {
      id: 'idemp-pay-404',
      tenantId: 'tenant-1',
      boxId: 'box-101',
      customerId: 'customer-1',
      amountCents: 1000,
      paymentMethod: 'cash',
      referenceSaleId: 'sale-404',
      comment: 'teste',
      createdAt: '2026-08-15T14:00:00Z',
    };

    await executor.execute(payload);

    expect(mockRequest).toHaveBeenCalledWith(
      HttpMethod.POST,
      '/api/transactions/collection',
      {
        saleId: 'sale-404',
        amountCents: 1000,
        paymentMethod: 'cash',
        comment: 'teste',
        idempotencyKey: 'idemp-pay-404',
      },
      {
        'X-Tenant-ID': 'tenant-1',
        'X-Idempotency-Key': 'idemp-pay-404',
      }
    );
  });
});
