import { logFirestoreError } from '../utils/firestoreError';
import { getErrorMessage } from '../utils/errorMessage';
import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { UserRole } from '../types';
import {
  findRegisteredUserByEmail,
  isAdminBypassEmail,
  mapRoleFromFirestore,
  provisionBypassAccount,
} from './useTenantHelpers';
import {
  applyBypassState,
  applyExistingUserDoc,
  applyGuestState,
  TenantSetters,
} from './useTenantState';

async function handleMissingUserDoc(
  user: User,
  emailLower: string,
  userDocRef: ReturnType<typeof doc>,
  setters: TenantSetters
) {
  const hasAdminBypass = isAdminBypassEmail(emailLower);

  try {
    const foundDoc = await findRegisteredUserByEmail(user, emailLower);

    if (foundDoc) {
      const foundData = foundDoc.data();
      const { role: mappedRole, isSuperAdmin } = mapRoleFromFirestore(
        foundData.role,
        emailLower,
        foundData.isSuperAdmin
      );
      const impersonated =
        emailLower === 'maildojg@gmail.com'
          ? localStorage.getItem('controlmax_impersonated_tenant')
          : null;

      await setDoc(
        userDocRef,
        {
          ...foundData,
          userName:
            foundData.username ||
            foundData.userName ||
            foundData.firstName ||
            user.displayName ||
            user.email?.split('@')[0] ||
            'Cobrador',
          name:
            `${foundData.firstName || ''} ${foundData.lastName1 || ''}`.trim() ||
            foundData.name ||
            user.displayName ||
            'Cobrador',
          role: isSuperAdmin ? 'superadmin' : mappedRole,
          active: foundData.active !== undefined ? foundData.active : true,
          tenantId: foundData.tenantId,
          linkedToUid: user.uid,
        },
        { merge: true }
      );

      applyExistingUserDoc(user, emailLower, foundData, setters);
      if (impersonated) {
        setters.setTenantId(impersonated);
        setters.setUserName(`Super Admin (${impersonated})`);
      }
      return;
    }

    applyGuestState(user, emailLower, hasAdminBypass, setters);
  } catch (err) {
    console.error('Error auto-linking registered user by email:', err);
    applyGuestState(user, emailLower, hasAdminBypass, setters);
  }
}

export function useTenant() {
  const [tenantId, setTenantId] = useState<string>('');
  const [role, setRole] = useState<UserRole>('collector');
  const [userName, setUserName] = useState<string>('');
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const retry = useCallback(() => {
    setError(null);
    setLoading(true);
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let unsubscribeSnap: (() => void) | null = null;

    const setters: TenantSetters = {
      setTenantId,
      setRole,
      setUserName,
      setIsSuperAdmin,
      setLoading,
      setError,
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeSnap) {
        unsubscribeSnap();
        unsubscribeSnap = null;
      }

      if (!user) {
        setTenantId('');
        setRole('collector');
        setUserName('');
        setIsSuperAdmin(false);
        setError(null);
        setLoading(false);
        return;
      }

      const emailLower = user.email?.toLowerCase() || '';

      if (applyBypassState(emailLower, setters)) {
        provisionBypassAccount(emailLower, user);
        return;
      }

      setLoading(true);
      setError(null);

      const userDocRef = doc(db, 'users', user.uid);

      unsubscribeSnap = onSnapshot(
        userDocRef,
        async (docSnap) => {
          if (docSnap.exists()) {
            applyExistingUserDoc(user, emailLower, docSnap.data(), setters);
            return;
          }

          await handleMissingUserDoc(user, emailLower, userDocRef, setters);
        },
        (snapshotError) => {
          setLoading(false);
          const message = getErrorMessage(snapshotError) || 'Erro ao carregar perfil do usuário.';
          setError(message);
          if (auth.currentUser?.uid === user.uid) {
            try {
              logFirestoreError(snapshotError, 'get', `users/${user.uid}`, { throwError: true });
            } catch {
              // Captured and logged
            }
          }
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnap) {
        unsubscribeSnap();
      }
    };
  }, [refreshKey]);

  return { tenantId, role, userName, isSuperAdmin, loading, error, retry };
}
