import { Transaction } from "firebase-admin/firestore";
import { adminDb } from "../authMiddleware";

/** Coleção append-only — modo sombra (ENT-02). Não altera saldos por documento. */
export const LEDGER_SHADOW_COLLECTION = "ledger_shadow";

export type LedgerSource =
  | "sale"
  | "collection"
  | "reversal"
  | "adjustment"
  | "expense"
  | "income"
  | "approval"
  | "bc_transfer"
  | "box_open"
  | "box_close"
  | "box_open_batch"
  | "box_close_batch";

export interface LedgerShadowEntry {
  id: string;
  tenantId: string;
  /** Chave de correlação (idempotencyKey ou id da entidade). */
  transactionId: string;
  debitAccount: string;
  creditAccount: string;
  amountCents: number;
  source: LedgerSource;
  boxId?: string;
  saleId?: string;
  entityId?: string;
  userId?: string;
  mode: "shadow";
  timestamp: string;
}

export type LedgerShadowWriteInput = Omit<LedgerShadowEntry, "id" | "timestamp" | "mode"> & {
  timestamp?: string;
};

export function accountCaixa(boxId: string): string {
  return `caixa:${boxId}`;
}

export function accountRecebiveis(saleId: string): string {
  return `recebiveis:${saleId}`;
}

export function accountCn(cnId: string): string {
  return `cn:${cnId || "unknown"}`;
}

export function accountDespesas(tipo?: string): string {
  return tipo ? `despesas:${tipo}` : "despesas";
}

export function accountReceitas(tipo?: string): string {
  return tipo ? `receitas:${tipo}` : "receitas";
}

export const ACCOUNT_AJUSTE_CAIXA = "ajuste_caixa";
export const ACCOUNT_DIFERENCA_CAIXA = "diferenca_caixa";
export const ACCOUNT_TRANSFERENCIAS_CN = "transferencias_cn";

function buildEntry(input: LedgerShadowWriteInput, id: string): LedgerShadowEntry {
  const amountCents = Math.round(Number(input.amountCents));
  return {
    id,
    tenantId: input.tenantId,
    transactionId: String(input.transactionId),
    debitAccount: String(input.debitAccount),
    creditAccount: String(input.creditAccount),
    amountCents,
    source: input.source,
    boxId: input.boxId ? String(input.boxId) : undefined,
    saleId: input.saleId ? String(input.saleId) : undefined,
    entityId: input.entityId ? String(input.entityId) : undefined,
    userId: input.userId ? String(input.userId) : undefined,
    mode: "shadow",
    timestamp: input.timestamp || new Date().toISOString(),
  };
}

function toFirestorePayload(entry: LedgerShadowEntry): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...entry };
  if (!entry.boxId) delete payload.boxId;
  if (!entry.saleId) delete payload.saleId;
  if (!entry.entityId) delete payload.entityId;
  if (!entry.userId) delete payload.userId;
  return payload;
}

/**
 * Grava lançamento duplo (débito/crédito) dentro da mesma transação Firestore da mutação.
 * Ignora amountCents <= 0 (ex.: visita sem pagamento).
 */
export function setLedgerShadowInTransaction(
  transaction: Transaction,
  input: LedgerShadowWriteInput
): string | null {
  const amountCents = Math.round(Number(input.amountCents));
  if (!Number.isFinite(amountCents) || amountCents <= 0) return null;
  if (!input.tenantId || !input.transactionId || !input.debitAccount || !input.creditAccount) {
    return null;
  }

  const ref = adminDb.collection(LEDGER_SHADOW_COLLECTION).doc();
  const entry = buildEntry({ ...input, amountCents }, ref.id);
  transaction.set(ref, toFirestorePayload(entry));
  return ref.id;
}

/** Gravação fora de transação (batch pós-commit / scripts). */
export async function writeLedgerShadow(input: LedgerShadowWriteInput): Promise<string | null> {
  const amountCents = Math.round(Number(input.amountCents));
  if (!Number.isFinite(amountCents) || amountCents <= 0) return null;
  if (!input.tenantId || !input.transactionId || !input.debitAccount || !input.creditAccount) {
    return null;
  }

  const ref = adminDb.collection(LEDGER_SHADOW_COLLECTION).doc();
  const entry = buildEntry({ ...input, amountCents }, ref.id);
  await ref.set(toFirestorePayload(entry));
  return ref.id;
}

export interface BoxShadowReconcileResult {
  boxId: string;
  tenantId: string;
  /** Saldo esperado do documento `boxes` (finalAmount). */
  boxFinalAmountCents: number;
  /** initialAmount do caixa (fundo). */
  boxInitialAmountCents: number;
  /** Soma líquida do ledger em `caixa:{boxId}` (débito − crédito). */
  ledgerCaixaNetCents: number;
  /**
   * Diferença: ledgerCaixaNet − boxFinalAmount.
   * Em sombra saudável deve ser ~0 (após open + todas as ops).
   */
  deltaCents: number;
  entryCount: number;
  consistent: boolean;
}

/**
 * Compara saldo do documento `boxes` com o net do ledger sombra na conta caixa.
 * Net caixa = Σ débitos em caixa:* − Σ créditos em caixa:*.
 */
export async function reconcileBoxShadow(
  tenantId: string,
  boxId: string
): Promise<BoxShadowReconcileResult> {
  const boxSnap = await adminDb.collection("boxes").doc(boxId).get();
  if (!boxSnap.exists) {
    throw new Error("Caixa não encontrada.");
  }
  const box = boxSnap.data() || {};
  if (box.tenantId !== tenantId) {
    throw new Error("Acesso negado: inconsistência de tenant.");
  }

  const caixa = accountCaixa(boxId);
  const [debitSnap, creditSnap] = await Promise.all([
    adminDb
      .collection(LEDGER_SHADOW_COLLECTION)
      .where("tenantId", "==", tenantId)
      .where("debitAccount", "==", caixa)
      .get(),
    adminDb
      .collection(LEDGER_SHADOW_COLLECTION)
      .where("tenantId", "==", tenantId)
      .where("creditAccount", "==", caixa)
      .get(),
  ]);

  let debitSum = 0;
  let creditSum = 0;
  debitSnap.docs.forEach((d) => {
    debitSum += Math.round(Number(d.data().amountCents || 0));
  });
  creditSnap.docs.forEach((d) => {
    creditSum += Math.round(Number(d.data().amountCents || 0));
  });

  const ledgerCaixaNetCents = debitSum - creditSum;
  const boxFinalAmountCents = Math.round(Number(box.finalAmount || 0));
  const boxInitialAmountCents = Math.round(Number(box.initialAmount || 0));
  const deltaCents = ledgerCaixaNetCents - boxFinalAmountCents;

  return {
    boxId,
    tenantId,
    boxFinalAmountCents,
    boxInitialAmountCents,
    ledgerCaixaNetCents,
    deltaCents,
    entryCount: debitSnap.size + creditSnap.size,
    consistent: deltaCents === 0,
  };
}
