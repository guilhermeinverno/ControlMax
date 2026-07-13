import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type {
  TransferBusinessCenter,
  TransferSalesUser,
  TransferUnitSnapshot,
  UnitTransfer,
} from '../types/transferSales';

interface CreateTransferParams {
  tenantId: string;
  selectedCnId: string;
  selectedUnitIds: string[];
  destinationUserId: string;
  businessCenters: TransferBusinessCenter[];
  users: TransferSalesUser[];
  unitBalances: Record<string, number>;
  unitBoxes: Record<string, 'Abierta' | 'Cerrada'>;
  userName?: string;
  currentUserId?: string;
}

export async function createUnitTransferRequest(params: CreateTransferParams): Promise<string> {
  const sourceCn = params.businessCenters.find((c) => c.id === params.selectedCnId);
  const destUser = params.users.find((u) => u.id === params.destinationUserId);

  if (!sourceCn || !destUser) {
    throw new Error('Centro de Negocios de origen o Usuario destino inválidos.');
  }

  const unitsToTransfer: TransferUnitSnapshot[] = sourceCn.linkedUnits
    .filter((u) => params.selectedUnitIds.includes(u.id))
    .map((u) => ({
      id: u.id,
      name: u.name,
      location: u.location || '',
      balance: params.unitBalances[u.id] || 0,
      boxStatus: params.unitBoxes[u.id] || 'Cerrada',
    }));

  const payload = {
    tenantId: params.tenantId,
    fromCnId: params.selectedCnId,
    fromCnName: sourceCn.name,
    toUserId: params.destinationUserId,
    toUserName: destUser.userName || destUser.displayName || 'Destinatario',
    units: unitsToTransfer,
    status: 'pending' as const,
    createdBy: params.currentUserId || 'system',
    createdByName:
      params.userName ||
      auth.currentUser?.displayName ||
      auth.currentUser?.email?.split('@')[0] ||
      'Administrador',
    createdAt: serverTimestamp(),
  };

  await addDoc(collection(db, 'unit_transfers'), payload);
  return `¡Traslado registrado con éxito! Las ${unitsToTransfer.length} unidades seleccionadas han sido enviadas para la aceptación de ${payload.toUserName}.`;
}

interface AcceptTransferParams {
  tenantId: string;
  transfer: UnitTransfer;
  destCnId: string;
  businessCenters: TransferBusinessCenter[];
  userName?: string;
}

export async function acceptUnitTransfer(params: AcceptTransferParams): Promise<string> {
  const destCn = params.businessCenters.find((c) => c.id === params.destCnId);
  if (!destCn) throw new Error('Centro de Negocios de destino no encontrado.');

  const batch = writeBatch(db);
  const sourceCnDoc = params.businessCenters.find((c) => c.id === params.transfer.fromCnId);

  if (sourceCnDoc) {
    const transferUnitIds = params.transfer.units.map((u) => u.id);
    const updatedSourceUnits = (sourceCnDoc.linkedUnits || []).filter(
      (u) => !transferUnitIds.includes(u.id)
    );
    batch.update(doc(db, 'business_centers', params.transfer.fromCnId), {
      linkedUnits: updatedSourceUnits,
    });
  }

  const newUnitsToAdd = params.transfer.units.map((u) => ({
    id: u.id,
    name: u.name,
    location: u.location || '',
    active: true,
  }));
  const updatedDestUnits = [...(destCn.linkedUnits || []), ...newUnitsToAdd];
  batch.update(doc(db, 'business_centers', params.destCnId), {
    linkedUnits: updatedDestUnits,
  });

  batch.update(doc(db, 'unit_transfers', params.transfer.id), {
    status: 'accepted' as const,
    toCnId: params.destCnId,
    toCnName: destCn.name,
    resolvedAt: serverTimestamp(),
    resolvedBy:
      params.userName ||
      auth.currentUser?.displayName ||
      auth.currentUser?.email?.split('@')[0] ||
      'Usuario',
  });

  const salesSnapshot = await getDocs(
    query(
      collection(db, 'sales'),
      where('tenantId', '==', params.tenantId),
      where('unitId', 'in', params.transfer.units.map((u) => u.id)),
      where('status', '==', 'active')
    )
  );

  salesSnapshot.docs.forEach((saleDoc) => {
    const saleData = saleDoc.data();
    batch.update(doc(db, 'sales', saleDoc.id), {
      userId: params.transfer.toUserId,
      userName: params.transfer.toUserName,
      unitName:
        params.transfer.units.find((u) => u.id === saleData.unitId)?.name || saleData.unitName,
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
  return `¡Unidades aceptadas y reubicadas con éxito en "${destCn.name}"!`;
}

export async function rejectUnitTransfer(transferId: string, userName?: string): Promise<void> {
  await updateDoc(doc(db, 'unit_transfers', transferId), {
    status: 'rejected' as const,
    resolvedAt: serverTimestamp(),
    resolvedBy:
      userName ||
      auth.currentUser?.displayName ||
      auth.currentUser?.email?.split('@')[0] ||
      'Usuario',
  });
}
