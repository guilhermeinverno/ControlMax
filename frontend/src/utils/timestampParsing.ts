export function parseUnknownTimestamp(ts: unknown): Date | null {
  if (!ts) return null;

  if (
    typeof ts === 'object' &&
    ts !== null &&
    'toDate' in ts &&
    typeof (ts as Record<string, unknown>).toDate === 'function'
  ) {
    return (ts as { toDate: () => Date }).toDate();
  }

  if (ts instanceof Date) return ts;

  if (
    typeof ts === 'object' &&
    ts !== null &&
    'seconds' in ts &&
    typeof (ts as { seconds: number }).seconds === 'number'
  ) {
    return new Date((ts as { seconds: number }).seconds * 1000);
  }

  if (typeof ts === 'number') return new Date(ts);

  return null;
}
