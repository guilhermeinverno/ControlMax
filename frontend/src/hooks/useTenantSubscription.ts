import { auth, db, onAuthStateChanged } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { applyExistingUserDoc, applyGuestState, TenantSetters } from './useTenantState';
import { handleMissingUserDoc } from './useTenantLink';
import { forceRefreshIdToken } from '../utils/authToken';

const CLAIMS_REFRESH_THROTTLE_MS = 5 * 60_000;
let lastClaimsRefreshAt = 0;

async function maybeRefreshClaimsOnFocus(): Promise<void> {
  if (!auth?.currentUser) return;
  const now = Date.now();
  if (now - lastClaimsRefreshAt < CLAIMS_REFRESH_THROTTLE_MS) return;
  lastClaimsRefreshAt = now;
  try {
    await forceRefreshIdToken();
  } catch {
    // silencioso — próximo request BFF pode retornar CLAIMS_STALE e retry
  }
}

function clearTenantSession(setters: TenantSetters) {
  setters.setTenantId('');
  setters.setRole('collector');
  setters.setUserName('');
  setters.setIsSuperAdmin(false);
  setters.setUserId('');
  setters.setUsuarioUnidades([]);
  setters.setPermissions({});
  setters.setError(null);
  setters.setLoading(false);
}

function subscribeToUserProfile(user: User, emailLower: string, setters: TenantSetters) {
  const userDocRef = doc(db, 'users', user.uid);

  return onSnapshot(
    userDocRef,
    async (docSnap) => {
      if (docSnap.exists()) {
        applyExistingUserDoc(user, emailLower, docSnap.data(), setters);
        return;
      }
      await handleMissingUserDoc(user, emailLower, userDocRef, setters);
    },
    (snapshotError) => {
      console.warn('Snapshot permission warning, falling back to guest/email state:', snapshotError);
      handleMissingUserDoc(user, emailLower, userDocRef, setters).catch(() => {
        applyGuestState(user, emailLower, false, setters);
      });
    }
  );
}

export function createTenantSubscription(setters: TenantSetters) {
  let unsubscribeSnap: (() => void) | null = null;

  const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
    if (unsubscribeSnap) {
      unsubscribeSnap();
      unsubscribeSnap = null;
    }

    if (!user) {
      clearTenantSession(setters);
      return;
    }

    const emailLower = user.email?.toLowerCase() || '';

    setters.setLoading(true);
    setters.setError(null);
    unsubscribeSnap = subscribeToUserProfile(user, emailLower, setters);
  });

  // ENT-04: ao voltar à aba, tenta renovar claims (throttle 5 min)
  const onVisibility = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      void maybeRefreshClaimsOnFocus();
    }
  };
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibility);
  }

  return () => {
    unsubscribeAuth();
    unsubscribeSnap?.();
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibility);
    }
  };
}
