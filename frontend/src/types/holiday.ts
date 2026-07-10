export interface Holiday {
  id: string;
  name: string;
  day: number;
  month: number;
  year: number;
  active: boolean;
  tenantId: string;
  createdAt?: unknown;
}

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
