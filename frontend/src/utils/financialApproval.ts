import { auth } from '../lib/firebase';
import { financialFetchHeaders } from './financialFetchHeaders';

export type ApprovalResourceType = 'expense' | 'bc_expense' | 'bc_income' | 'bc_transfer';
export type ApprovalStatus = 'approved' | 'rejected';

/**
 * Aprova ou rejeita recurso financeiro via BFF (FIN-03).
 */
export async function submitFinancialApproval(
  resourceType: ApprovalResourceType,
  resourceId: string,
  status: ApprovalStatus,
): Promise<void> {
  if (!auth?.currentUser) {
    throw new Error('Usuario no autenticado.');
  }

  const idempotencyKey = crypto.randomUUID();
  const token = await auth.currentUser.getIdToken();

  const response = await fetch('/api/transactions/approval', {
    method: 'POST',
    headers: financialFetchHeaders(token, idempotencyKey),
    body: JSON.stringify({
      resourceType,
      resourceId,
      status,
      idempotencyKey,
    }),
  });

  const data = await response.json().catch(() => ({} as { error?: string }));
  if (!response.ok) {
    throw new Error(data.error || `Erro ao processar aprovação (${response.status}).`);
  }
}
