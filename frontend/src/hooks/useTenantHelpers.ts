import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { UserRole } from '../types';

export const ADMIN_BYPASS_EMAILS = [
  'maildojg@gmail.com',
  'legnotebooks@gmail.com',
  'brasiloficina40@gmail.com',
] as const;

export function isAdminBypassEmail(emailLower: string): boolean {
  return (ADMIN_BYPASS_EMAILS as readonly string[]).includes(emailLower);
}

export interface AdminBypassConfig {
  tenantId: string;
  role: UserRole;
  userName: string;
  isSuperAdmin: boolean;
}

export function getAdminBypassConfig(emailLower: string): AdminBypassConfig | null {
  const impersonated =
    emailLower === 'maildojg@gmail.com'
      ? localStorage.getItem('controlmax_impersonated_tenant')
      : null;

  if (emailLower === 'brasiloficina40@gmail.com') {
    return { tenantId: 'brasil_oficina', role: 'admin', userName: 'Brasil Oficina', isSuperAdmin: false };
  }
  if (emailLower === 'legnotebooks@gmail.com') {
    return { tenantId: 'leg_notebooks', role: 'admin', userName: 'Leg Notebooks', isSuperAdmin: false };
  }
  if (emailLower === 'maildojg@gmail.com') {
    return {
      tenantId: impersonated || 'super_admin_tenant',
      role: 'admin',
      userName: impersonated ? `Super Admin (${impersonated})` : 'Super Admin',
      isSuperAdmin: true,
    };
  }
  return null;
}

export function resolveDefaultTenantId(emailLower: string, impersonated: string | null): string {
  if (impersonated) return impersonated;
  if (emailLower === 'legnotebooks@gmail.com') return 'leg_notebooks';
  if (emailLower === 'brasiloficina40@gmail.com') return 'brasil_oficina';
  return 'tenant_demo';
}

export function mapRoleFromFirestore(
  roleRaw: unknown,
  emailLower: string,
  isSuperAdminFlag?: boolean
): { role: UserRole; isSuperAdmin: boolean } {
  const r = String(roleRaw || '').toLowerCase();
  const isSuper =
    r === 'superadmin' ||
    roleRaw === 'superadmin' ||
    isSuperAdminFlag === true ||
    emailLower === 'maildojg@gmail.com';

  let role: UserRole = 'collector';
  if (r.includes('admin') || isSuper) {
    role = 'admin';
  } else if (r.includes('superv') || r.includes('revis')) {
    role = 'supervisor';
  } else if (roleRaw) {
    role = roleRaw as UserRole;
  }

  return { role, isSuperAdmin: isSuper };
}

const BYPASS_PROVISIONING: Record<
  string,
  { tenantId: string; tenantName: string; userName: string; role: string; isSuperAdmin?: boolean }
> = {
  'brasiloficina40@gmail.com': {
    tenantId: 'brasil_oficina',
    tenantName: 'Brasil Oficina',
    userName: 'Brasil Oficina',
    role: 'admin',
  },
  'legnotebooks@gmail.com': {
    tenantId: 'leg_notebooks',
    tenantName: 'Leg Notebooks',
    userName: 'Leg Notebooks',
    role: 'admin',
  },
  'maildojg@gmail.com': {
    tenantId: 'super_admin_tenant',
    tenantName: 'Super Admin',
    userName: 'Super Admin',
    role: 'superadmin',
    isSuperAdmin: true,
  },
};

export function provisionBypassAccount(emailLower: string, user: User): void {
  const config = BYPASS_PROVISIONING[emailLower];
  if (!config) return;

  setDoc(
    doc(db, 'tenants', config.tenantId),
    { name: config.tenantName, active: true, createdAt: new Date() },
    { merge: true }
  ).catch((err) => console.error('Error auto-provisioning tenant:', err));

  setDoc(
    doc(db, 'users', user.uid),
    {
      email: emailLower,
      role: config.role,
      tenantId: config.tenantId,
      name: config.userName,
      userName: config.userName,
      active: true,
      ...(config.isSuperAdmin ? { isSuperAdmin: true } : {}),
    },
    { merge: true }
  ).catch((err) => console.error('Error auto-provisioning user:', err));
}

const USER_LOOKUP_TIMEOUT_MS = 15_000;

export async function findRegisteredUserByEmail(
  user: User,
  emailLower: string
): Promise<QueryDocumentSnapshot<DocumentData> | null> {
  const lookup = async (): Promise<QueryDocumentSnapshot<DocumentData> | null> => {
    const usersColl = collection(db, 'users');
    const lookups = [user.email, user.email ? emailLower : null].filter((v): v is string => !!v);

    for (const email of lookups) {
      for (const field of ['email', 'googleKey'] as const) {
        const snap = await getDocs(query(usersColl, where(field, '==', email)));
        if (!snap.empty) return snap.docs[0];
      }
    }
    return null;
  };

  const timeout = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new Error('Tempo esgotado ao buscar perfil do usuário no Firestore.')),
      USER_LOOKUP_TIMEOUT_MS
    );
  });

  return Promise.race([lookup(), timeout]);
}
