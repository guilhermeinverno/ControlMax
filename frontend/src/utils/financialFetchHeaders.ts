/**
 * Headers padrão para chamadas financeiras BFF com idempotência (FIN-04).
 */
export function financialFetchHeaders(token: string, idempotencyKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'X-Idempotency-Key': idempotencyKey,
  };
}
