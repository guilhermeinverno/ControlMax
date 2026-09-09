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
  console.log('--- Inspecting Vendedor 7 ---');
  try {
    const u7 = await auth.getUserByEmail('vendedor7@controlmax.com');
    console.log('User 7 Auth:', u7.uid, u7.email);
    const snap7 = await db.collection('users').doc(u7.uid).get();
    console.log('User 7 Doc data:', JSON.stringify(snap7.data(), null, 2));
  } catch (e: any) {
    console.error('Error user 7:', e.message);
  }

  console.log('\n--- Business Centers in Gringo ---');
  const bcs = await db.collection('business_centers').where('tenantId', '==', 'gringo_corretora').get();
  console.log(`Found ${bcs.docs.length} business centers:`);
  bcs.docs.forEach(d => {
    console.log(`- BC ID: ${d.id}, name: ${d.data().name}, units:`, JSON.stringify(d.data().units || d.data().subUnits));
  });
}

run().catch(console.error);
