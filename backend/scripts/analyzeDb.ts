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
  initializeApp({
    projectId: config.projectId,
  });
  
  const db = getFirestore();
  const auth = getAuth();

  const usersSnap = await db.collection('users').get();
  console.log('Total users in Firestore: ' + usersSnap.size);
  usersSnap.forEach(doc => {
    const d = doc.data();
    if (d.email === 'ControlMax@gmail.com' || d.email?.includes('gringo') || d.role === 'superadmin' || d.email?.includes('vendedor')) {
      console.log('User: ' + doc.id + ' - ' + d.email + ' - role: ' + d.role + ' - tenant: ' + d.tenantId + ' - name: ' + d.name);
    }
  });

  const tenantsSnap = await db.collection('tenants').get();
  console.log('Total tenants: ' + tenantsSnap.size);
  tenantsSnap.forEach(doc => console.log('Tenant: ' + doc.id + ' - ' + doc.data().name));

  const unitsSnap = await db.collection('units').get();
  console.log('Total units: ' + unitsSnap.size);
  unitsSnap.forEach(doc => {
    const d = doc.data();
    console.log('Unit: ' + doc.id + ' - ' + d.name + ' - tenant: ' + d.tenantId);
  });

}

run().catch(console.error);
