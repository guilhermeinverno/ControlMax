import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { SaleDetailRecord, SalePaymentRecord } from '../types/saleDetail';

function mapSaleDoc(docSnap: { id: string; data: () => Record<string, unknown> }): SaleDetailRecord {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    clientName: String(data.clientName || ''),
    score: String(data.score || 'N'),
    unidade: String(data.unidade || ''),
    createdAt: data.createdAt || '',
    valor: String(data.valor || '0,00'),
    interes: String(data.interes || '0,0%'),
    saldoTotal: String(data.saldoTotal || '0,00'),
    saldoPendiente: String(data.saldoPendiente || '0,00'),
    saldoTotalCents: Number(data.saldoTotalCents || 0),
    saldoPendienteCents:
      data.saldoPendienteCents !== undefined ? Number(data.saldoPendienteCents) : 0,
    status: String(data.status || 'active'),
    idPreVenta: String(data.idPreVenta || ''),
  };
}

function mapPaymentDoc(docSnap: { id: string; data: () => Record<string, unknown> }): SalePaymentRecord {
  const data = docSnap.data();
  let dateStr = 'Reciente';
  const createdAt = data.createdAt as { toDate?: () => Date } | undefined;
  if (createdAt && typeof createdAt.toDate === 'function') {
    const date = createdAt.toDate();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    dateStr = `${day}/${month}`;
  }

  return {
    id: docSnap.id,
    date: dateStr,
    amount: Number(data.amount || 0),
    userName: String(data.registeredBy || 'vend_01'),
    status: 'OK',
  };
}

export function useSaleDetailData(saleId?: string, tenantId?: string) {
  const [sale, setSale] = useState<SaleDetailRecord | null>(null);
  const [payments, setPayments] = useState<SalePaymentRecord[]>([]);
  const [loading, setLoading] = useState(!!saleId);

  useEffect(() => {
    if (!saleId || !tenantId) {
      setLoading(false);
      return;
    }

    const unsubscribeSale = onSnapshot(
      doc(db, 'sales', saleId),
      (docSnap) => {
        if (docSnap.exists()) {
          setSale(mapSaleDoc(docSnap));
        } else {
          console.warn('Sale not found with ID:', saleId);
          setSale(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching sale detail:', error);
        setLoading(false);
      }
    );

    const qPayments = query(
      collection(db, 'collections'),
      where('tenantId', '==', tenantId),
      where('saleId', '==', saleId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribePayments = onSnapshot(
      qPayments,
      (snapshot) => setPayments(snapshot.docs.map(mapPaymentDoc)),
      (error) => console.error('Error fetching payments history:', error)
    );

    return () => {
      unsubscribeSale();
      unsubscribePayments();
    };
  }, [saleId, tenantId]);

  return { sale, payments, loading };
}
