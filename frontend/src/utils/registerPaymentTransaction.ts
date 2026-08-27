import { auth } from '../lib/firebase';
import type { Box, Sale } from '../types';
import { generateIdempotencyKey } from './boxLifecycle';
import { financialFetchHeaders } from './financialFetchHeaders';
import { SyncManager } from './syncManager';
import { syncExecutor } from './sync/setupSync';
import type { PaymentPayload } from '../types/syncPayloads';

interface RegisterPaymentTransactionInput {
  tenantId?: string;
  activeBox: Box;
  sale: Sale;
  parsedAmountCents: number;
  paymentMethod: string;
  comment: string;
  userName?: string;
}

export interface RegisterPaymentResult {
  queued: boolean;
}

function isRetryableHttpStatus(status: number): boolean {
  return status >= 500 || status === 408 || status === 429;
}

function isBusinessError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message;
  return (
    msg.startsWith('Erro ao registrar') ||
    msg.includes('obrigatór') ||
    msg.includes('inválid') ||
    msg.includes('não identific') ||
    msg.includes('não autenticado') ||
    msg.includes('Caixa aberta')
  );
}

/**
 * Registra cobrança/visita via BFF. Em falha de rede/offline, enfileira no SyncManager.
 * Nunca grava diretamente em `collections` pelo client SDK (FIN-02).
 */
export async function executeRegisterPaymentTransaction({
  tenantId,
  activeBox,
  sale,
  parsedAmountCents,
  paymentMethod,
  comment,
}: RegisterPaymentTransactionInput): Promise<RegisterPaymentResult> {
  const currentTenantId = String(tenantId || sale.tenantId || activeBox.tenantId || '').trim();
  const currentUserId = String(auth?.currentUser?.uid || activeBox.userId || '').trim();
  const currentSaleId = String(sale.id || '').trim();
  const currentClientId = String(sale.clientId || '').trim();
  const currentBoxId = String(activeBox.id || '').trim();
  const safePaymentMethod = String(paymentMethod || 'efectivo').trim();
  const safeComment = String(comment || '').trim();

  if (!currentTenantId) {
    throw new Error('Tenant não identificado para registrar o recebimento.');
  }
  if (!currentUserId) {
    throw new Error('Usuário não autenticado para registrar o recebimento.');
  }
  if (!currentSaleId) {
    throw new Error('Venda não identificada para registrar o recebimento.');
  }
  if (!currentBoxId) {
    throw new Error('Caixa aberta obrigatória para registrar o recebimento ou visita.');
  }
  if (!Number.isFinite(parsedAmountCents) || parsedAmountCents < 0) {
    throw new Error('Valor monetário inválido.');
  }

  const idempotencyKey = generateIdempotencyKey();
  const paymentPayload: PaymentPayload = {
    id: idempotencyKey,
    tenantId: currentTenantId,
    boxId: currentBoxId,
    customerId: currentClientId || 'unknown',
    amountCents: parsedAmountCents,
    paymentMethod: safePaymentMethod,
    referenceSaleId: currentSaleId,
    comment: safeComment,
    createdAt: new Date().toISOString(),
  };

  const online = typeof navigator === 'undefined' || navigator.onLine;

  if (online && auth?.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/transactions/collection', {
        method: 'POST',
        headers: financialFetchHeaders(token, idempotencyKey),
        body: JSON.stringify({
          saleId: currentSaleId,
          amountCents: parsedAmountCents,
          paymentMethod: safePaymentMethod,
          comment: safeComment,
          idempotencyKey,
        }),
      });

      if (response.ok) {
        return { queued: false };
      }

      const errorBody = await response.json().catch(() => ({} as { error?: string }));
      if (!isRetryableHttpStatus(response.status)) {
        throw new Error(errorBody.error || `Erro ao registrar recebimento (${response.status}).`);
      }

      console.warn(
        `[FIN-02] BFF collection retornou ${response.status}; enfileirando no SyncManager.`
      );
    } catch (err) {
      if (isBusinessError(err)) throw err;
      console.warn('[FIN-02] API collection inacessível; enfileirando no SyncManager:', err);
    }
  }

  await SyncManager.enqueue('payment', paymentPayload, currentTenantId, currentUserId);

  if (online) {
    setTimeout(() => {
      syncExecutor.processAll().catch((syncErr) => {
        console.error('[FIN-02] Erro ao processar fila após enqueue de payment:', syncErr);
      });
    }, 0);
  }

  return { queued: true };
}
