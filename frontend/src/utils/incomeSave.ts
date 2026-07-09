import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { OpenBoxOption } from '../types/operational';
import { parseCurrencyBRLToFloat } from './currency';
import { isSaleIncomeType } from './incomeTypeLabels';

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

function buildIncomePayload(input: IncomeFormInput, box: OpenBoxOption, amountCents: number) {
  const payload: Record<string, unknown> = {
    tenantId: input.tenantId,
    boxId: box.id,
    boxName: box.userName || 'Caja',
    cnId: box.cnId || '',
    cnName: box.cnName || '',
    type: 'income',
    incomeType: input.incomeType,
    amount: amountCents,
    comment: input.comment.trim(),
    description: input.description.trim(),
    attachmentName: input.fileName,
    attachmentUrl: input.fileUrl,
    userId: auth?.currentUser?.uid || 'test-user-id',
    userName: input.userName || auth?.currentUser?.email || 'Usuario',
    registeredBy: input.userName || auth?.currentUser?.email || 'Usuario',
    registeredById: auth?.currentUser?.uid || 'test-user-id',
    createdAt: serverTimestamp(),
  };

  if (isSaleIncomeType(input.incomeType)) {
    payload.saleId = input.selectedSaleId;
    payload.saleClientName = input.selectedSaleName;
  }

  return payload;
}

async function updateBoxIncomeTotals(boxId: string, amountCents: number): Promise<void> {
  const boxRef = doc(db, 'boxes', boxId);
  const boxSnap = await getDoc(boxRef);
  if (!boxSnap.exists()) return;

  const boxData = boxSnap.data();
  const newIncomes = (boxData.totalIncomes || 0) + amountCents;
  const finalAmount =
    (boxData.initialAmount || 0) +
    (boxData.totalCollections || 0) +
    newIncomes -
    (boxData.totalExpenses || 0) -
    (boxData.totalSales || 0) -
    (boxData.totalTransfers || 0);

  await updateDoc(boxRef, {
    totalIncomes: newIncomes,
    finalAmount,
  });
}

export async function persistIncomeAndUpdateBox(input: IncomeFormInput): Promise<void> {
  const box = input.currentSelectedBox;
  if (!box) {
    throw new Error('La unidad seleccionada debe tener la caja abierta para registrar un ingreso.');
  }

  const amountCents = Math.round(parseCurrencyBRLToFloat(input.amount) * 100);
  await addDoc(collection(db, 'incomes'), buildIncomePayload(input, box, amountCents));
  await updateBoxIncomeTotals(box.id, amountCents);
}
