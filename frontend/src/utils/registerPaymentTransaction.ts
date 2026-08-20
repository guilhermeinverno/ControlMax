import { auth, db } from '../lib/firebase';
import type { Box, Sale } from '../types';
import { generateIdempotencyKey } from './boxLifecycle';
import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { SyncManager } from './syncManager';

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

  const currentTenantId = String(tenantId || sale.tenantId || activeBox.tenantId || '').trim();
  const currentUserId = String(auth?.currentUser?.uid || activeBox.userId || '').trim();
  const currentUserName = String(userName || activeBox.userName || auth?.currentUser?.displayName || '').trim();
  const currentSaleId = String(sale.id || '').trim();
  const currentClientId = String(sale.clientId || '').trim();
  const currentClientName = String(sale.clientName || '').trim();
  const currentBoxId = String(activeBox.id || '').trim();
  const safePaymentMethod = String(paymentMethod || 'efectivo').trim();
  const safeComment = String(comment || '').trim();

  // 1. Tentar chamada à API do Backend
  try {
    const response = await fetch('/api/transactions/collection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify({
        saleId: currentSaleId,
        amountCents: parsedAmountCents,
        paymentMethod: safePaymentMethod,
        comment: safeComment,
        idempotencyKey
      })
    });

    if (response.ok) {
      return;
    }
  } catch (apiError) {
    console.warn("API collection endpoint inaccessible, attempting Firestore direct save:", apiError);
  }

  // 2. Tentar gravação direta no Cloud Firestore
  try {
    const collectionRef = doc(collection(db, 'collections'));
    const collectionPayload: Record<string, any> = {
      tenantId: currentTenantId,
      saleId: currentSaleId,
      clientId: currentClientId,
      clientName: currentClientName,
      boxId: currentBoxId,
      amount: parsedAmountCents,
      amountCents: parsedAmountCents,
      paymentMethod: safePaymentMethod,
      comment: safeComment,
      userId: currentUserId,
      userName: currentUserName,
      createdAt: serverTimestamp(),
    };

    await setDoc(collectionRef, collectionPayload);
    return;
  } catch (firestoreError) {
    console.warn("Direct Firestore setDoc failed, enqueuing via SyncManager for offline resilience:", firestoreError);
  }

  // 3. Fallback de contingência absoluta (SyncManager IndexedDB)
  await SyncManager.enqueue(
    'payment',
    {
      saleId: currentSaleId,
      amountCents: parsedAmountCents,
      paymentMethod: safePaymentMethod,
      comment: safeComment,
      idempotencyKey
    },
    currentTenantId,
    currentUserId
  );
}
