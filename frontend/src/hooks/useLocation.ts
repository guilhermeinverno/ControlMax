import { useEffect, useRef } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useTenant } from './useTenant';
import { useBox } from './useBox';

export function useLocation() {
  const { tenantId, userName } = useTenant();
  const { activeBox } = useBox();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchRef = useRef<number | null>(null);

  const sendLocation = (lat: number, lng: number, accuracy: number) => {
    const uid = auth.currentUser?.uid;
    if (!uid || !tenantId || !activeBox) return;

    const locationRef = doc(db, 'locations', uid);
    setDoc(locationRef, {
      userId: uid,
      tenantId,
      userName,
      unitId: activeBox.unitId || '',
      unitName: activeBox.unitName || '',
      cnId: activeBox.cnId || '',
      cnName: activeBox.cnName || '',
      boxId: activeBox.id,
      latitude: lat,
      longitude: lng,
      accuracy,
      status: 'active',
      lastSeen: serverTimestamp(),
    }, { merge: true });
  };

  const stopTracking = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    // Marcar como inativo quando caixa fecha
    const uid = auth.currentUser?.uid;
    if (uid && tenantId) {
      setDoc(doc(db, 'locations', uid), {
        tenantId,
        status: 'inactive',
        lastSeen: serverTimestamp(),
      }, { merge: true });
    }
  };

  useEffect(() => {
    // Só rastrear se tiver caixa aberta e browser suportar geolocation
    if (!activeBox || !navigator.geolocation) return;

    // Pedir permissão e iniciar tracking
    const startTracking = () => {
      // Enviar imediatamente
      navigator.geolocation.getCurrentPosition(
        pos => sendLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
        err => console.warn('Geolocation error:', err),
        { enableHighAccuracy: true, timeout: 10000 }
      );

      // Repetir a cada 5 minutos
      intervalRef.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          pos => sendLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
          err => console.warn('Geolocation error:', err),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }, 5 * 60 * 1000); // 5 minutos
    };

    startTracking();

    return () => stopTracking();
  }, [activeBox?.id, tenantId]);

  return null; // Hook sem retorno — só efeito colateral
}
