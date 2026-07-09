import { auth } from '../lib/firebase';
import { getErrorMessage } from './errorMessage';

export type FirestoreOperationType =
  | 'create'
  | 'update'
  | 'delete'
  | 'list'
  | 'get'
  | 'write';

export interface LogFirestoreErrorOptions {
  label?: string;
  throwError?: boolean;
  includeAuth?: boolean;
  extraAuth?: Record<string, unknown>;
}

function buildAuthInfo(extra?: Record<string, unknown>): Record<string, unknown> {
  return {
    userId: auth?.currentUser?.uid ?? null,
    email: auth?.currentUser?.email ?? null,
    emailVerified: auth?.currentUser?.emailVerified ?? null,
    isAnonymous: auth?.currentUser?.isAnonymous ?? null,
    tenantId: auth?.currentUser?.tenantId ?? null,
    providerInfo:
      auth?.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) ?? [],
    ...extra,
  };
}

/** Registra erro de operação Firestore de forma padronizada (opcionalmente relança). */
export function logFirestoreError(
  error: unknown,
  operationType: FirestoreOperationType,
  path: string | null,
  options: LogFirestoreErrorOptions = {}
): void {
  const {
    label = 'Firestore Error',
    throwError = false,
    includeAuth = true,
    extraAuth,
  } = options;

  const payload: Record<string, unknown> = {
    error: getErrorMessage(error),
    operationType,
    path,
  };

  if (includeAuth) {
    payload.authInfo = buildAuthInfo(extraAuth);
  } else if (extraAuth) {
    payload.authInfo = extraAuth;
  }

  console.error(`${label}: `, JSON.stringify(payload));
  if (throwError) {
    throw new Error(JSON.stringify(payload));
  }
}
