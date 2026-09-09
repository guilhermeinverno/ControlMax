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

  console.log('Collector config:');
  const usersSnap = await db.collection('users').where('role', '==', 'collector').limit(1).get();
  usersSnap.forEach(doc => {
    console.log(JSON.stringify(doc.data(), null, 2));
  });
}

run().catch(console.error);
