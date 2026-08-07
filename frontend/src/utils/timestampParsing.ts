export function parseUnknownTimestamp(ts: unknown): Date | null {
  if (!ts) return null;

  if (
    typeof ts === 'object' &&
    ts !== null &&
    'toDate' in ts &&
    typeof (ts as Record<string, unknown>).toDate === 'function'
  ) {
    try {
      return (ts as { toDate: () => Date }).toDate();
    } catch (e) {
      // fallback
    }
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

  if (typeof ts === 'string') {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

