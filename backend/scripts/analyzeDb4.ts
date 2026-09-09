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

  console.log('Business Centers:');
  const centersSnap = await db.collection('business_centers').get();
  centersSnap.forEach(doc => {
    const d = doc.data();
    console.log(doc.id + ' - ' + d.name + ' - tenant: ' + d.tenantId);
    if (d.linkedUnits) {
      d.linkedUnits.forEach((u: any) => console.log('  Unit: ' + u.id + ' - ' + u.name));
    }
  });
}

run().catch(console.error);
