import { adminDb } from "./authMiddleware";
import { FieldValue } from "firebase-admin/firestore";

export interface IdempotencyRecord {
  uid: string;
  tenantId?: string;
  status: "processing" | "completed";
  response?: any;
  createdAt: any;
}

export const IDEMPOTENCY_REQUIRED_ERROR =
  "idempotencyKey é obrigatória (body.idempotencyKey ou header X-Idempotency-Key).";

/** Resolve chave de idempotência do body ou do header `X-Idempotency-Key` (FIN-04). */
export function resolveIdempotencyKey(req: {
  body?: { idempotencyKey?: unknown };
  headers?: Record<string, unknown>;
}): string {
  const headerRaw =
    req.headers?.["x-idempotency-key"] ??
    req.headers?.["X-Idempotency-Key"];
  const fromHeader = Array.isArray(headerRaw) ? headerRaw[0] : headerRaw;
  const raw = req.body?.idempotencyKey ?? fromHeader ?? "";
  return String(raw).trim();
}

/**
 * Exige idempotencyKey. Se ausente, responde 400 e retorna null.
 * Uso: `const key = requireIdempotencyKey(req, res); if (!key) return;`
 */
export function requireIdempotencyKey(
  req: { body?: { idempotencyKey?: unknown }; headers?: Record<string, unknown> },
  res: { status: (code: number) => { json: (body: unknown) => unknown } }
): string | null {
  const key = resolveIdempotencyKey(req);
  if (!key) {
    res.status(400).json({ error: IDEMPOTENCY_REQUIRED_ERROR });
    return null;
  }
  return key;
}

export function buildIdempotencyDocId(tenantId: string, uid: string, key: string): string {
  const safeTenant = tenantId || "no_tenant";
  const safeUid = uid || "no_uid";
  return `${safeTenant}_${safeUid}_${key}`;
}

export async function checkIdempotency(
  tx: FirebaseFirestore.Transaction,
  key: string,
  uid: string,
  tenantId: string = ""
): Promise<IdempotencyRecord | null> {
  if (!key) return null;
  const docId = buildIdempotencyDocId(tenantId, uid, key);
  const keyRef = adminDb.collection("idempotency_keys").doc(docId);
  const keySnap = await tx.get(keyRef);

  if (keySnap.exists) {
    const data = keySnap.data() as IdempotencyRecord;
    if (data.uid !== uid) {
      throw new Error("IDEMPOTENCY_MISMATCH: A chave de idempotência pertence a outro usuário.");
    }
    return data;
  }
  return null;
}

export function registerIdempotencySuccess(
  tx: FirebaseFirestore.Transaction,
  key: string,
  responseData: any,
  uid: string = "",
  tenantId: string = ""
) {
  if (!key) return;
  const docId = buildIdempotencyDocId(tenantId, uid, key);
  const keyRef = adminDb.collection("idempotency_keys").doc(docId);
  tx.set(keyRef, {
    uid,
    tenantId,
    status: "completed",
    response: responseData,
    completedAt: FieldValue.serverTimestamp(),
  });
}
