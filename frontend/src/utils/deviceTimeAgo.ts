import { parseUnknownTimestamp } from './timestampParsing';

function formatRelativeDuration(diffMs: number): string {
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Agora mesmo';
  if (diffMin < 60) return `Há ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`;
  if (diffHr < 24) return `Há ${diffHr} ${diffHr === 1 ? 'hora' : 'horas'}`;
  return `Há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
}

export function formatTimeAgo(ts: unknown): string {
  const date = parseUnknownTimestamp(ts);
  if (!date) return ts ? 'Data inválida' : 'Nunca';
  if (isNaN(date.getTime())) return 'N/A';
  return formatRelativeDuration(Date.now() - date.getTime());
}
