import { useEffect, useState } from 'react';
import {
  StatsBox,
  StatsCollection,
  StatsCreditRequest,
  StatsCustomer,
  StatsExpense,
  StatsSale,
} from '../types/statistics';
import { fetchCollectionWithFallback } from '../utils/statisticsFetch';

export function useStatisticsData(tenantId?: string, filterTrigger = 0, usuarioUnidades?: string[]) {
  const [boxes, setBoxes] = useState<StatsBox[]>([]);
  const [collections, setCollections] = useState<StatsCollection[]>([]);
  const [expenses, setExpenses] = useState<StatsExpense[]>([]);
  const [creditRequests, setCreditRequests] = useState<StatsCreditRequest[]>([]);
  const [sales, setSales] = useState<StatsSale[]>([]);
  const [customersCount, setCustomersCount] = useState(12);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;

    setLoading(true);
    setLoadError(null);

    const loadData = async () => {
      try {
        const [boxList, collList, expList, credList, saleList, custDocs] = await Promise.all([
          fetchCollectionWithFallback<StatsBox>('boxes', tenantId, usuarioUnidades),
          fetchCollectionWithFallback<StatsCollection>('collections', tenantId, usuarioUnidades),
          fetchCollectionWithFallback<StatsExpense>('expenses', tenantId, usuarioUnidades),
          fetchCollectionWithFallback<StatsCreditRequest>('credit_requests', tenantId, usuarioUnidades),
          fetchCollectionWithFallback<StatsSale>('sales', tenantId, usuarioUnidades),
          fetchCollectionWithFallback<StatsCustomer>('customers', tenantId, usuarioUnidades),
        ]);

        setBoxes(boxList);
        setCollections(collList);
        setExpenses(expList);
        setCreditRequests(credList);
        setSales(saleList);
        if (custDocs.length > 0) setCustomersCount(custDocs.length);
      } catch (e) {
        console.error('Error loading analytics database data', e);
        setLoadError('Erro ao carregar métricas do painel. Verifique permissões e conexão com o Firestore.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tenantId, filterTrigger]);

  return {
    boxes,
    collections,
    expenses,
    creditRequests,
    sales,
    customersCount,
    loading,
    loadError,
  };
}
