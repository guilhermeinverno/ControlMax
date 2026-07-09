export interface BusinessCenterUnit {
  id: string;
  name: string;
  active?: boolean;
}

export interface BusinessCenter {
  id: string;
  code?: string;
  name: string;
  linkedUnits: BusinessCenterUnit[];
}

export interface CustomerAddress {
  id: string;
  address: string;
  barrio: string;
  city: string;
}

export interface CustomerPhone {
  id: string;
  number: string;
}

export interface CustomerReference {
  id: string;
  name: string;
  country: string;
  state: string;
  city: string;
  address: string;
  phone: string;
  celular: string;
  comment: string;
}

export interface CustomerSaleRow {
  id: string;
  ugi: string;
  caixa: string;
  date: string;
  amount: number;
}

export interface CustomerPaymentRow {
  id: string;
  ugi: string;
  caixa: string;
  date: string;
  method: string;
  amount: number;
}

export interface Customer {
  id?: string;
  tenantId: string;
  unitId: string;
  unitName: string;
  businessCenterId: string;
  city: string;
  name: string;
  apellidos: string;
  apodo: string;
  email: string;
  documentType: string;
  documentNumber: string;
  birthDate: string;
  address: string;
  barrio: string;
  phone: string;
  celular: string;
  comentario: string;
  actividadEconomica: string;
  active: boolean;
  createdAt: string;
  latitude?: number | null;
  longitude?: number | null;
  secondName?: string;
  secondApellidos?: string;
  document2?: string;
  celularPrefix?: string;
  addresses?: CustomerAddress[];
  phones?: CustomerPhone[];
  references?: CustomerReference[];
  photos?: string[];
}
