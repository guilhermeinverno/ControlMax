import { auth } from '../lib/firebase';
import { OpenBoxOption } from '../types/operational';
import { parseCurrencyBRLToFloat } from './currency';
import { isSaleIncomeType } from './incomeTypeLabels';
import { financialFetchHeaders } from './financialFetchHeaders';

export interface IncomeFormInput {
  tenantId?: string;
  currentSelectedBox?: OpenBoxOption | null;
  incomeType: string;
  selectedSaleId: string;
  selectedSaleName: string;
  amount: string;
  comment: string;
  description: string;
  fileName: string;
  fileUrl: string;
  userName?: string;
}

export function validateIncomeForm(input: IncomeFormInput): string | null {
  if (!input.tenantId) return 'No se ha configurado el inquilino.';
  if (!input.currentSelectedBox) {
    return 'La unidad seleccionada debe tener la caja abierta para registrar un ingreso.';
  }
  if (!input.incomeType) return 'Seleccione un tipo de ingreso.';
  if (isSaleIncomeType(input.incomeType) && !input.selectedSaleId) return 'Seleccione un Id de Venta.';

  const value = parseCurrencyBRLToFloat(input.amount);
  if (value <= 0) return 'El valor del ingreso debe ser mayor que cero.';
  if (!input.comment.trim()) return 'El comentario es obligatorio.';

  return null;
}

/**
 * Persiste ingresso de caixa via BFF (FIN-03). Sem writes client em incomes/boxes.
 */
export async function persistIncomeAndUpdateBox(input: IncomeFormInput): Promise<void> {
  const box = input.currentSelectedBox;
  if (!box) {
    throw new Error('La unidad seleccionada debe tener la caja abierta para registrar un ingreso.');
  }
  if (!auth?.currentUser) {
    throw new Error('Usuario no autenticado.');
  }

  const amountCents = Math.round(parseCurrencyBRLToFloat(input.amount) * 100);
  const idempotencyKey = crypto.randomUUID();
  const token = await auth.currentUser.getIdToken();

  const body: Record<string, unknown> = {
    mode: 'box',
    boxId: box.id,
    boxName: box.userName || 'Caja',
    cnId: box.cnId || '',
    cnName: box.cnName || '',
    incomeType: input.incomeType,
    amountCents,
    comment: input.comment.trim(),
    description: input.description.trim(),
    attachmentName: input.fileName,
    attachmentUrl: input.fileUrl,
    idempotencyKey,
  };

  if (isSaleIncomeType(input.incomeType)) {
    body.saleId = input.selectedSaleId;
    body.saleClientName = input.selectedSaleName;
  }

  const response = await fetch('/api/transactions/income', {
    method: 'POST',
    headers: financialFetchHeaders(token, idempotencyKey),
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({} as { error?: string }));
  if (!response.ok) {
    throw new Error(data.error || `Erro ao registrar ingreso (${response.status}).`);
  }
}
