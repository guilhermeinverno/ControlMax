import { auth, db, onAuthStateChanged } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { logFirestoreError } from '../utils/firestoreError';
import { getErrorMessage } from '../utils/errorMessage';
import { applyExistingUserDoc, applyGuestState, TenantSetters } from './useTenantState';
import { handleMissingUserDoc } from './useTenantLink';

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
      // Evita travar a sessão com tela de erro de permissão
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

  return () => {
    unsubscribeAuth();
    unsubscribeSnap?.();
  };
}

