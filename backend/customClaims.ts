export interface ControlMaxClaims {
  role: string;
  tenantId: string;
  isSuperAdmin: boolean;
}

export interface ResolvedAuthProfile {
  role: string;
  tenantId: string;
  isSuperAdmin: boolean;
  source: "claims" | "firestore";
}

type TokenLike = {
  role?: unknown;
  tenantId?: unknown;
  isSuperAdmin?: unknown;
};

/**
 * Sincroniza Custom Claims Firebase Auth (AUTH-01 Opção A).
 * O client precisa renovar o ID token após a atualização para refletir as claims.
 */
export async function syncUserCustomClaims(
  uid: string,
  input: { role: string; tenantId: string; isSuperAdmin?: boolean }
): Promise<void> {
  const { adminAuth } = await import("./authMiddleware");
  const role = String(input.role || "collector");
  const tenantId = String(input.tenantId || "");
  const isSuperAdmin = input.isSuperAdmin === true || role.toLowerCase() === "superadmin";

  await adminAuth.setCustomUserClaims(uid, {
    role,
    tenantId,
    isSuperAdmin,
  });
}

/**
 * Resolve perfil autenticado: Custom Claims primeiro; Firestore como fallback (usuários legados).
 * Impede escalate de role via edição client do documento `users` quando claims estão presentes.
 */
export function resolveAuthProfile(
  decodedToken: TokenLike,
  userData: Record<string, unknown> | undefined | null
): ResolvedAuthProfile {
  const data = userData || {};
  const claimRole = typeof decodedToken.role === "string" ? decodedToken.role.trim() : "";
  const claimTenantId =
    typeof decodedToken.tenantId === "string" ? decodedToken.tenantId.trim() : "";
  const hasClaims = Boolean(claimRole || claimTenantId);

  const firestoreRole = String(data.role || "collector");
  const firestoreTenantId = String(data.tenantId || "");
  const firestoreIsSuper =
    data.isSuperAdmin === true || firestoreRole.toLowerCase() === "superadmin";

  if (hasClaims) {
    const role = claimRole || firestoreRole;
    const tenantId = claimTenantId || firestoreTenantId;
    const isSuperAdmin =
      decodedToken.isSuperAdmin === true || role.toLowerCase() === "superadmin";
    return { role, tenantId, isSuperAdmin, source: "claims" };
  }

  return {
    role: firestoreRole,
    tenantId: firestoreTenantId,
    isSuperAdmin: firestoreIsSuper,
    source: "firestore",
  };
}
