import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { auth } from '../lib/firebase';
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
  const [centersError, setCentersError] = useState<string | null>(null);
  const [selectedCnId, setSelectedCnId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [viewAllUnits, setViewAllUnits] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerForModal, setSelectedCustomerForModal] = useState<Customer | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const retryLoad = useCallback(() => {
    setReloadToken((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!tenantId) return;

    const loadCenters = async () => {
      setCentersError(null);
      try {
        const list = await fetchActiveBusinessCenters(tenantId);
        setCenters(list);

        const defaults = pickDefaultCnSelection(list);
        setSelectedCnId(defaults.cnId);
        setSelectedUnitId(defaults.unitId);
      } catch (err) {
        console.error('Error loading business centers:', err);
        setCentersError('Falha ao carregar centros de negócio. Verifique sua conexão.');
        toast.error('Falha de sincronização. Verifique sua conexão com a internet.');
      }
    };

    void loadCenters();
  }, [tenantId, reloadToken]);

  useCompanyListCustomers(
    tenantId,
    selectedCnId,
    setCustomers,
    setLoadingCustomers,
    setCustomersError,
    reloadToken,
  );
  useOpenCustomerFromParams(clientId, customers, setSelectedCustomerForModal);

  const handleCnChange = useCallback((cnId: string) => {
    setSelectedCnId(cnId);
    setSelectedUnitId('all');
  }, []);

  const toggleCustomerStatus = useCallback(async (customer: Customer) => {
    if (!customer.id) return;

    try {
      if (!auth?.currentUser) {
        throw new Error('Usuario no autenticado.');
      }
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/customers/${encodeURIComponent(customer.id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          active: !customer.active,
          reason: 'Alteração de status do cliente',
        }),
      });
      const data = await res.json().catch(() => ({} as { error?: string }));
      if (!res.ok) {
        throw new Error(data.error || `Erro ao atualizar (${res.status}).`);
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error
          ? err.message
          : 'Não foi possível alterar o status do cliente.',
      );
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

  const listError = centersError || customersError;

  return {
    centers,
    selectedCnId,
    selectedUnitId,
    viewAllUnits,
    customers,
    loadingCustomers,
    listError,
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
    retryLoad,
  };
}
