import { adminDb } from "./authMiddleware";
import { FieldValue } from "firebase-admin/firestore";

export interface IdempotencyRecord {
  uid: string;
  tenantId?: string;
  status: "processing" | "completed";
  response?: any;
  createdAt: any;
}

export function buildIdempotencyDocId(tenantId: string, uid: string, key: string): string {
  const safeTenant = tenantId || 'no_tenant';
  const safeUid = uid || 'no_uid';
  return `${safeTenant}_${safeUid}_${key}`;
}

export async function checkIdempotency(
  tx: FirebaseFirestore.Transaction,
  key: string,
  uid: string,
  tenantId: string = ''
): Promise<IdempotencyRecord | null> {
  if (!key) return null;
  const docId = buildIdempotencyDocId(tenantId, uid, key);
  const keyRef = adminDb.collection("idempotency_keys").doc(docId);
  const keySnap = await tx.get(keyRef);

  if (keySnap.exists) {
    const data = keySnap.data() as IdempotencyRecord;
    // Validar estritamente que o uid da requisição atual é o mesmo que criou a chave
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
  uid: string = '',
  tenantId: string = ''
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
