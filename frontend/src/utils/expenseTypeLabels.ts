export type BcExpenseCategory = 'salary' | 'rent' | 'supplies' | 'transport' | 'other';

const EXPENSE_TYPE_LABELS: Record<string, string> = {
  gasolina: 'Gasolina',
  aceite: 'Aceite',
  sueldo: 'Sueldo',
  arriendo: 'Arriendo',
  pinchada: 'Pinchada',
  'arreglo moto': 'Arreglo Moto',
  'almuerzo trabajador': 'Almuerzo Trabajador',
  'recarga telefono': 'Recarga Teléfono',
  'factura controlmax': 'Factura ControlMax',
  'pago internet oficina': 'Pago Internet Oficina',
  'pago cel jf': 'Pago Cel JF',
  descuadre: 'Descuadre',
  varios: 'Varios',
  jefe: 'JEFE',
};

export function formatExpenseType(type: string): string {
  return EXPENSE_TYPE_LABELS[type] ?? type;
}

export function mapExpenseTypeToBcCategory(type: string): BcExpenseCategory {
  const normalized = type.toLowerCase();
  if (normalized.includes('sueldo')) return 'salary';
  if (normalized.includes('arriendo')) return 'rent';
  if (
    normalized.includes('gasolina') ||
    normalized.includes('aceite') ||
    normalized.includes('moto') ||
    normalized.includes('pinchada')
  ) {
    return 'transport';
  }
  if (
    normalized.includes('almuerzo') ||
    normalized.includes('recarga') ||
    normalized.includes('internet') ||
    normalized.includes('cel') ||
    normalized.includes('factura')
  ) {
    return 'supplies';
  }
  return 'other';
}
