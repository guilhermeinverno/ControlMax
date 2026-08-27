// src/utils/sync/syncRetry.ts
// Classificação de erros retryáveis (ENT-05).

export const MAX_SYNC_RETRIES = 5;

/**
 * Erros temporários: rede offline, fetch falhou, timeout, HTTP 408/429/5xx.
 * 4xx (exceto 408/429) e erros de validação → não retryáveis.
 */
export function isRetryableSyncError(err: unknown): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return true;
  }

  if (!(err instanceof Error)) return false;

  const msg = err.message.toLowerCase();
  if (
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("network error") ||
    msg.includes("abort") ||
    err.name === "AbortError"
  ) {
    return true;
  }

  const httpMatch = msg.match(/http\s+(\d{3})/i);
  if (httpMatch) {
    const status = Number(httpMatch[1]);
    if (status === 408 || status === 429 || status >= 500) return true;
  }

  return false;
}
