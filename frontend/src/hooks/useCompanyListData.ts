import { useCallback, useEffect, useMemo, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { logFirestoreError } from '../utils/firestoreError';
import { BusinessCenter, Customer } from '../types/company';
import { fetchActiveBusinessCenters, pickDefaultCnSelection } from '../utils/companyListCenters';
import { filterCustomers } from '../utils/customerFilter';
import { useCompanyListCustomers } from './useCompanyListCustomers';
import { useOpenCustomerFromParams } from './useOpenCustomerFromParams';

interface UseCompanyListDataOptions {
  tenantId?: string;
  clientId?: unknown;
}

export function useCompanyListData({ tenantId, clientId }: UseCompanyListDataOptions) {
  const [centers, setCenters] = useState<BusinessCenter[]>([]);
  const [selectedCnId, setSelectedCnId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [viewAllUnits, setViewAllUnits] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerForModal, setSelectedCustomerForModal] = useState<Customer | null>(null);

  useEffect(() => {
    if (!tenantId) return;

    const loadCenters = async () => {
      try {
        const list = await fetchActiveBusinessCenters(tenantId);
        setCenters(list);

        const defaults = pickDefaultCnSelection(list);
        setSelectedCnId(defaults.cnId);
        setSelectedUnitId(defaults.unitId);
      } catch (err) {
        console.error('Error loading business centers:', err);
      }
    };

    void loadCenters();
  }, [tenantId]);

  useCompanyListCustomers(tenantId, selectedCnId, setCustomers, setLoadingCustomers);
  useOpenCustomerFromParams(clientId, customers, setSelectedCustomerForModal);

  const handleCnChange = useCallback((cnId: string) => {
    setSelectedCnId(cnId);
    setSelectedUnitId('all');
  }, []);

  const toggleCustomerStatus = useCallback(async (customer: Customer) => {
    if (!customer.id) return;

    try {
      await updateDoc(doc(db, 'customers', customer.id), { active: !customer.active });
    } catch (err) {
      logFirestoreError(err, 'update', `customers/${customer.id}`, {
        throwError: true,
        extraAuth: { userId: 'system_user' },
      });
    }
  }, []);

  const selectedCenter = centers.find((center) => center.id === selectedCnId);
  const activeUnitsList = selectedCenter
    ? selectedCenter.linkedUnits.filter((unit) => unit.active)
    : [];

  const filteredCustomers = useMemo(
    () => filterCustomers(customers, selectedUnitId, viewAllUnits, searchQuery),
    [customers, selectedUnitId, viewAllUnits, searchQuery],
  );

  return {
    centers,
    selectedCnId,
    selectedUnitId,
    viewAllUnits,
    customers,
    loadingCustomers,
    searchQuery,
    selectedCustomerForModal,
    activeUnitsList,
    filteredCustomers,
    setSelectedUnitId,
    setViewAllUnits,
    setSearchQuery,
    setSelectedCustomerForModal,
    handleCnChange,
    toggleCustomerStatus,
  };
}
