import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadFirebaseConfig() {
  const configPath = path.join(__dirname, '..', 'firebase-applet-config.json');
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

async function run() {
  const config = loadFirebaseConfig();
  if (getApps().length === 0) {
    initializeApp({ projectId: config.projectId });
  }
  
  const db = getFirestore();
  const auth = getAuth();

  const TENANT_GRINGO = 'gringo_corretora';
  const TENANT_MILTON = 'milton_tenant';

  // 1. Wipe old test data from tenant_teste
  const oldTenant = 'tenant_teste';
  console.log('Wiping data for tenant:', oldTenant);
  
  const collectionsToWipe = ['sales', 'collections', 'boxes', 'routes', 'customers', 'business_centers'];
  for (const col of collectionsToWipe) {
    const snap = await db.collection(col).where('tenantId', '==', oldTenant).get();
    console.log('Deleting', snap.size, 'documents from', col);
    const batch = db.batch();
    snap.forEach(doc => batch.delete(doc.ref));
    if (snap.size > 0) {
        await batch.commit();
    }
  }

  // Delete test users
  const usersSnap = await db.collection('users').where('tenantId', '==', oldTenant).get();
  console.log('Deleting', usersSnap.size, 'test users');
  for (const doc of usersSnap.docs) {
    const d = doc.data();
    if (d.role !== 'superadmin' && d.email !== 'controlmaxia@gmail.com' && d.email !== 'ControlMax@gmail.com') {
      try {
        await auth.deleteUser(doc.id);
        console.log('Deleted auth for', d.email);
      } catch (e) {}
      await doc.ref.delete();
    }
  }

  // 2. Super Admin
  const saEmail = 'ControlMax@gmail.com';
  let saUid = '';
  try {
    const saUser = await auth.getUserByEmail(saEmail);
    saUid = saUser.uid;
  } catch (e) {
    const saUser = await auth.createUser({ email: saEmail, password: 'ControlMax-Admin-2026!', displayName: 'Super Admin Master' });
    saUid = saUser.uid;
  }
  await db.collection('users').doc(saUid).set({
    email: saEmail, role: 'superadmin', isSuperAdmin: true, tenantId: 'super_admin_tenant', name: 'Super Admin Master', active: true
  }, { merge: true });

  // 3. Tenants
  await db.collection('tenants').doc(TENANT_GRINGO).set({ name: 'Gringo Corretora', active: true });
  await db.collection('tenants').doc(TENANT_MILTON).set({ name: 'Milton', active: true });

  // 4. Gringo Corretora BCs & Units
  const gringoBcs = [
    { id: 'bc_norte_gringo', name: 'Norte', unitId: 'unit_norte_gringo' },
    { id: 'bc_sul_gringo', name: 'Sul', unitId: 'unit_sul_gringo' },
    { id: 'bc_leste_gringo', name: 'Leste', unitId: 'unit_leste_gringo' },
    { id: 'bc_oeste_gringo', name: 'Oeste', unitId: 'unit_oeste_gringo' },
    { id: 'bc_ceu_azul_gringo', name: 'Céu Azul', unitId: 'unit_ceu_azul_gringo' }
  ];

  for (const bc of gringoBcs) {
    await db.collection('business_centers').doc(bc.id).set({
      tenantId: TENANT_GRINGO, name: bc.name, code: bc.name.substring(0, 3).toUpperCase(), status: 'Activo',
      linkedUnits: [{ id: bc.unitId, name: 'Unidade ' + bc.name, active: true }]
    });
  }

  // Gringo Admin
  let gringoAdminUid = '';
  try {
    const u = await auth.getUserByEmail('gringoadmin@controlmax.com');
    gringoAdminUid = u.uid;
  } catch (e) {
    const u = await auth.createUser({ email: 'gringoadmin@controlmax.com', password: 'ControlMax-Teste-2026!' });
    gringoAdminUid = u.uid;
  }
  await db.collection('users').doc(gringoAdminUid).set({
    email: 'gringoadmin@controlmax.com', role: 'admin', tenantId: TENANT_GRINGO, active: true, name: 'Gringo Admin'
  });

  // 12 Vendedores
  for (let i = 1; i <= 12; i++) {
    const email = `vendedor${i}@controlmark.com`;
    let uid = '';
    try {
      const u = await auth.getUserByEmail(email);
      uid = u.uid;
      await auth.updateUser(uid, { password: 'ControlMax-Teste-2026!' });
    } catch (e) {
      const u = await auth.createUser({ email: email, password: 'ControlMax-Teste-2026!' });
      uid = u.uid;
    }
    await db.collection('users').doc(uid).set({
      email: email, role: 'collector', tenantId: TENANT_GRINGO, active: true, name: '', phone: '', usuarioUnidades: ['unit_ceu_azul_gringo']
    });
  }

  // 5. Milton Tenant
  await db.collection('business_centers').doc('bc_matriz_milton').set({
    tenantId: TENANT_MILTON, name: 'Matriz Milton', code: 'MIL', status: 'Activo',
    linkedUnits: [{ id: 'unit_matriz_milton', name: 'Unidade Matriz Milton', active: true }]
  });

  let miltonAdminUid = '';
  try {
    const u = await auth.getUserByEmail('miltonadmin@controlmax.com');
    miltonAdminUid = u.uid;
  } catch (e) {
    const u = await auth.createUser({ email: 'miltonadmin@controlmax.com', password: 'ControlMax-Teste-2026!' });
    miltonAdminUid = u.uid;
  }
  await db.collection('users').doc(miltonAdminUid).set({
    email: 'miltonadmin@controlmax.com', role: 'admin', tenantId: TENANT_MILTON, active: true, name: 'Milton Admin'
  });

  console.log('Preparation Complete.');
}

run().catch(console.error);
