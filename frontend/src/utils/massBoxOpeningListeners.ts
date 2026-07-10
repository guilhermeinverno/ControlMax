import { collection, onSnapshot, query, Timestamp, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getErrorMessage } from './errorMessage';
import type { MassBoxOpeningBox, MassBoxOpeningUser } from '../hooks/useMassBoxOpeningData';
import { parseUnknownTimestamp } from './timestampParsing';

export function subscribeMassBoxCollectors(
  tenantId: string,
  onCollectors: (list: MassBoxOpeningUser[]) => void,
  onLoadingChange: (loading: boolean) => void,
  onError: (message: string) => void
): () => void {
  const q = query(
    collection(db, 'users'),
    where('tenantId', '==', tenantId),
    where('role', '==', 'collector'),
    where('active', '==', true)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      onCollectors(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as unknown as MassBoxOpeningUser));
      onLoadingChange(false);
    },
    (err) => {
      console.error('Users onSnapshot failed:', err);
      onError(getErrorMessage(err) || 'Error al cargar cobradores');
      onLoadingChange(false);
    }
  );
}

function filterBoxesOpenedToday(boxes: MassBoxOpeningBox[], startOfToday: Date): MassBoxOpeningBox[] {
  return boxes.filter((box) => {
    const date = parseUnknownTimestamp(box.openedAt);
    return date !== null && date >= startOfToday;
  });
}

function attachMassBoxFallbackListener(
  tenantId: string,
  startOfToday: Date,
  onBoxes: (list: MassBoxOpeningBox[]) => void
): () => void {
  const fallbackQ = query(
    collection(db, 'boxes'),
    where('tenantId', '==', tenantId),
    where('status', '==', 'open')
  );

  return onSnapshot(fallbackQ, (snapshot) => {
    const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as unknown as MassBoxOpeningBox);
    onBoxes(filterBoxesOpenedToday(list, startOfToday));
  });
}

export function subscribeMassBoxActiveBoxes(
  tenantId: string,
  onBoxes: (list: MassBoxOpeningBox[]) => void
): () => void {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const primaryQ = query(
    collection(db, 'boxes'),
    where('tenantId', '==', tenantId),
    where('status', '==', 'open'),
    where('openedAt', '>=', Timestamp.fromDate(startOfToday))
  );

  let unsubscribe: (() => void) | null = null;

  unsubscribe = onSnapshot(
    primaryQ,
    (snapshot) => {
      onBoxes(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as unknown as MassBoxOpeningBox));
    },
    (err) => {
      console.warn('MassBoxOpening primary query failed, using fallback:', err);
      unsubscribe?.();
      unsubscribe = attachMassBoxFallbackListener(tenantId, startOfToday, onBoxes);
    }
  );

  return () => unsubscribe?.();
}
