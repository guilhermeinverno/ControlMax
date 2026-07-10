import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { Box, Sale } from '../types';
import { buildCollectionRecord, computePaymentBalances } from './registerPaymentHelpers';

interface RegisterPaymentTransactionInput {
  tenantId?: string;
  activeBox: Box;
  sale: Sale;
  parsedAmountCents: number;
  paymentMethod: string;
  comment: string;
  userName?: string;
}

export async function executeRegisterPaymentTransaction({
  tenantId,
  activeBox,
  sale,
  parsedAmountCents,
  paymentMethod,
  comment,
  userName,
}: RegisterPaymentTransactionInput): Promise<void> {
  const saleRef = doc(db, 'sales', sale.id);
  const boxRef = doc(db, 'boxes', activeBox.id);
  const collectionRef = doc(collection(db, 'collections'));
  const registeredBy = userName || auth?.currentUser?.email || 'Usuario';
  const userId = auth.currentUser?.uid || '';

  await runTransaction(db, async (transaction) => {
    const saleSnap = await transaction.get(saleRef);
    if (!saleSnap.exists()) throw new Error('Venda não encontrada');

    const boxSnap = await transaction.get(boxRef);
    if (!boxSnap.exists()) throw new Error('Caixa não encontrada');

    const saleData = saleSnap.data();
    const boxData = boxSnap.data();
    const { computedNewBalance, newTotalCollections, newFinalAmount } = computePaymentBalances(
      saleData,
      boxData,
      parsedAmountCents
    );

    transaction.set(collectionRef, {
      ...buildCollectionRecord({
        tenantId,
        activeBox,
        sale,
        saleData,
        parsedAmountCents,
        paymentMethod,
        comment,
        userName,
        userId,
        registeredBy,
      }),
      createdAt: serverTimestamp(),
    });

    transaction.update(saleRef, {
      saldoPendienteCents: computedNewBalance,
      saldoPendiente: (computedNewBalance / 100).toFixed(2),
      status: computedNewBalance <= 0 ? 'completed' : saleData.status,
    });

    transaction.update(boxRef, {
      totalCollections: newTotalCollections,
      finalAmount: newFinalAmount,
    });
  });
}
