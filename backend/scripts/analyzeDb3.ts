import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
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

  console.log('Units:');
  const unitsSnap = await db.collection('units').get();
  unitsSnap.forEach(doc => {
    const d = doc.data();
    console.log(doc.id + ' - ' + d.name + ' - tenant: ' + d.tenantId);
  });
  
  console.log('Tenants:');
  const tenantsSnap = await db.collection('tenants').get();
  tenantsSnap.forEach(doc => {
    const d = doc.data();
    console.log(doc.id + ' - ' + d.name);
  });
}

run().catch(console.error);
