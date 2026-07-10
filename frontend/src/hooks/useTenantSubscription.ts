import { auth, db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { logFirestoreError } from '../utils/firestoreError';
import { getErrorMessage } from '../utils/errorMessage';
import { provisionBypassAccount } from './useTenantHelpers';
import { applyBypassState, applyExistingUserDoc, TenantSetters } from './useTenantState';
import { handleMissingUserDoc } from './useTenantLink';

function clearTenantSession(setters: TenantSetters) {
  setters.setTenantId('');
  setters.setRole('collector');
  setters.setUserName('');
  setters.setIsSuperAdmin(false);
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
      setters.setLoading(false);
      const message = getErrorMessage(snapshotError) || 'Erro ao carregar perfil do usuário.';
      setters.setError(message);
      if (auth.currentUser?.uid === user.uid) {
        try {
          logFirestoreError(snapshotError, 'get', `users/${user.uid}`, { throwError: true });
        } catch {
          // Captured and logged
        }
      }
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
    if (applyBypassState(emailLower, setters)) {
      provisionBypassAccount(emailLower, user);
      return;
    }

    setters.setLoading(true);
    setters.setError(null);
    unsubscribeSnap = subscribeToUserProfile(user, emailLower, setters);
  });

  return () => {
    unsubscribeAuth();
    unsubscribeSnap?.();
  };
}
