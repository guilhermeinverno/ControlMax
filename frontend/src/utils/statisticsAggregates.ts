import type { StatsBox, StatsCollection, StatsExpense, StatsSale } from '../types/statistics';
import { buildDashboardBucketPoint } from './statisticsDashboardBucket';
import { filterByDateRange } from './statisticsDateFilters';

export { filterByDateRange };

export interface DashboardAggregatePoint {
  label: string;
  carteraVal: number;
  clientesCount: number;
  recaudoVal: number;
  recaudoPercent: number;
  ventasVal: number;
  ventasCount: number;
  gastosVal: number;
  gastoPercent: number;
}

export interface ChartDatePoint {
  label: string;
  date: Date;
}

export interface CollectorAggregate {
  name: string;
  total: number;
  boxes: number;
}

export interface StatisticsTotals {
  totalBoxesCount: number;
  totalRecaudo: number;
  totalGastos: number;
  totalVentas: number;
  eficiencia: string;
}

export function generateChartDates(start: Date, end: Date): ChartDatePoint[] {
  const list: ChartDatePoint[] = [];
  const diffMs = end.getTime() - start.getTime();
  const interval = diffMs / 5;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 0; i <= 5; i++) {
    const targetTime = start.getTime() + interval * i;
    const date = new Date(targetTime);
    const label = `${monthNames[date.getMonth()]}-${date.getDate()}`;
    list.push({ label, date });
  }

  return list;
}

interface BuildDashboardAggregatesInput {
  filterStart: Date;
  filterEnd: Date;
  filteredSales: StatsSale[];
  filteredCollections: StatsCollection[];
  filteredExpenses: StatsExpense[];
  sales: StatsSale[];
  customersCount: number;
}

export function buildDashboardAggregates({
  filterStart,
  filterEnd,
  filteredSales,
  filteredCollections,
  filteredExpenses,
  sales,
  customersCount,
}: BuildDashboardAggregatesInput): DashboardAggregatePoint[] {
  const timeline = generateChartDates(filterStart, filterEnd);
  const diffMs = filterEnd.getTime() - filterStart.getTime();
  const intervalMs = diffMs / 5;

  return timeline.map((point, index) =>
    buildDashboardBucketPoint({
      label: point.label,
      index,
      bucketStart: new Date(point.date.getTime() - intervalMs / 2),
      bucketEnd: new Date(point.date.getTime() + intervalMs / 2),
      filteredSales,
      filteredCollections,
      filteredExpenses,
      sales,
      customersCount,
    })
  );
}

interface ComputeStatisticsTotalsInput {
  filteredBoxes: StatsBox[];
  filteredCollections: StatsCollection[];
  filteredExpenses: StatsExpense[];
  filteredSales: StatsSale[];
}

export function computeStatisticsTotals({
  filteredBoxes,
  filteredCollections,
  filteredExpenses,
  filteredSales,
}: ComputeStatisticsTotalsInput): StatisticsTotals {
  const totalBoxesCount = filteredBoxes.length;

  const totalRecaudo =
    filteredCollections.reduce((sum, collection) => sum + (collection.amount || 0), 0) ||
    filteredBoxes.reduce((sum, box) => sum + (box.totalCollections || 0), 0);

  const totalGastos =
    filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0) ||
    filteredBoxes.reduce((sum, box) => sum + (box.totalExpenses || 0), 0);

  const totalVentas =
    filteredSales.reduce((sum, sale) => sum + (Number(sale.valor) || 0), 0) ||
    filteredBoxes.reduce((sum, box) => sum + (box.totalSales || 0), 0);

  const eficiencia = totalVentas > 0 ? ((totalRecaudo / totalVentas) * 100).toFixed(2) : '0.00';

  return {
    totalBoxesCount,
    totalRecaudo,
    totalGastos,
    totalVentas,
    eficiencia,
  };
}

export function computeTopCollectors(filteredBoxes: StatsBox[], limit = 5): CollectorAggregate[] {
  const byCollector: Record<string, CollectorAggregate> = {};

  filteredBoxes.forEach((box) => {
    const collectorId = box.userId || 'unknown';
    const collectorName = box.userName || 'Cobrador';

    if (!byCollector[collectorId]) {
      byCollector[collectorId] = { name: collectorName, total: 0, boxes: 0 };
    }

    byCollector[collectorId].total += box.totalCollections || 0;
    byCollector[collectorId].boxes += 1;
  });

  return Object.values(byCollector)
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}
