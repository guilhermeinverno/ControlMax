import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { hasAdminAccess } from '../types/operational';
import { parseCurrencyBRLToFloat } from './currency';
import { mapExpenseTypeToBcCategory } from './expenseTypeLabels';

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

function resolveApprovalStatus(role?: string, isSuperAdmin?: boolean): 'approved' | 'pending' {
  return hasAdminAccess(role, isSuperAdmin) ? 'approved' : 'pending';
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

async function persistBoxExpense(input: ExpenseFormInput, amountCents: number, status: 'approved' | 'pending') {
  await addDoc(collection(db, 'expenses'), {
    tenantId: input.tenantId,
    boxId: input.selectedBoxId,
    boxName: input.selectedBoxName,
    cnId: input.selectedCnId,
    cnName: input.selectedCnName,
    type: 'expense',
    expenseType: input.expenseType,
    amount: amountCents,
    comment: input.comment.trim(),
    description: input.description.trim(),
    attachmentName: input.fileName,
    attachmentUrl: input.fileUrl,
    status,
    userId: auth?.currentUser?.uid || 'test-user-id',
    userName: input.userName || auth?.currentUser?.email || 'Usuario',
    requestedBy: input.userName || auth?.currentUser?.email || 'Usuario',
    requestedById: auth?.currentUser?.uid || 'test-user-id',
    createdAt: serverTimestamp(),
  });

  const boxRef = doc(db, 'boxes', input.selectedBoxId);
  const boxSnap = await getDoc(boxRef);
  if (!boxSnap.exists()) return;

  const boxData = boxSnap.data();
  const newExpenses = (boxData.totalExpenses || 0) + amountCents;
  const finalAmount =
    (boxData.initialAmount || 0) +
    (boxData.totalCollections || 0) +
    (boxData.totalIncomes || 0) -
    newExpenses -
    (boxData.totalSales || 0) -
    (boxData.totalTransfers || 0);

  await updateDoc(boxRef, {
    totalExpenses: newExpenses,
    finalAmount,
  });
}

async function persistBcWithdrawal(input: ExpenseFormInput, amountCents: number, status: 'approved' | 'pending') {
  await addDoc(collection(db, 'bc_expenses'), {
    tenantId: input.tenantId,
    cnId: input.selectedCnId,
    cnName: input.selectedCnName,
    userId: auth.currentUser?.uid || 'unknown',
    userName:
      input.userName ||
      auth.currentUser?.displayName ||
      auth.currentUser?.email?.split('@')[0] ||
      'Usuario',
    amount: amountCents,
    description: input.description.trim(),
    comment: input.comment.trim(),
    category: mapExpenseTypeToBcCategory(input.expenseType),
    expenseType: input.expenseType,
    status,
    attachmentName: input.fileName,
    attachmentUrl: input.fileUrl,
    createdAt: serverTimestamp(),
  });
}

export async function persistExpense(input: ExpenseFormInput): Promise<'approved' | 'pending'> {
  const amountCents = Math.round(parseCurrencyBRLToFloat(input.amount) * 100);
  const status = resolveApprovalStatus(input.role, input.isSuperAdmin);

  if (input.egresoMode === 'gasto') {
    await persistBoxExpense(input, amountCents, status);
  } else {
    await persistBcWithdrawal(input, amountCents, status);
  }

  return status;
}
