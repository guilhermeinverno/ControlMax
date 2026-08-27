import { auth } from '../lib/firebase';
import { financialFetchHeaders } from './financialFetchHeaders';
import { submitFinancialApproval } from './financialApproval';

export interface CreateBcTransferInput {
  fromType: 'collector' | 'cn';
  fromName: string;
  toCnId: string;
  toCnName: string;
  amountCents: number;
  description?: string;
  boxId?: string;
}

/** P1-02 — cria transferência CN via BFF */
export async function createBcTransfer(input: CreateBcTransferInput): Promise<{ transferId: string }> {
  if (!auth?.currentUser) {
    throw new Error('Usuario no autenticado.');
  }

  const idempotencyKey = crypto.randomUUID();
  const token = await auth.currentUser.getIdToken();

  const response = await fetch('/api/transactions/bc-transfer', {
    method: 'POST',
    headers: financialFetchHeaders(token, idempotencyKey),
    body: JSON.stringify({
      fromType: input.fromType,
      fromName: input.fromName,
      toCnId: input.toCnId,
      toCnName: input.toCnName,
      amount: input.amountCents,
      description: input.description || '',
      boxId: input.boxId || '',
      idempotencyKey,
    }),
  });

  const data = await response.json().catch(() => ({} as { error?: string; transferId?: string }));
  if (!response.ok) {
    throw new Error(data.error || `Erro ao criar transferência (${response.status}).`);
  }

  return { transferId: String(data.transferId || '') };
}

/** Confirma/rejeita transferência via endpoint de approval (status canônico approved|rejected). */
export async function approveBcTransfer(transferId: string, approve: boolean): Promise<void> {
  await submitFinancialApproval('bc_transfer', transferId, approve ? 'approved' : 'rejected');
}
