/** Converte Timestamp do Firestore (ou variantes) em Date JavaScript. */
export function toJsDate(value: unknown, fallback: Date = new Date()): Date {
  if (value == null) return fallback;
  if (value instanceof Date) return value;

  if (typeof value === 'object') {
    const ts = value as { toDate?: () => Date; seconds?: number };
    if (typeof ts.toDate === 'function') return ts.toDate();
    if (typeof ts.seconds === 'number') return new Date(ts.seconds * 1000);
  }

  return fallback;
}

/** Retorna a primeira data válida entre os candidatos, ou `new Date()` se nenhuma existir. */
export function pickJsDate(...candidates: unknown[]): Date {
  for (const candidate of candidates) {
    if (candidate != null) return toJsDate(candidate);
  }
  return new Date();
}

/** Formata timestamp do Firestore para exibição localizada. */
export function formatFirestoreDate(
  value: unknown,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string {
  if (value == null) return '';
  return toJsDate(value).toLocaleString(locale, options);
}
