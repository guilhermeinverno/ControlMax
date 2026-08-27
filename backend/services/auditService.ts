import { Transaction } from "firebase-admin/firestore";
import {
  AuditAction,
  AuditChange,
  AuditEntity,
  setAuditLogInTransaction,
  writeAuditLog,
} from "../auditLog";

const SKIP_DIFF_FIELDS = new Set([
  "updatedAt",
  "createdAt",
  "openedAt",
  "closedAt",
  "confirmedAt",
  "timestamp",
]);

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function stableStringify(v: unknown): string {
  if (v === undefined) return "__undefined__";
  if (v === null) return "null";
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return JSON.stringify(v);
}

/** Diff raso (1 nível) entre dois objetos — suficiente para auditoria de formulários. */
export function diffObjects(
  oldData: Record<string, unknown> | null | undefined,
  newData: Record<string, unknown> | null | undefined
): AuditChange[] {
  const oldObj = isPlainObject(oldData) ? oldData : {};
  const newObj = isPlainObject(newData) ? newData : {};
  const keys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
  const changes: AuditChange[] = [];

  for (const field of keys) {
    if (SKIP_DIFF_FIELDS.has(field)) continue;
    const oldValue = oldObj[field] ?? null;
    const newValue = Object.prototype.hasOwnProperty.call(newObj, field)
      ? newObj[field] ?? null
      : null;
    if (stableStringify(oldValue) === stableStringify(newValue)) continue;
    changes.push({ field, oldValue, newValue });
  }

  return changes;
}

export interface LogAuditEventInput {
  tenantId: string;
  userId: string;
  userEmail: string;
  action: Extract<AuditAction, "UPDATE" | "DELETE" | "REVERSAL"> | "OVERRIDE";
  entity: AuditEntity;
  entityId: string;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  changes?: AuditChange[];
  reason?: string;
  /** Se informado, grava dentro da transação Firestore. */
  transaction?: Transaction;
}

/**
 * Serviço de auditoria do BFF — calcula diff e grava em `audit_logs`.
 * Retorna o id do log (ou null se não houver mudanças e action for UPDATE).
 */
export async function logAuditEvent(input: LogAuditEventInput): Promise<string | null> {
  const changes =
    input.changes && input.changes.length > 0
      ? input.changes
      : diffObjects(input.oldData, input.newData);

  if (input.action === "UPDATE" && changes.length === 0) {
    return null;
  }

  const payload = {
    tenantId: input.tenantId,
    userId: input.userId,
    userEmail: input.userEmail || "",
    action: input.action,
    entity: input.entity,
    entityId: input.entityId,
    changes,
    reason: input.reason,
  };

  if (input.transaction) {
    return setAuditLogInTransaction(input.transaction, payload);
  }

  return writeAuditLog(payload);
}
