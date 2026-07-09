import { toJsDate } from './firestoreTimestamp';

export function parseAssistantDate(val: unknown): Date | null {
  if (!val) return null;
  try {
    const date = toJsDate(val, new Date(0));
    return date.getTime() === 0 ? null : date;
  } catch {
    return null;
  }
}

export function isOnOrAfterToday(value: unknown, startOfToday: Date): boolean {
  const date = parseAssistantDate(value);
  return date ? date >= startOfToday : false;
}
