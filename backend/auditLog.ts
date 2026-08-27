import { Transaction } from "firebase-admin/firestore";
import { adminDb } from "./authMiddleware";

export type AuditAction = "UPDATE" | "DELETE" | "REVERSAL" | "OVERRIDE";

export type AuditEntity =
  | "sales"
  | "customers"
  | "boxes"
  | "collections"
  | "platform_settings"
  | "users"
  | "roles";

export interface AuditChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface AuditLogEntry {
  id: string;
  tenantId: string;
  userId: string;
  userEmail: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  changes: AuditChange[];
  reason?: string;
  timestamp: string;
}

export type AuditLogWriteInput = Omit<AuditLogEntry, "id" | "timestamp"> & {
  timestamp?: string;
};

/**
 * Grava entrada canônica em `audit_logs` dentro de uma transação Firestore.
 * Retorna o id do documento criado.
 */
export function setAuditLogInTransaction(
  transaction: Transaction,
  input: AuditLogWriteInput
): string {
  const ref = adminDb.collection("audit_logs").doc();
  const entry: AuditLogEntry = {
    id: ref.id,
    tenantId: input.tenantId,
    userId: input.userId,
    userEmail: input.userEmail || "",
    action: input.action,
    entity: input.entity,
    entityId: input.entityId,
    changes: Array.isArray(input.changes) ? input.changes : [],
    reason: input.reason ? String(input.reason).trim() : undefined,
    timestamp: input.timestamp || new Date().toISOString(),
  };

  const payload: Record<string, unknown> = { ...entry };
  if (!entry.reason) {
    delete payload.reason;
  }

  transaction.set(ref, payload);
  return ref.id;
}

/** Gravação fora de transação (operações admin pontuais). */
export async function writeAuditLog(input: AuditLogWriteInput): Promise<string> {
  const ref = adminDb.collection("audit_logs").doc();
  const entry: AuditLogEntry = {
    id: ref.id,
    tenantId: input.tenantId,
    userId: input.userId,
    userEmail: input.userEmail || "",
    action: input.action,
    entity: input.entity,
    entityId: input.entityId,
    changes: Array.isArray(input.changes) ? input.changes : [],
    reason: input.reason ? String(input.reason).trim() : undefined,
    timestamp: input.timestamp || new Date().toISOString(),
  };

  const payload: Record<string, unknown> = { ...entry };
  if (!entry.reason) {
    delete payload.reason;
  }

  await ref.set(payload);
  return ref.id;
}
