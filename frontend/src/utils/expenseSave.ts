import { auth } from '../lib/firebase';
import { hasAdminAccess } from '../types/operational';
import { parseCurrencyBRLToFloat } from './currency';
import { mapExpenseTypeToBcCategory } from './expenseTypeLabels';
import { financialFetchHeaders } from './financialFetchHeaders';

export interface ExpenseFormInput {
  tenantId?: string;
  egresoMode: 'gasto' | 'retiro';
  selectedCnId: string;
  selectedCnName: string;
  selectedBoxId: string;
  selectedBoxName: string;
  expenseType: string;
  amount: string;
  comment: string;
  description: string;
  fileName: string;
  fileUrl: string;
  userName?: string;
  role?: string;
  isSuperAdmin?: boolean;
}

export function validateExpenseForm(input: ExpenseFormInput): string | null {
  if (!input.tenantId) return 'No se ha configurado el inquilino.';
  if (!input.selectedCnId) return 'Seleccione un Centro de Negocios.';
  if (input.egresoMode === 'gasto' && !input.selectedBoxId) {
    return 'Debe seleccionar una Caja abierta.';
  }
  if (!input.expenseType) return 'Seleccione un tipo de egreso.';

  const value = parseCurrencyBRLToFloat(input.amount);
  if (value <= 0) return 'El valor del egreso debe ser mayor que cero.';
  if (!input.comment.trim()) return 'El comentario es obligatorio.';
  if (!input.description.trim()) return 'La descripción es obligatoria.';

  return null;
}

export function expenseSuccessMessage(
  egresoMode: 'gasto' | 'retiro',
  isApproved: 'approved' | 'pending',
): string {
  if (egresoMode === 'gasto') {
    return isApproved === 'approved'
      ? '¡Gasto registrado y caja actualizada correctamente!'
      : '¡Solicitud de gasto enviada correctamente!';
  }

  return isApproved === 'approved'
    ? '¡Retiro de CN Principal registrado correctamente!'
    : '¡Solicitud de retiro de CN Principal enviada correctamente!';
}

/**
 * Persiste despesa/retiro via BFF (FIN-03). Sem writes client em expenses/bc_expenses/boxes.
 */
export async function persistExpense(input: ExpenseFormInput): Promise<'approved' | 'pending'> {
  if (!auth?.currentUser) {
    throw new Error('Usuario no autenticado.');
  }

  const amountCents = Math.round(parseCurrencyBRLToFloat(input.amount) * 100);
  const fallbackStatus = hasAdminAccess(input.role, input.isSuperAdmin) ? 'approved' : 'pending';
  const idempotencyKey = crypto.randomUUID();
  const token = await auth.currentUser.getIdToken();

  const response = await fetch('/api/transactions/expense', {
    method: 'POST',
    headers: financialFetchHeaders(token, idempotencyKey),
    body: JSON.stringify({
      mode: input.egresoMode,
      boxId: input.selectedBoxId,
      boxName: input.selectedBoxName,
      cnId: input.selectedCnId,
      cnName: input.selectedCnName,
      expenseType: input.expenseType,
      amountCents,
      comment: input.comment.trim(),
      description: input.description.trim(),
      attachmentName: input.fileName,
      attachmentUrl: input.fileUrl,
      category: mapExpenseTypeToBcCategory(input.expenseType),
      idempotencyKey,
    }),
  });

  const data = await response.json().catch(() => ({} as { error?: string; status?: string }));
  if (!response.ok) {
    throw new Error(data.error || `Erro ao registrar egreso (${response.status}).`);
  }

  const status = data.status === 'approved' || data.status === 'pending' ? data.status : fallbackStatus;
  return status;
}
