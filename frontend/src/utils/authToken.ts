import { auth } from '../lib/firebase';

export const CLAIMS_STALE_CODE = 'CLAIMS_STALE';

/**
 * Obtém Bearer token do Firebase Auth.
 * @param forceRefresh se true, força renovação (ENT-04 / pós-mudança de role).
 */
export async function getAuthIdToken(forceRefresh = false): Promise<string> {
  const currentUser = auth?.currentUser;
  if (!currentUser) {
    throw new Error('Usuário não autenticado no Firebase Auth (auth.currentUser é null).');
  }
  const token = await currentUser.getIdToken(forceRefresh);
  if (!token) {
    throw new Error('Não foi possível obter token de autenticação válido do Firebase Auth.');
  }
  return token;
}

/** Força refresh das claims após login ou 401 CLAIMS_STALE. */
export async function forceRefreshIdToken(): Promise<string> {
  return getAuthIdToken(true);
}

export function isClaimsStaleResponse(status: number, body: unknown): boolean {
  if (status !== 401) return false;
  if (!body || typeof body !== 'object') return false;
  const code = (body as { code?: unknown }).code;
  return code === CLAIMS_STALE_CODE || code === 'TOKEN_REVOKED' || code === 'USER_DISABLED';
}

/**
 * fetch autenticado com 1 retry após force refresh se o BFF indicar CLAIMS_STALE.
 */
export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {});
  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${await getAuthIdToken(false)}`);
  }

  let response = await fetch(input, { ...init, headers });

  if (response.status === 401) {
    let body: unknown = null;
    try {
      body = await response.clone().json();
    } catch {
      body = null;
    }
    if (isClaimsStaleResponse(401, body)) {
      const fresh = await forceRefreshIdToken();
      headers.set('Authorization', `Bearer ${fresh}`);
      response = await fetch(input, { ...init, headers });
    }
  }

  return response;
}
