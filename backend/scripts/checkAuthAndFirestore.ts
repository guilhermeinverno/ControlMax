import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadConfig() {
  const p1 = path.join(__dirname, '..', 'firebase-applet-config.json');
  const p2 = path.join(__dirname, '..', '..', 'firebase-applet-config.json');
  if (fs.existsSync(p1)) return JSON.parse(fs.readFileSync(p1, 'utf-8'));
  if (fs.existsSync(p2)) return JSON.parse(fs.readFileSync(p2, 'utf-8'));
  throw new Error('Config not found');
}

const config = loadConfig();
if (!getApps().length) initializeApp({ projectId: config.projectId });
const auth = getAuth();
const db = getFirestore();

async function run() {
  const usersList = await auth.listUsers();
  console.log(`Total Auth Users: ${usersList.users.length}`);
  for (const u of usersList.users) {
    const snap = await db.collection('users').doc(u.uid).get();
    console.log(`Email: ${u.email} | UID: ${u.uid} | Doc Exists: ${snap.exists} | Name: "${snap.data()?.name}" | Phone: "${snap.data()?.phone}" | Role: "${snap.data()?.role}" | Tenant: "${snap.data()?.tenantId}"`);
  }
}

run().catch(console.error).finally(() => process.exit(0));
