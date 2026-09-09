import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadFirebaseConfig() {
  const configPath = path.join(__dirname, '..', 'firebase-applet-config.json');
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

async function run() {
  const config = loadFirebaseConfig();
  initializeApp({ projectId: config.projectId });
  
  const db = getFirestore();
  const auth = getAuth();

  console.log('--- 1. SUPER ADMIN DIAGNOSIS ---');
  const emailsToCheck = ['controlmaxia@gmail.com', 'ControlMax@gmail.com', 'controlmax@gmail.com'];
  
  for (const email of emailsToCheck) {
    try {
      const userRecord = await auth.getUserByEmail(email);
      console.log('AUTH: Found ' + email + ' -> UID: ' + userRecord.uid);
    } catch (e) {
      console.log('AUTH: Not found ' + email);
    }

    const snap = await db.collection('users').where('email', '==', email).get();
    if (snap.empty) {
      console.log('FIRESTORE: Not found exact match for ' + email);
    } else {
      snap.forEach(doc => {
        const d = doc.data();
        console.log('FIRESTORE: Found ' + email + ' -> UID: ' + doc.id + ', role: ' + d.role + ', isSuperAdmin: ' + d.isSuperAdmin + ', tenantId: ' + d.tenantId + ', name: ' + d.name);
      });
    }
  }

  console.log('\n--- 2. DB INVENTORY ---');
  const collections = ['users', 'tenants', 'business_centers', 'businessCenters', 'units', 'sales', 'customers', 'collections', 'boxes', 'transfers', 'routes'];
  for (const col of collections) {
    const snap = await db.collection(col).get();
    console.log('Collection: ' + col + ' - Count: ' + snap.size);
  }

  console.log('\n--- 3. CURRENT TENANT / BC / UNIT STRUCTURE ---');
  const bcSnap = await db.collection('business_centers').get();
  bcSnap.forEach(doc => {
    const d = doc.data();
    console.log('BC [' + doc.id + ']: ' + d.name + ' (Tenant: ' + d.tenantId + ')');
    if (d.linkedUnits && Array.isArray(d.linkedUnits)) {
      d.linkedUnits.forEach(u => console.log('  -> Unit [' + u.id + ']: ' + u.name));
    }
  });

}

run().catch(console.error);
