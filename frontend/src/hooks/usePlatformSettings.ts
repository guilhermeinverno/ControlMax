import { useCallback, useEffect, useState } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  DEFAULT_PLATFORM_SETTINGS,
  mapPlatformSettingsFromFirestore,
  PlatformSettings,
} from '../types/platformSettings';

export function usePlatformSettings(tenantId?: string) {
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_PLATFORM_SETTINGS);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reloadSettings = useCallback(() => {
    setReloadToken((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!tenantId) return;

    const loadSettings = async () => {
      setLoadingSettings(true);
      setErrorMsg(null);
      setLoadFailed(false);
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
        setLoadFailed(true);
        setErrorMsg('Error al cargar la configuración. Verifique su conexión e intente de nuevo.');
      } finally {
        setLoadingSettings(false);
      }
    };

    void loadSettings();
  }, [tenantId, reloadToken]);

  const handleInputChange = (field: keyof PlatformSettings, value: unknown) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!tenantId) return false;

    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      if (!auth?.currentUser) {
        throw new Error('Usuario no autenticado.');
      }
      const token = await auth.currentUser.getIdToken();
      const res = await fetch('/api/platform/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ settings, reason: 'Atualização de configuração da plataforma' }),
      });
      const data = await res.json().catch(() => ({} as { error?: string; settings?: Record<string, unknown> }));
      if (!res.ok) {
        throw new Error(data.error || `Erro ao salvar (${res.status}).`);
      }
      if (data.settings) {
        setSettings(mapPlatformSettingsFromFirestore(data.settings));
      }

      setSuccessMsg('¡Configuración de la plataforma guardada y aplicada con éxito!');
      setTimeout(() => setSuccessMsg(null), 5000);
      return true;
    } catch (err: unknown) {
      console.error('Error saving platform settings:', err);
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'No se pudo persistir la configuración. Verifique los permisos administrativos.',
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    settings,
    loadingSettings,
    loadFailed,
    saving,
    successMsg,
    errorMsg,
    setErrorMsg,
    handleInputChange,
    handleSave,
    reloadSettings,
  };
}
