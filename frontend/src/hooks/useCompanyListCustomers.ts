import { useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Customer } from '../types/company';

export function useCompanyListCustomers(
  tenantId: string | undefined,
  selectedCnId: string,
  setCustomers: (customers: Customer[]) => void,
  setLoadingCustomers: (loading: boolean) => void,
  setCustomersError?: (message: string | null) => void,
  reloadToken = 0,
): void {
  useEffect(() => {
    if (!tenantId) return undefined;

    setLoadingCustomers(true);
    setCustomersError?.(null);
    const customersRef = collection(db, 'customers');
    let customersQuery = query(customersRef, where('tenantId', '==', tenantId));

    if (selectedCnId) {
      customersQuery = query(customersQuery, where('businessCenterId', '==', selectedCnId));
    }

    const unsubscribe = onSnapshot(
      customersQuery,
      (snapshot) => {
        setCustomers(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })) as Customer[]);
        setCustomersError?.(null);
        setLoadingCustomers(false);
      },
      (error) => {
        console.error('Error listening to customers:', error);
        setCustomersError('Falha ao carregar clientes. Verifique sua conexão.');
        setLoadingCustomers(false);
      },
    );

    return () => unsubscribe();
  }, [tenantId, selectedCnId, setCustomers, setLoadingCustomers, setCustomersError, reloadToken]);
}
