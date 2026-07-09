import { useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Customer } from '../types/company';

export function useCompanyListCustomers(
  tenantId: string | undefined,
  selectedCnId: string,
  setCustomers: (customers: Customer[]) => void,
  setLoadingCustomers: (loading: boolean) => void,
): void {
  useEffect(() => {
    if (!tenantId) return undefined;

    setLoadingCustomers(true);
    const customersRef = collection(db, 'customers');
    let customersQuery = query(customersRef, where('tenantId', '==', tenantId));

    if (selectedCnId) {
      customersQuery = query(customersQuery, where('businessCenterId', '==', selectedCnId));
    }

    const unsubscribe = onSnapshot(
      customersQuery,
      (snapshot) => {
        setCustomers(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })) as Customer[]);
        setLoadingCustomers(false);
      },
      (error) => {
        console.error('Error listening to customers:', error);
        setLoadingCustomers(false);
      },
    );

    return () => unsubscribe();
  }, [tenantId, selectedCnId, setCustomers, setLoadingCustomers]);
}
