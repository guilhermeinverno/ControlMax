/**
 * Modelo canônico de auditoria imutável (`audit_logs`).
 * Escritas apenas via Admin SDK / BFF.
 */

export type AuditAction = 'UPDATE' | 'DELETE' | 'REVERSAL' | 'OVERRIDE';

export type AuditEntity =
  | 'sales'
  | 'customers'
  | 'boxes'
  | 'collections'
  | 'platform_settings'
  | 'users'
  | 'roles';

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
  /** Justificativa obrigatória em mutações sensíveis (estorno, override, etc.). */
  reason?: string;
  timestamp: string;
}

export type AuditLogWriteInput = Omit<AuditLogEntry, 'id' | 'timestamp'> & {
  timestamp?: string;
};
