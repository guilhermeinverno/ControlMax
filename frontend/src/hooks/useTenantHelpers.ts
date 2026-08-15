import {
  collection,
  query,
  where,
  getDocs,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { UserRole } from '../types';

export function resolveDefaultTenantId(emailLower: string, impersonated: string | null): string {
  if (impersonated) return impersonated;
  if (emailLower === 'coletor.teste@controlmax.com') return 'teste@controlmax.dev';
  return '';
}

export function mapRoleFromFirestore(
  roleRaw: unknown,
  _emailLower: string,
  isSuperAdminFlag?: boolean
): { role: UserRole; isSuperAdmin: boolean } {
  const r = String(roleRaw || '').toLowerCase();
  const isSuper = r === 'superadmin' || roleRaw === 'superadmin' || isSuperAdminFlag === true;

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

