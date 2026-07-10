export function formatTimeAgo(ts: unknown): string {
  if (!ts) return 'Nunca';
  let date: Date;
  if (
    typeof ts === 'object' &&
    ts !== null &&
    'toDate' in ts &&
    typeof (ts as Record<string, unknown>).toDate === 'function'
  ) {
    date = (ts as { toDate: () => Date }).toDate();
  } else if (ts instanceof Date) {
    date = ts;
  } else if (
    typeof ts === 'object' &&
    ts !== null &&
    'seconds' in ts &&
    typeof (ts as { seconds: number }).seconds === 'number'
  ) {
    date = new Date((ts as { seconds: number }).seconds * 1000);
  } else if (typeof ts === 'number') {
    date = new Date(ts);
  } else {
    return 'Data inválida';
  }

  if (isNaN(date.getTime())) return 'N/A';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Agora mesmo';
  if (diffMin < 60) return `Há ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`;
  if (diffHr < 24) return `Há ${diffHr} ${diffHr === 1 ? 'hora' : 'horas'}`;
  return `Há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
}
