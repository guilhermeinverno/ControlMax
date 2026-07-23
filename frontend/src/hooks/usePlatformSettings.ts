import { useEffect, useState } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useTenant } from './useTenant';
import { logSecurityAction } from '../utils/securityLogger';
import {
  DEFAULT_PLATFORM_SETTINGS,
  mapPlatformSettingsFromFirestore,
  PlatformSettings,
} from '../types/platformSettings';

export function usePlatformSettings(tenantId?: string) {
  const { role } = useTenant();
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_PLATFORM_SETTINGS);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;

    const loadSettings = async () => {
      setLoadingSettings(true);
      setErrorMsg(null);
      try {
        const settingsDocRef = doc(db, 'platform_settings', tenantId);
        const snap = await getDoc(settingsDocRef);

        if (snap.exists()) {
          setSettings(mapPlatformSettingsFromFirestore(snap.data()));
          return;
        }

        await setDoc(settingsDocRef, { ...DEFAULT_PLATFORM_SETTINGS, tenantId });
        setSettings(DEFAULT_PLATFORM_SETTINGS);
      } catch (err: unknown) {
        console.error('Error loading platform settings:', err);
        setErrorMsg('Error al conectar con Firestore. Usando parámetros locales de respaldo.');
      } finally {
        setLoadingSettings(false);
      }
    };

    loadSettings();
  }, [tenantId]);

  const handleInputChange = (field: keyof PlatformSettings, value: unknown) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!tenantId) return false;

    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const settingsDocRef = doc(db, 'platform_settings', tenantId);
      await setDoc(
        settingsDocRef,
        { ...settings, tenantId, updatedAt: new Date() },
        { merge: true }
      );

      const tenantDocRef = doc(db, 'tenants', tenantId);
      await updateDoc(tenantDocRef, { name: settings.platformName }).catch((err) =>
        console.log('Non-blocking error updating tenant name:', err)
      );

      // Log successful CHANGE_CREDIT_LIMIT
      await logSecurityAction(
        auth?.currentUser?.uid || 'unknown-user',
        role || 'unknown-role',
        'CHANGE_CREDIT_LIMIT',
        'all',
        'SUCCESS'
      ).catch(e => console.error('Silent log error:', e));

      setSuccessMsg('¡Configuración de la plataforma guardada y aplicada con éxito!');
      setTimeout(() => setSuccessMsg(null), 5000);
      return true;
    } catch (err: unknown) {
      console.error('Error saving platform settings:', err);
      setErrorMsg('No se pudo persistir la configuración. Verifique los permisos administrativos.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    settings,
    loadingSettings,
    saving,
    successMsg,
    errorMsg,
    setErrorMsg,
    handleInputChange,
    handleSave,
  };
}
