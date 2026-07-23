import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { logFirestoreError } from '../utils/firestoreError';
import { fetchUnifiedMovements, type UnifiedMovement } from '../utils/financeMovements';

export function useFinanceData(tenantId?: string, isCollector = false, usuarioUnidades?: string[]) {
  const [loadingData, setLoadingData] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [movements, setMovements] = useState<UnifiedMovement[]>([]);
  const [availableCns, setAvailableCns] = useState<string[]>([]);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTabFilter, setActiveTabFilter] = useState<
    'Todos' | 'Ingreso' | 'Egreso' | 'Transferencia' | 'Recaudo'
  >('Todos');
  const [selectedCnFilter, setSelectedCnFilter] = useState('Todos');

  const loadFinancialData = async () => {
    if (!tenantId) return;
    setLoadingData(true);
    setErrorMsg(null);

    try {
      const { movements: loadedMovements, cnNames } = await fetchUnifiedMovements(tenantId, usuarioUnidades);
      setMovements(loadedMovements);
      setAvailableCns(cnNames);
    } catch (err: unknown) {
      setErrorMsg('No se pudo cargar la información financiera. Intente de nuevo.');
      try {
        logFirestoreError(err, 'list', 'finance_collections', {
          label: 'Firestore Error in Finance',
          throwError: true,
          includeAuth: false,
        });
      } catch {
        toast.error('Falha de sincronização. Verifique sua conexão com a internet.');
      }
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (tenantId && !isCollector) {
      loadFinancialData();
    }
  }, [tenantId, isCollector, usuarioUnidades]);

  return {
    loadingData,
    errorMsg,
    movements,
    availableCns,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    activeTabFilter,
    setActiveTabFilter,
    selectedCnFilter,
    setSelectedCnFilter,
    loadFinancialData,
  };
}
