import { describe, expect, it } from 'vitest';
import { mapSaleFromSnapshot } from './saleMapper';

describe('mapSaleFromSnapshot', () => {
  it('retorna null quando o documento não existe', () => {
    const snap = {
      id: 'sale-1',
      exists: () => false,
      data: () => ({}),
    };
    expect(mapSaleFromSnapshot(snap)).toBeNull();
  });

  it('mapeia campos obrigatórios e centavos de saldo', () => {
    const snap = {
      id: 'sale-42',
      exists: () => true,
      data: () => ({
        tenantId: 'tenant-a',
        clientId: 'client-9',
        clientName: 'Maria',
        clientDoc: '123',
        amount: 5000,
        saldoPendienteCents: 1200,
        status: 'active',
      }),
    };

    expect(mapSaleFromSnapshot(snap)).toEqual({
      id: 'sale-42',
      tenantId: 'tenant-a',
      clientId: 'client-9',
      clientName: 'Maria',
      clientDoc: '123',
      amount: 5000,
      balance: 1200,
      status: 'active',
      idPreVenta: undefined,
      saldoPendiente: undefined,
      saldoPendienteCents: 1200,
    });
  });

  it('prioriza balance explícito sobre saldoPendienteCents', () => {
    const snap = {
      id: 'sale-7',
      exists: () => true,
      data: () => ({
        balance: 800,
        saldoPendienteCents: 1200,
      }),
    };

    expect(mapSaleFromSnapshot(snap)?.balance).toBe(800);
  });
});
