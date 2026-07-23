import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export async function logSecurityAction(
  usuario_id: string,
  operador_role: string,
  acao: 'CONFIRM_BOX' | 'CHANGE_CREDIT_LIMIT' | 'CHANGE_PERMISSION',
  unidad_id: string,
  status: 'SUCCESS' | 'DENIED'
): Promise<void> {
  try {
    let ip_origem = 'client-side';
    try {
      const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        const data = await res.json();
        if (data && data.ip) {
          ip_origem = data.ip;
        }
      }
    } catch {
      // Fallback if offline or timeout
    }

    await addDoc(collection(db, 'security_logs'), {
      timestamp: new Date().toISOString(),
      usuario_id,
      operador_role,
      acao,
      unidad_id: unidad_id || 'unknown',
      ip_origem,
      status
    });
  } catch (error) {
    console.error('Error recording security log:', error);
  }
}
