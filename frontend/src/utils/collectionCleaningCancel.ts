import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { CleaningCollection } from '../types/collectionCleaning';

export async function cancelCollectionAndUpdateBox(
  collectionToCancel: CleaningCollection,
  cancelReason: string,
  userName?: string
): Promise<void> {
  await updateDoc(doc(db, 'collections', collectionToCancel.id), {
    status: 'cancelled',
    cancelReason,
    cancelledBy: userName || 'Admin/Supervisor',
    cancelledAt: serverTimestamp(),
  });

  const boxRef = doc(db, 'boxes', collectionToCancel.boxId);
  const boxSnap = await getDoc(boxRef);
  if (!boxSnap.exists()) return;

  const boxData = boxSnap.data();
  const newTotal = Math.max(0, (boxData.totalCollections || 0) - collectionToCancel.amount);
  const newFinal =
    (boxData.initialAmount || 0) +
    newTotal +
    (boxData.totalIncomes || 0) -
    (boxData.totalExpenses || 0) -
    (boxData.totalSales || 0) -
    (boxData.totalTransfers || 0);

  await updateDoc(boxRef, { totalCollections: newTotal, finalAmount: newFinal });
}
