import { auth, db } from '../lib/firebase';
import type { Box, Sale } from '../types';
import { generateIdempotencyKey } from './boxLifecycle';
import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';

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

  // Fallback direto via SDK Cloud Firestore (respeitando as firestore.rules que permitem allow create em /collections)
  const currentTenantId = tenantId || sale.tenantId || activeBox.tenantId;
  const currentUserId = auth.currentUser?.uid || activeBox.userId || '';

  // 1. Gravar documento de visita na coleção /collections (Permitido pelas firestore.rules no client-side)
  const collectionRef = doc(collection(db, 'collections'));
  await setDoc(collectionRef, {
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
}
