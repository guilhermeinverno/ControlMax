import { describe, expect, it } from 'vitest';
import { Customer } from '../types/company';
import { filterCustomers } from './customerFilter';

const sampleCustomers = [
  {
    id: 'c1',
    tenantId: 't1',
    unitId: 'u1',
    unitName: 'Unit 1',
    businessCenterId: 'cn1',
    city: 'Brasilia',
    name: 'Maria',
    apellidos: 'Silva',
    documentType: 'CPF',
    documentNumber: '12345',
    address: 'Rua 1',
    celular: '999',
    actividadEconomica: 'Comercio',
    active: true,
  },
  {
    id: 'c2',
    tenantId: 't1',
    unitId: 'u2',
    unitName: 'Unit 2',
    businessCenterId: 'cn1',
    city: 'Goiania',
    name: 'Joao',
    apellidos: 'Santos',
    documentType: 'CPF',
    documentNumber: '67890',
    address: 'Rua 2',
    celular: '888',
    actividadEconomica: 'Servicios',
    active: true,
  },
] as Customer[];

describe('filterCustomers', () => {
  it('filters by unit when not viewing all', () => {
    const result = filterCustomers(sampleCustomers, 'u1', false, '');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('c1');
  });

  it('filters by search query', () => {
    const result = filterCustomers(sampleCustomers, 'all', true, 'joao');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Joao');
  });
});
