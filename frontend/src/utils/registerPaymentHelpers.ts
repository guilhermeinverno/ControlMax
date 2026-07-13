import type { DocumentData } from 'firebase/firestore';

export function computePaymentBalances(
  saleData: DocumentData,
  boxData: DocumentData,
  parsedAmountCents: number
) {
  const currentBalance = saleData.saldoPendienteCents || 0;
  const computedNewBalance = Math.max(0, currentBalance - parsedAmountCents);
  const newTotalCollections = (boxData.totalCollections || 0) + parsedAmountCents;
  const newFinalAmount =
    (boxData.initialAmount || 0) +
    newTotalCollections +
    (boxData.totalIncomes || 0) -
    (boxData.totalExpenses || 0) -
    (boxData.totalSales || 0) -
    (boxData.totalTransfers || 0);

  return { computedNewBalance, newTotalCollections, newFinalAmount };
}

export interface CollectionRecordInput {
  tenantId?: string;
  activeBox: { id: string; userName?: string };
  sale: { id: string };
  saleData: DocumentData;
  parsedAmountCents: number;
  paymentMethod: string;
  comment: string;
  userName?: string;
  userId: string;
  registeredBy: string;
}

export function buildCollectionRecord(input: CollectionRecordInput) {
  const {
    tenantId,
    activeBox,
    sale,
    saleData,
    parsedAmountCents,
    paymentMethod,
    comment,
    userName,
    userId,
    registeredBy,
  } = input;

  return {
    tenantId,
    boxId: activeBox.id,
    boxName: activeBox.userName || 'Caja',
    userId,
    userName: userName || registeredBy,
    clientId: saleData.clientId || '',
    clientName: saleData.clientName || '',
    saleId: sale.id,
    amount: parsedAmountCents,
    type: 'collection',
    paymentMethod,
    comment: comment.trim(),
    registeredBy,
    registeredById: userId || 'test-user-id',
  };
}
