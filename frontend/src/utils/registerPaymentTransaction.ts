import { auth } from '../lib/firebase';
import type { Box, Sale } from '../types';
import { generateIdempotencyKey } from './boxLifecycle';

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

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro do servidor (${response.status}) ao registrar recebimento.`);
  }
}
