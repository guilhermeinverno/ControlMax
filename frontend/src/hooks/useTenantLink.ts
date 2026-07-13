import { User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import {
  findRegisteredUserByEmail,
  isAdminBypassEmail,
  mapRoleFromFirestore,
} from './useTenantHelpers';
import { applyExistingUserDoc, applyGuestState, TenantSetters } from './useTenantState';

function getImpersonatedTenant(emailLower: string): string | null {
  return (emailLower === 'gringoeletronica@gmail.com' || emailLower === 'controlmaxia@gmail.com')
    ? localStorage.getItem('controlmax_impersonated_tenant')
    : null;
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
  const impersonated = getImpersonatedTenant(emailLower);
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
  const hasAdminBypass = isAdminBypassEmail(emailLower);

  try {
    const foundDoc = await findRegisteredUserByEmail(user, emailLower);
    if (!foundDoc) {
      applyGuestState(user, emailLower, hasAdminBypass, setters);
      return;
    }

    const foundData = foundDoc.data();
    await setDoc(userDocRef, buildLinkedUserPayload(user, emailLower, foundData), { merge: true });
    await applyLinkedUser(user, emailLower, foundData, setters);
  } catch (err) {
    console.error('Error auto-linking registered user by email:', err);
    applyGuestState(user, emailLower, hasAdminBypass, setters);
  }
}
