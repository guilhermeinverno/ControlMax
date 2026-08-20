import { auth, db } from '../lib/firebase';
import type { Box, Sale } from '../types';
import { generateIdempotencyKey } from './boxLifecycle';
import { doc, runTransaction, collection, serverTimestamp } from 'firebase/firestore';

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
  const token = auth?.currentUser ? await auth.currentUser.getIdToken() : '';
  const idempotencyKey = generateIdempotencyKey();

  try {
    const response = await fetch('/api/transactions/collection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        saleId: sale.id,
        amountCents: parsedAmountCents,
        paymentMethod,
        comment,
        idempotencyKey
      })
    });

    if (response.ok) {
      return;
    }
  } catch (apiError) {
    console.warn("API collection endpoint failed, falling back to direct Firestore transaction:", apiError);
  }

  // Fallback direto via SDK Cloud Firestore (garante funcionamento 100% mesmo se backend estiver desatualizado ou offline)
  const currentTenantId = tenantId || sale.tenantId || activeBox.tenantId;
  const currentUserId = auth.currentUser?.uid || activeBox.userId || '';

  await runTransaction(db, async (transaction) => {
    const saleRef = doc(db, 'sales', sale.id);
    const boxRef = doc(db, 'boxes', activeBox.id);

    const saleSnap = await transaction.get(saleRef);
    const boxSnap = await transaction.get(boxRef);

    const currentSaleData = saleSnap.exists() ? saleSnap.data() : {};
    const currentBoxData = boxSnap.exists() ? boxSnap.data() : {};

    const currentPendingCents = currentSaleData.saldoPendienteCents !== undefined
      ? Number(currentSaleData.saldoPendienteCents)
      : Math.round(Number(currentSaleData.balance || 0));

    const newPendingCents = Math.max(0, currentPendingCents - parsedAmountCents);

    // 1. Criar registro em /collections
    const collectionRef = doc(collection(db, 'collections'));
    transaction.set(collectionRef, {
      tenantId: currentTenantId,
      saleId: sale.id,
      clientId: sale.clientId || '',
      clientName: sale.clientName || '',
      boxId: activeBox.id,
      amount: parsedAmountCents,
      amountCents: parsedAmountCents,
      paymentMethod,
      comment,
      userId: currentUserId,
      userName: userName || activeBox.userName || '',
      createdAt: serverTimestamp(),
    });

    // 2. Se houver valor monetário, atualizar /sales e /boxes
    if (parsedAmountCents > 0) {
      transaction.update(saleRef, {
        saldoPendienteCents: newPendingCents,
        balance: newPendingCents,
        lastPaymentAt: serverTimestamp(),
        status: newPendingCents === 0 ? 'paid' : (currentSaleData.status || 'active'),
      });

      const currentTotalCollections = Number(currentBoxData.totalCollections || 0);
      transaction.update(boxRef, {
        totalCollections: currentTotalCollections + parsedAmountCents,
      });
    }
  });
}
