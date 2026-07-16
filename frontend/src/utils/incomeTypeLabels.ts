const INCOME_TYPE_LABELS: Record<string, string> = {
  inversion: 'Inversión',
  inversion_odu: 'Inversión ODU',
  'inversion ODU': 'Inversión ODU',
  'inversion ou': 'Inversión ODU',
  'inversion de capital': 'Inversión ODU',
  'inversion odu': 'Inversión ODU',
  factura_controlmax: 'Factura ControlMax',
  'factura controlmax': 'Factura ControlMax',
  descuadre: 'Descuadre',
  varios: 'Varios',
  prestamo_otros: 'Préstamo Otros',
  'prestamo otros': 'Préstamo Otros',
  labada_moto: 'Labada Moto',
  'labada moto': 'Labada Moto',
  peaje: 'Peaje',
  recarga_cel: 'Recarga Cel',
  'recarga cel': 'Recarga Cel',
  aportes: 'Aportes de Capital',
  prestamos: 'Préstamos',
  otros: 'Otros Ingresos',
  venta: 'Venta',
  venda: 'Venda',
};

export function incomeTypeLabel(type: string): string {
  return INCOME_TYPE_LABELS[type] ?? type;
}

export function isSaleIncomeType(type: string): boolean {
  return type === 'venta' || type === 'venda';
}
