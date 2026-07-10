import * as XLSX from 'xlsx';
import type { UnifiedMovement } from './financeMovements';

export type FinanceTabFilter = 'Todos' | 'Ingreso' | 'Egreso' | 'Transferencia' | 'Recaudo';

export const FINANCE_MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export function fmtFinanceValue(cents: number): string {
  return (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function filterMovementsByDate(
  movements: UnifiedMovement[],
  selectedMonth: number,
  selectedYear: number
): UnifiedMovement[] {
  return movements.filter((m) => m.date.getMonth() === selectedMonth && m.date.getFullYear() === selectedYear);
}

export function filterMovementsByTabAndCn(
  movements: UnifiedMovement[],
  activeTabFilter: FinanceTabFilter,
  selectedCnFilter: string
): UnifiedMovement[] {
  return movements.filter((m) => {
    const matchesTab = activeTabFilter === 'Todos' || m.type === activeTabFilter;
    const matchesCn = selectedCnFilter === 'Todos' || m.cnName === selectedCnFilter;
    return matchesTab && matchesCn;
  });
}

export interface FinanceKpis {
  totalIncomes: number;
  totalExpenses: number;
  currentCapitalBalance: number;
  marginPercentage: number;
  approvedIncomesCount: number;
  approvedExpensesCount: number;
}

export function computeFinanceKpis(filteredByDate: UnifiedMovement[]): FinanceKpis {
  const approvedIncomes = filteredByDate.filter(
    (m) => m.status === 'Aprobado' && (m.type === 'Ingreso' || m.type === 'Recaudo')
  );
  const approvedExpenses = filteredByDate.filter(
    (m) => m.status === 'Aprobado' && (m.type === 'Egreso' || m.type === 'Transferencia')
  );

  const totalIncomes = approvedIncomes.reduce((sum, m) => sum + m.amount, 0);
  const totalExpenses = approvedExpenses.reduce((sum, m) => sum + m.amount, 0);
  const currentCapitalBalance = totalIncomes - totalExpenses;
  const marginPercentage = totalIncomes > 0 ? (currentCapitalBalance / totalIncomes) * 100 : 0;

  return {
    totalIncomes,
    totalExpenses,
    currentCapitalBalance,
    marginPercentage,
    approvedIncomesCount: approvedIncomes.length,
    approvedExpensesCount: approvedExpenses.length,
  };
}

export function computeDistributionByCenter(filteredByDate: UnifiedMovement[]): Record<string, number> {
  return filteredByDate.reduce((acc: Record<string, number>, m) => {
    if (m.status === 'Aprobado') {
      const isOut = m.type === 'Egreso' || m.type === 'Transferencia';
      const change = isOut ? -m.amount : m.amount;
      acc[m.cnName] = (acc[m.cnName] || 0) + change;
    }
    return acc;
  }, {});
}

export function exportFinanceExcel(
  movements: UnifiedMovement[],
  selectedMonth: number,
  selectedYear: number
): void {
  const dataToExport = movements.map((m) => ({
    ID: m.id,
    Tipo: m.type,
    Descripción: m.description,
    Monto: m.amount / 100,
    Estado: m.status,
    Fecha: m.dateStr,
    Centro: m.cnName,
    Responsable: m.responsible,
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Finanzas');
  XLSX.writeFile(workbook, `Reporte_Financiero_${FINANCE_MONTHS[selectedMonth]}_${selectedYear}.xlsx`);
}
