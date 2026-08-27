export interface ControlMaxClaims {
  role: string;
  tenantId: string;
  isSuperAdmin: boolean;
  /** Epoch ms — muda a cada sync de claims (ENT-04). */
  claimsVersion?: number;
}

export interface ResolvedAuthProfile {
  role: string;
  tenantId: string;
  isSuperAdmin: boolean;
  source: "claims" | "firestore";
}

export interface SyncClaimsOptions {
  /**
   * Invalida refresh tokens do usuário (força re-login / getIdToken(true)).
   * Default: true. Use false em updates que não alteram role/tenant/active.
   */
  revokeSessions?: boolean;
}

type TokenLike = {
  role?: unknown;
  tenantId?: unknown;
  isSuperAdmin?: unknown;
  claimsVersion?: unknown;
};

/**
 * Sincroniza Custom Claims Firebase Auth (AUTH-01 Opção A + ENT-04).
 * Após sync com revokeSessions, o client precisa `getIdToken(true)`.
 */
export async function syncUserCustomClaims(
  uid: string,
  input: { role: string; tenantId: string; isSuperAdmin?: boolean },
  options: SyncClaimsOptions = {}
): Promise<{ claimsVersion: number; sessionsRevoked: boolean }> {
  const { adminAuth } = await import("./authMiddleware");
  const role = String(input.role || "collector");
  const tenantId = String(input.tenantId || "");
  const isSuperAdmin = input.isSuperAdmin === true || role.toLowerCase() === "superadmin";
  const claimsVersion = Date.now();
  const revokeSessions = options.revokeSessions !== false;

  await adminAuth.setCustomUserClaims(uid, {
    role,
    tenantId,
    isSuperAdmin,
    claimsVersion,
  });

  if (revokeSessions) {
    await adminAuth.revokeRefreshTokens(uid);
  }

  return { claimsVersion, sessionsRevoked: revokeSessions };
}

/**
 * Detecta se o patch administrativo exige invalidar sessões (role/tenant/active).
 */
export function shouldRevokeSessionsOnUserPatch(
  oldData: Record<string, unknown>,
  patch: Record<string, unknown>
): boolean {
  const securityFields = ["role", "roleId", "active", "isSuperAdmin", "permissions", "tenantId"] as const;
  for (const field of securityFields) {
    if (!Object.prototype.hasOwnProperty.call(patch, field)) continue;
    if (field === "permissions") {
      try {
        if (JSON.stringify(oldData.permissions ?? null) !== JSON.stringify(patch.permissions ?? null)) {
          return true;
        }
      } catch {
        return true;
      }
      continue;
    }
    if (String(oldData[field] ?? "") !== String(patch[field] ?? "")) {
      return true;
    }
  }
  return false;
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
