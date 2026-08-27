import { Transaction } from "firebase-admin/firestore";
import { adminDb } from "../authMiddleware";

/**
 * Coleção append-only do ledger (ENT-02 sombra → ENT-09 cutover).
 * Nome histórico `ledger_shadow`; o campo `mode` distingue sombra vs canônico.
 */
export const LEDGER_SHADOW_COLLECTION = "ledger_shadow";

export type LedgerWriteMode = "shadow" | "canonical";
/** Política global de escrita (env `LEDGER_MODE`). */
export type LedgerModePolicy = "shadow" | "dual" | "canonical";

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
  mode: LedgerWriteMode;
  timestamp: string;
}

export type LedgerShadowWriteInput = Omit<LedgerShadowEntry, "id" | "timestamp" | "mode"> & {
  timestamp?: string;
  mode?: LedgerWriteMode;
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

/** Default `shadow`. `dual` grava sombra+canônico; `canonical` desliga sombra em novos writes. */
export function getLedgerModePolicy(): LedgerModePolicy {
  const raw = String(process.env.LEDGER_MODE || "shadow").toLowerCase().trim();
  if (raw === "dual" || raw === "canonical") return raw;
  return "shadow";
}

export function ledgerWriteModesForPolicy(policy: LedgerModePolicy = getLedgerModePolicy()): LedgerWriteMode[] {
  if (policy === "dual") return ["shadow", "canonical"];
  if (policy === "canonical") return ["canonical"];
  return ["shadow"];
}

function buildEntry(
  input: LedgerShadowWriteInput,
  id: string,
  mode: LedgerWriteMode
): LedgerShadowEntry {
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
    mode,
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

function isValidWriteInput(input: LedgerShadowWriteInput, amountCents: number): boolean {
  return (
    Number.isFinite(amountCents) &&
    amountCents > 0 &&
    !!input.tenantId &&
    !!input.transactionId &&
    !!input.debitAccount &&
    !!input.creditAccount
  );
}

/**
 * Grava lançamento(s) conforme `LEDGER_MODE` dentro da transação Firestore.
 * Retorna o id do primeiro doc criado (ou null se amount inválido).
 */
export function setLedgerShadowInTransaction(
  transaction: Transaction,
  input: LedgerShadowWriteInput
): string | null {
  const amountCents = Math.round(Number(input.amountCents));
  if (!isValidWriteInput(input, amountCents)) return null;

  const modes = input.mode ? [input.mode] : ledgerWriteModesForPolicy();
  let firstId: string | null = null;

  for (const mode of modes) {
    const ref = adminDb.collection(LEDGER_SHADOW_COLLECTION).doc();
    const entry = buildEntry({ ...input, amountCents }, ref.id, mode);
    transaction.set(ref, toFirestorePayload(entry));
    if (!firstId) firstId = ref.id;
  }

  return firstId;
}

/** Gravação fora de transação (batch pós-commit / scripts). */
export async function writeLedgerShadow(input: LedgerShadowWriteInput): Promise<string | null> {
  const amountCents = Math.round(Number(input.amountCents));
  if (!isValidWriteInput(input, amountCents)) return null;

  const modes = input.mode ? [input.mode] : ledgerWriteModesForPolicy();
  let firstId: string | null = null;

  for (const mode of modes) {
    const ref = adminDb.collection(LEDGER_SHADOW_COLLECTION).doc();
    const entry = buildEntry({ ...input, amountCents }, ref.id, mode);
    await ref.set(toFirestorePayload(entry));
    if (!firstId) firstId = ref.id;
  }

  return firstId;
}

export interface BoxShadowReconcileResult {
  boxId: string;
  tenantId: string;
  boxFinalAmountCents: number;
  boxInitialAmountCents: number;
  ledgerCaixaNetCents: number;
  deltaCents: number;
  entryCount: number;
  consistent: boolean;
  /** Modos considerados no net (shadow, canonical ou ambos). */
  modesIncluded: LedgerWriteMode[] | ["all"];
  balanceSource?: string;
  ledgerCutoverAt?: string;
}

function entryMode(data: Record<string, unknown>): LedgerWriteMode {
  return data.mode === "canonical" ? "canonical" : "shadow";
}

/**
 * Net do ledger na conta caixa, deduplicando dual (mesmo transactionId em shadow+canonical).
 * Preferência: canonical > shadow.
 */
export async function computeBoxLedgerNetCents(
  tenantId: string,
  boxId: string
): Promise<{ netCents: number; entryCount: number; modesUsed: LedgerWriteMode[] | ["all"] }> {
  const policy = getLedgerModePolicy();
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

  type Agg = { amount: number; mode: LedgerWriteMode };
  const debits = new Map<string, Agg>();
  const credits = new Map<string, Agg>();

  const prefer = (map: Map<string, Agg>, key: string, amount: number, mode: LedgerWriteMode) => {
    const prev = map.get(key);
    if (!prev || (prev.mode === "shadow" && mode === "canonical")) {
      map.set(key, { amount, mode });
    }
  };

  let rawCount = 0;
  debitSnap.docs.forEach((d) => {
    const data = d.data() as Record<string, unknown>;
    rawCount += 1;
    const mode = entryMode(data);
    if (policy === "canonical" && mode === "shadow") return;
    const key = `${data.transactionId || d.id}:${data.source || ""}:D`;
    prefer(debits, key, Math.round(Number(data.amountCents || 0)), mode);
  });
  creditSnap.docs.forEach((d) => {
    const data = d.data() as Record<string, unknown>;
    rawCount += 1;
    const mode = entryMode(data);
    if (policy === "canonical" && mode === "shadow") return;
    const key = `${data.transactionId || d.id}:${data.source || ""}:C`;
    prefer(credits, key, Math.round(Number(data.amountCents || 0)), mode);
  });

  let debitSum = 0;
  let creditSum = 0;
  debits.forEach((v) => {
    debitSum += v.amount;
  });
  credits.forEach((v) => {
    creditSum += v.amount;
  });

  return {
    netCents: debitSum - creditSum,
    entryCount: rawCount,
    modesUsed: policy === "canonical" ? ["canonical"] : policy === "dual" ? ["all"] : ["shadow"],
  };
}

/**
 * Compara saldo do documento `boxes` com o net do ledger.
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

  const { netCents, entryCount, modesUsed } = await computeBoxLedgerNetCents(tenantId, boxId);
  const boxFinalAmountCents = Math.round(Number(box.finalAmount || 0));
  const boxInitialAmountCents = Math.round(Number(box.initialAmount || 0));
  const deltaCents = netCents - boxFinalAmountCents;

  return {
    boxId,
    tenantId,
    boxFinalAmountCents,
    boxInitialAmountCents,
    ledgerCaixaNetCents: netCents,
    deltaCents,
    entryCount,
    consistent: deltaCents === 0,
    modesIncluded: modesUsed,
    balanceSource: box.balanceSource ? String(box.balanceSource) : undefined,
    ledgerCutoverAt: box.ledgerCutoverAt ? String(box.ledgerCutoverAt) : undefined,
  };
}

export interface CutoverBoxResult {
  boxId: string;
  tenantId: string;
  dryRun: boolean;
  applied: boolean;
  reconcile: BoxShadowReconcileResult;
  balanceSource: string;
  ledgerCutoverAt?: string;
  message: string;
}

/**
 * ENT-09 — cutover do caixa: exige reconcile consistente; marca `balanceSource=ledger`.
 * Não reescreve histórico; novos writes seguem `LEDGER_MODE` (ideal: canonical após cutover).
 */
export async function cutoverBoxToLedger(
  tenantId: string,
  boxId: string,
  opts: { dryRun?: boolean; userId?: string; force?: boolean } = {}
): Promise<CutoverBoxResult> {
  const reconcile = await reconcileBoxShadow(tenantId, boxId);

  if (!reconcile.consistent && !opts.force) {
    return {
      boxId,
      tenantId,
      dryRun: !!opts.dryRun,
      applied: false,
      reconcile,
      balanceSource: reconcile.balanceSource || "document",
      ledgerCutoverAt: reconcile.ledgerCutoverAt,
      message: `Cutover bloqueado: deltaCents=${reconcile.deltaCents}. Homologue sombra (delta=0) ou use force (não recomendado).`,
    };
  }

  const cutoverAt = new Date().toISOString();

  if (opts.dryRun) {
    return {
      boxId,
      tenantId,
      dryRun: true,
      applied: false,
      reconcile,
      balanceSource: "ledger",
      ledgerCutoverAt: cutoverAt,
      message: "Dry-run OK — caixa elegível para cutover.",
    };
  }

  await adminDb
    .collection("boxes")
    .doc(boxId)
    .set(
      {
        balanceSource: "ledger",
        ledgerCutoverAt: cutoverAt,
        ledgerCutoverBy: opts.userId || null,
        ledgerCutoverDeltaCents: reconcile.deltaCents,
        // Alinha documento ao net do ledger (fonte canônica pós-cutover)
        finalAmount: reconcile.ledgerCaixaNetCents,
        updatedAt: cutoverAt,
      },
      { merge: true }
    );

  return {
    boxId,
    tenantId,
    dryRun: false,
    applied: true,
    reconcile: { ...reconcile, deltaCents: 0, consistent: true, balanceSource: "ledger", ledgerCutoverAt: cutoverAt },
    balanceSource: "ledger",
    ledgerCutoverAt: cutoverAt,
    message: "Cutover aplicado: balanceSource=ledger; sombra off nos novos writes se LEDGER_MODE=canonical.",
  };
}

/** Saldo efetivo do caixa: ledger se cutover; senão finalAmount do documento. */
export async function resolveBoxBalanceCents(
  tenantId: string,
  boxId: string
): Promise<{ amountCents: number; source: "ledger" | "document"; reconcile: BoxShadowReconcileResult }> {
  const reconcile = await reconcileBoxShadow(tenantId, boxId);
  if (reconcile.balanceSource === "ledger") {
    return {
      amountCents: reconcile.ledgerCaixaNetCents,
      source: "ledger",
      reconcile,
    };
  }
  return {
    amountCents: reconcile.boxFinalAmountCents,
    source: "document",
    reconcile,
  };
}
