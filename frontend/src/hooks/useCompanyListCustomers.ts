import { useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Customer } from '../types/company';

interface UseCompanyListCustomersOptions {
  tenantId: string | undefined;
  selectedCnId: string;
  setCustomers: (customers: Customer[]) => void;
  setLoadingCustomers: (loading: boolean) => void;
  role?: string;
  usuarioUnidades?: string[];
}

export function useCompanyListCustomers({
  tenantId,
  selectedCnId,
  setCustomers,
  setLoadingCustomers,
  role,
  usuarioUnidades,
}: UseCompanyListCustomersOptions): void {
  useEffect(() => {
    if (!tenantId) return undefined;

    setLoadingCustomers(true);
    const customersRef = collection(db, 'customers');
    let customersQuery = query(customersRef, where('tenantId', '==', tenantId));

    if (selectedCnId) {
      customersQuery = query(customersQuery, where('businessCenterId', '==', selectedCnId));
    }

    // Add unit isolation for collectors
    if ((role === 'collector' || role === 'supervisor') && usuarioUnidades) {
      if (usuarioUnidades.length === 0) {
        setCustomers([]);
        setLoadingCustomers(false);
        return;
      }
      // Chunk units to max 10 for firestore 'in' query if needed, but usually 1-3 units.
      const units = usuarioUnidades.slice(0, 10);
      customersQuery = query(customersQuery, where('unitId', 'in', units));
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
