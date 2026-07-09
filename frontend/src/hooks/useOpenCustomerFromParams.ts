import { useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Customer } from '../types/company';

export function useOpenCustomerFromParams(
  clientId: unknown,
  customers: Customer[],
  setSelectedCustomerForModal: (customer: Customer | null) => void,
): void {
  useEffect(() => {
    if (!clientId) return;

    const customer = customers.find((item) => item.id === clientId);
    if (customer) {
      setSelectedCustomerForModal(customer);
      return;
    }

    const fetchSingleCustomer = async () => {
      try {
        const customerDocRef = doc(db, 'customers', String(clientId));
        const snap = await getDoc(customerDocRef);
        if (snap.exists()) {
          setSelectedCustomerForModal({ id: snap.id, ...snap.data() } as Customer);
        }
      } catch (err) {
        console.error('Error fetching single customer for modal:', err);
      }
    };

    void fetchSingleCustomer();
  }, [clientId, customers, setSelectedCustomerForModal]);
}
