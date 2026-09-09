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

  const usersSnap = await db.collection('users').get();
  usersSnap.forEach(doc => {
    const d = doc.data();
    console.log(doc.id + ' - ' + d.email);
  });

  const bcSnap = await db.collection('businessCenters').get();
  bcSnap.forEach(doc => {
    const d = doc.data();
    console.log('BC: ' + doc.id + ' - ' + d.name + ' - tenant: ' + d.tenantId);
  });
}

run().catch(console.error);
