import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, onSnapshot, setDoc, collection, query, where, getDocs, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { UserRole } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function useTenant() {
  const [tenantId, setTenantId] = useState<string>('');
  const [role, setRole] = useState<UserRole>('collector');
  const [userName, setUserName] = useState<string>('');
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let unsubscribeSnap: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // Clean up previous snapshot listener if it exists
      if (unsubscribeSnap) {
        unsubscribeSnap();
        unsubscribeSnap = null;
      }

      if (!user) {
        setTenantId('');
        setRole('collector');
        setUserName('');
        setIsSuperAdmin(false);
        setLoading(false);
        return;
      }

      const emailLower = user.email?.toLowerCase() || '';
      const hasAdminBypass = emailLower === 'maildojg@gmail.com' || emailLower === 'legnotebooks@gmail.com' || emailLower === 'brasiloficina40@gmail.com';
      
      // Instantly set state for admin bypass emails to prevent loading delays or rules blocking menus
      if (emailLower === 'brasiloficina40@gmail.com') {
        setTenantId('brasil_oficina');
        setRole('admin');
        setUserName('Brasil Oficina');
        setIsSuperAdmin(false);
        setLoading(false);
      } else if (emailLower === 'legnotebooks@gmail.com') {
        setTenantId('leg_notebooks');
        setRole('admin');
        setUserName('Leg Notebooks');
        setIsSuperAdmin(false);
        setLoading(false);
      } else if (emailLower === 'maildojg@gmail.com') {
        const impersonated = localStorage.getItem('controlmax_impersonated_tenant');
        setTenantId(impersonated || 'super_admin_tenant');
        setRole('admin');
        setUserName(impersonated ? `Super Admin (${impersonated})` : 'Super Admin');
        setIsSuperAdmin(true);
        setLoading(false);
      } else {
        setLoading(true);
      }

      // Auto-provisioning in the background if the client logs in
      if (emailLower === 'brasiloficina40@gmail.com') {
        const tenantRef = doc(db, 'tenants', 'brasil_oficina');
        setDoc(tenantRef, {
          name: 'Brasil Oficina',
          active: true,
          createdAt: new Date()
        }, { merge: true }).catch(err => {
          console.error("Error auto-provisioning tenant for client:", err);
        });

        const userDocRef = doc(db, 'users', user.uid);
        setDoc(userDocRef, {
          email: 'brasiloficina40@gmail.com',
          role: 'admin',
          tenantId: 'brasil_oficina',
          name: 'Brasil Oficina',
          userName: 'Brasil Oficina',
          active: true
        }, { merge: true }).catch(err => {
          console.error("Error auto-provisioning user for client:", err);
        });
      }

      if (emailLower === 'legnotebooks@gmail.com') {
        const tenantRef = doc(db, 'tenants', 'leg_notebooks');
        setDoc(tenantRef, {
          name: 'Leg Notebooks',
          active: true,
          createdAt: new Date()
        }, { merge: true }).catch(err => {
          console.error("Error auto-provisioning tenant for client:", err);
        });

        const userDocRef = doc(db, 'users', user.uid);
        setDoc(userDocRef, {
          email: 'legnotebooks@gmail.com',
          role: 'admin',
          tenantId: 'leg_notebooks',
          name: 'Leg Notebooks',
          userName: 'Leg Notebooks',
          active: true
        }, { merge: true }).catch(err => {
          console.error("Error auto-provisioning user for client:", err);
        });
      }

      if (emailLower === 'maildojg@gmail.com') {
        const tenantRef = doc(db, 'tenants', 'super_admin_tenant');
        setDoc(tenantRef, {
          name: 'Super Admin',
          active: true,
          createdAt: new Date()
        }, { merge: true }).catch(err => {
          console.error("Error auto-provisioning tenant for super admin:", err);
        });

        const userDocRef = doc(db, 'users', user.uid);
        setDoc(userDocRef, {
          email: 'maildojg@gmail.com',
          role: 'superadmin',
          tenantId: 'super_admin_tenant',
          name: 'Super Admin',
          userName: 'Super Admin',
          active: true
        }, { merge: true }).catch(err => {
          console.error("Error auto-provisioning user for super admin:", err);
        });
      }

      if (hasAdminBypass) {
        return;
      }

      const userDocRef = doc(db, 'users', user.uid);
      
      unsubscribeSnap = onSnapshot(userDocRef, async (docSnap) => {
        const hasAdminBypass = emailLower === 'maildojg@gmail.com' || emailLower === 'legnotebooks@gmail.com' || emailLower === 'brasiloficina40@gmail.com';
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          const impersonated = emailLower === 'maildojg@gmail.com' ? localStorage.getItem('controlmax_impersonated_tenant') : null;
          setTenantId(impersonated || data.tenantId || (emailLower === 'legnotebooks@gmail.com' ? 'leg_notebooks' : emailLower === 'brasiloficina40@gmail.com' ? 'brasil_oficina' : 'tenant_demo'));
          
          let userRole: UserRole = 'collector';
          const r = String(data.role || '').toLowerCase();
          const isSuper = r === 'superadmin' || data.role === 'superadmin' || data.isSuperAdmin === true || emailLower === 'maildojg@gmail.com';
          
          setIsSuperAdmin(isSuper);

          if (r.includes('admin') || isSuper) {
            userRole = 'admin';
          } else if (r.includes('superv') || r.includes('revis')) {
            userRole = 'supervisor';
          } else if (r.includes('cajero') || r.includes('collector') || r.includes('operador')) {
            userRole = 'collector';
          } else {
            userRole = (data.role as UserRole) || 'collector';
          }

          setRole(hasAdminBypass ? 'admin' : userRole);
          setUserName(impersonated ? `Super Admin (${impersonated})` : (data.userName || data.name || user.displayName || user.email?.split('@')[0] || ''));
          setLoading(false);
        } else {
          // Document by UID does not exist. Let's see if we can find a registered user document by email or googleKey
          try {
            const usersColl = collection(db, 'users');
            let foundDoc: QueryDocumentSnapshot<DocumentData> | null = null;

            // 1. Query: email == user.email
            if (user.email) {
              const q1 = query(usersColl, where('email', '==', user.email));
              const snap1 = await getDocs(q1);
              if (!snap1.empty) {
                foundDoc = snap1.docs[0];
              }
            }

            // 2. Query: googleKey == user.email
            if (!foundDoc && user.email) {
              const q2 = query(usersColl, where('googleKey', '==', user.email));
              const snap2 = await getDocs(q2);
              if (!snap2.empty) {
                foundDoc = snap2.docs[0];
              }
            }

            // 3. Query: email == emailLower
            if (!foundDoc && emailLower && emailLower !== user.email) {
              const q3 = query(usersColl, where('email', '==', emailLower));
              const snap3 = await getDocs(q3);
              if (!snap3.empty) {
                foundDoc = snap3.docs[0];
              }
            }

            // 4. Query: googleKey == emailLower
            if (!foundDoc && emailLower && emailLower !== user.email) {
              const q4 = query(usersColl, where('googleKey', '==', emailLower));
              const snap4 = await getDocs(q4);
              if (!snap4.empty) {
                foundDoc = snap4.docs[0];
              }
            }

            if (foundDoc) {
              const foundData = foundDoc.data();
              
              let mappedRole = 'collector';
              const r = String(foundData.role || '').toLowerCase();
              const isSuper = r === 'superadmin' || foundData.role === 'superadmin' || foundData.isSuperAdmin === true || emailLower === 'maildojg@gmail.com';
              
              setIsSuperAdmin(isSuper);

              if (r.includes('admin') || isSuper) {
                mappedRole = 'admin';
              } else if (r.includes('superv') || r.includes('revis')) {
                mappedRole = 'supervisor';
              } else {
                mappedRole = 'collector';
              }

              const createdData = {
                ...foundData,
                userName: foundData.username || foundData.userName || foundData.firstName || user.displayName || user.email?.split('@')[0] || 'Cobrador',
                name: `${foundData.firstName || ''} ${foundData.lastName1 || ''}`.trim() || foundData.name || user.displayName || 'Cobrador',
                role: isSuper ? 'superadmin' : mappedRole,
                active: foundData.active !== undefined ? foundData.active : true,
                tenantId: foundData.tenantId,
                linkedToUid: user.uid
              };

              // Auto-link/copy registration document to user.uid
              await setDoc(userDocRef, createdData, { merge: true });
              // The onSnapshot will automatically trigger again because userDocRef is now written
            } else {
              const impersonated = emailLower === 'maildojg@gmail.com' ? localStorage.getItem('controlmax_impersonated_tenant') : null;
              setTenantId(impersonated || (emailLower === 'legnotebooks@gmail.com' ? 'leg_notebooks' : emailLower === 'brasiloficina40@gmail.com' ? 'brasil_oficina' : 'tenant_demo'));
              setRole(hasAdminBypass ? 'admin' : 'collector');
              setIsSuperAdmin(emailLower === 'maildojg@gmail.com');
              setUserName(impersonated ? `Super Admin (${impersonated})` : (user.displayName || user.email?.split('@')[0] || ''));
              setLoading(false);
            }
          } catch (err) {
            console.error("Error auto-linking registered user by email:", err);
            setTenantId(emailLower === 'legnotebooks@gmail.com' ? 'leg_notebooks' : emailLower === 'brasiloficina40@gmail.com' ? 'brasil_oficina' : 'tenant_demo');
            setRole(hasAdminBypass ? 'admin' : 'collector');
            setIsSuperAdmin(emailLower === 'maildojg@gmail.com');
            setUserName(user.displayName || user.email?.split('@')[0] || '');
            setLoading(false);
          }
        }
      }, (error) => {
        setLoading(false);
        // Only report or throw if the current authenticated user matches the expected user
        if (auth.currentUser?.uid === user.uid) {
          try {
            handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
          } catch (e) {
            // Captured and logged
          }
        }
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnap) {
        unsubscribeSnap();
      }
    };
  }, []);

  return { tenantId, role, userName, isSuperAdmin, loading };
}
