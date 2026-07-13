export function fmtTransferSales(cents: number): string {
  return (cents / 100).toLocaleString('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function sumUnitBalances(units: { balance?: number }[]): number {
  return units.reduce((sum, unit) => sum + (unit.balance || 0), 0);
}
