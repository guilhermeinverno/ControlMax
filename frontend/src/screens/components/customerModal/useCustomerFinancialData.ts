import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { CustomerPaymentRow, CustomerSaleRow } from '../../../types/company';
import { formatFirestoreDate } from '../../../utils/firestoreTimestamp';

function mapSaleDoc(id: string, data: Record<string, unknown>): CustomerSaleRow {
  const dateStr = data.createdAt
    ? formatFirestoreDate(data.createdAt, 'pt-BR')
  : 'Reciente';

  return {
    id,
    ugi: (data.unitName as string) || '3',
    caixa: (data.boxName as string) || '1006671',
    date: dateStr,
    amount: (data.amount as number) || 0,
  };
}

function mapPaymentDoc(id: string, data: Record<string, unknown>): CustomerPaymentRow {
  const boxId = data.boxId as string | undefined;
  const dateStr = data.createdAt
    ? formatFirestoreDate(data.createdAt, 'pt-BR')
    : 'Reciente';

  return {
    id,
    ugi: (data.boxName as string) || '3',
    caixa: boxId ? boxId.slice(-7) : '1006671',
    date: dateStr,
    method: (data.paymentMethod as string) || 'Efectivo',
    amount: (data.amount as number) || 0,
  };
}

export function useCustomerFinancialData(customerId?: string) {
  const [sales, setSales] = useState<CustomerSaleRow[]>([]);
  const [payments, setPayments] = useState<CustomerPaymentRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!customerId) return undefined;

    setLoading(true);

    const salesQuery = query(collection(db, 'sales'), where('clientId', '==', customerId));
    const unsubscribeSales = onSnapshot(
      salesQuery,
      (snap) => {
        setSales(snap.docs.map((docSnap) => mapSaleDoc(docSnap.id, docSnap.data())));
      },
      (err) => console.error('Error loading client sales:', err),
    );

    const paymentsQuery = query(collection(db, 'collections'), where('clientId', '==', customerId));
    const unsubscribePayments = onSnapshot(
      paymentsQuery,
      (snap) => {
        setPayments(snap.docs.map((docSnap) => mapPaymentDoc(docSnap.id, docSnap.data())));
        setLoading(false);
      },
      (err) => {
        console.error('Error loading client collections:', err);
        setLoading(false);
      },
    );

    return () => {
      unsubscribeSales();
      unsubscribePayments();
    };
  }, [customerId]);

  return { sales, payments, loading };
}
