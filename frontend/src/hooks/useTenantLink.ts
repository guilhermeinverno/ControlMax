import { User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import {
  findRegisteredUserByEmail,
  mapRoleFromFirestore,
} from './useTenantHelpers';
import { applyExistingUserDoc, applyGuestState, TenantSetters } from './useTenantState';

function getImpersonatedTenant(isSuperAdmin: boolean): string | null {
  // Impersonação só para superadmin (flag/role no Firestore), nunca por lista de e-mails.
  return isSuperAdmin ? localStorage.getItem('controlmax_impersonated_tenant') : null;
}

function buildLinkedUserPayload(
  user: User,
  emailLower: string,
  foundData: Record<string, unknown>
) {
  const { role: mappedRole, isSuperAdmin } = mapRoleFromFirestore(
    foundData.role,
    emailLower,
    foundData.isSuperAdmin as boolean | undefined
  );

  return {
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
  };
}

async function applyLinkedUser(
  user: User,
  emailLower: string,
  foundData: Record<string, unknown>,
  setters: TenantSetters
) {
  const { isSuperAdmin } = mapRoleFromFirestore(
    foundData.role,
    emailLower,
    foundData.isSuperAdmin as boolean | undefined
  );
  const impersonated = getImpersonatedTenant(isSuperAdmin);
  applyExistingUserDoc(user, emailLower, foundData, setters);
  if (impersonated) {
    setters.setTenantId(impersonated);
    setters.setUserName(`Super Admin (${impersonated})`);
  }
}

export async function handleMissingUserDoc(
  user: User,
  emailLower: string,
  userDocRef: ReturnType<typeof doc>,
  setters: TenantSetters
) {
  let foundData: Record<string, unknown> | null = null;
  try {
    const foundDoc = await findRegisteredUserByEmail(user, emailLower);
    if (foundDoc) {
      foundData = foundDoc.data();
    }
  } catch (findErr) {
    console.warn('Error finding registered user by email:', findErr);
  }

  if (foundData) {
    try {
      await setDoc(userDocRef, buildLinkedUserPayload(user, emailLower, foundData), { merge: true });
    } catch (writeErr) {
      console.warn('setDoc failed (permissions), applying profile locally:', writeErr);
    }
    await applyLinkedUser(user, emailLower, foundData, setters);
    return;
  }

  applyGuestState(user, emailLower, false, setters);
}

