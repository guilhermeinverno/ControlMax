import { Timestamp } from 'firebase/firestore';

export interface TransferUnit {
  id: string;
  name: string;
  location: string;
  active: boolean;
}

export interface TransferBusinessCenter {
  id: string;
  name: string;
  code: string;
  status: 'Activo' | 'Inactivo';
  linkedUnits: TransferUnit[];
}

export interface TransferUnitSnapshot {
  id: string;
  name: string;
  location: string;
  balance: number;
  boxStatus: 'Abierta' | 'Cerrada';
}

export interface UnitTransfer {
  id: string;
  tenantId: string;
  fromCnId: string;
  fromCnName: string;
  toUserId: string;
  toUserName: string;
  toCnId?: string;
  toCnName?: string;
  units: TransferUnitSnapshot[];
  status: 'pending' | 'accepted' | 'rejected';
  createdBy: string;
  createdByName: string;
  createdAt: Timestamp;
  resolvedAt?: Timestamp;
  resolvedBy?: string;
}

export interface TransferSalesUser {
  id: string;
  userName: string;
  displayName?: string;
  role: string;
  active: boolean;
}

export type TransferSalesTab = 'transfer' | 'accept' | 'history';
