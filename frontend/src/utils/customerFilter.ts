import { Customer } from '../types/company';

export function filterCustomers(
  customers: Customer[],
  selectedUnitId: string,
  viewAllUnits: boolean,
  searchQuery: string,
): Customer[] {
  const query = searchQuery.trim().toLowerCase();

  return customers.filter((customer) => {
    if (!viewAllUnits && selectedUnitId !== 'all' && selectedUnitId !== '') {
      if (customer.unitId !== selectedUnitId) return false;
    }

    if (!query) return true;

    return (
      customer.name.toLowerCase().includes(query) ||
      customer.apellidos.toLowerCase().includes(query) ||
      customer.apodo?.toLowerCase().includes(query) ||
      customer.documentNumber.includes(query) ||
      customer.id?.toLowerCase().includes(query)
    );
  });
}
