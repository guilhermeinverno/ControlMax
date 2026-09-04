export function formatDisplayId(originalId: string): string {
  if (!originalId) return '0000000000';
  if (/^\d{10}$/.test(originalId)) return originalId;
  if (/^\d+$/.test(originalId)) return originalId.padStart(10, '0');
  
  let hash = 0;
  for (let i = 0; i < originalId.length; i++) {
    hash = ((hash << 5) - hash) + originalId.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString().padStart(10, '0').slice(0, 10);
}
