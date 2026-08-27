import { getErrorMessage } from '../utils/errorMessage';
import { logFirestoreError, type FirestoreOperationType } from '../utils/firestoreError';
import { auth } from '../lib/firebase';
import { Box } from '../types';
import { financialFetchHeaders } from './financialFetchHeaders';

export interface OpenBoxParams {
  date: string;
  unitId: string;
  unitName: string;
  cnId: string;
  cnName: string;
  initialAmount: number;
  observation?: string;
}

export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'cm-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now().toString(36);
}

export async function createOpenBox(
  tenantId: string,
  userId: string,
  userName: string | undefined,
  params: OpenBoxParams
): Promise<void> {
  const token = auth?.currentUser ? await auth.currentUser.getIdToken() : '';
  const idempotencyKey = generateIdempotencyKey();

  const response = await fetch('/api/boxes/open', {
    method: 'POST',
    headers: financialFetchHeaders(token, idempotencyKey),
    body: JSON.stringify({
      unitId: params.unitId,
      unitName: params.unitName,
      cnId: params.cnId,
      cnName: params.cnName,
      initialAmount: params.initialAmount,
      observation: params.observation,
      date: params.date,
      idempotencyKey
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro do servidor (${response.status}) ao abrir caixa.`);
  }
}

export async function closeActiveBox(activeBox: Box, realFinalAmount: number): Promise<void> {
  const token = auth?.currentUser ? await auth.currentUser.getIdToken() : '';
  const idempotencyKey = generateIdempotencyKey();

  const response = await fetch('/api/boxes/close', {
    method: 'POST',
    headers: financialFetchHeaders(token, idempotencyKey),
    body: JSON.stringify({
      boxId: activeBox.id,
      realFinalAmount,
      idempotencyKey
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro do servidor (${response.status}) ao fechar caixa.`);
  }
}

export async function confirmBoxByAdmin(boxId: string, tenantId?: string): Promise<void> {
  const token = auth?.currentUser ? await auth.currentUser.getIdToken() : '';
  const idempotencyKey = generateIdempotencyKey();

  const response = await fetch('/api/boxes/confirm', {
    method: 'POST',
    headers: financialFetchHeaders(token, idempotencyKey),
    body: JSON.stringify({
      boxId,
      idempotencyKey
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro do servidor (${response.status}) ao confirmar caixa.`);
  }
}

export async function checkBoxIsMutable(boxId: string): Promise<void> {
  // Chamada de validação apenas local. O caixa confirmado é imutável
  // Como as regras do Firestore barram writes, e o BFF valida o status !== 'confirmed',
  // podemos manter a checagem client-side se necessário, mas as rotas BFF já cobrem isso.
}

export function logBoxError(err: unknown, operation: FirestoreOperationType, path: string): string {
  const msg = getErrorMessage(err);
  logFirestoreError(err, operation, path, { throwError: true });
  return msg;
}
