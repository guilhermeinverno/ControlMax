import { SalesListCollection, SalesListSale } from './salesListMapper';

export interface SalesListFilterState {
  search: string;
  selectedCn: string;
  selectedUnit: string;
  incluirFecha: boolean;
  fechaInicio: string;
  fechaFin: string;
}

function matchesSearch(sale: SalesListSale, queryStr: string): boolean {
  if (!queryStr) return true;
  return (
    sale.id.toLowerCase().includes(queryStr) ||
    sale.clientName.toLowerCase().includes(queryStr) ||
    sale.clientDoc?.toLowerCase().includes(queryStr) ||
    sale.clientId?.toLowerCase().includes(queryStr)
  );
}

function matchesDateRange(sale: SalesListSale, incluirFecha: boolean, fechaInicio: string, fechaFin: string): boolean {
  if (!incluirFecha) return true;
  const creationDateStr = sale.createdAt?.toDate().toISOString().split('T')[0];
  if (!creationDateStr) return true;
  return creationDateStr >= fechaInicio && creationDateStr <= fechaFin;
}

export function filterSalesList(
  sales: SalesListSale[],
  filters: SalesListFilterState
): SalesListSale[] {
  const queryStr = filters.search.toLowerCase().trim();

  return sales.filter((sale) => {
    if (filters.selectedCn !== 'all' && sale.unitName !== filters.selectedCn) return false;
    if (filters.selectedUnit !== 'all' && sale.unitName !== filters.selectedUnit) return false;
    if (!matchesDateRange(sale, filters.incluirFecha, filters.fechaInicio, filters.fechaFin)) return false;
    return matchesSearch(sale, queryStr);
  });
}

export function filterCollectionsList(
  collections: SalesListCollection[],
  search: string
): SalesListCollection[] {
  const queryStr = search.toLowerCase().trim();
  if (!queryStr) return collections;

  return collections.filter(
    (col) =>
      col.clientName.toLowerCase().includes(queryStr) ||
      col.saleId.toLowerCase().includes(queryStr)
  );
}

export function getSevenDaysAgoString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().split('T')[0];
}
