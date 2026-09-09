import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf-8'));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

async function test() {
  const cred = await signInWithEmailAndPassword(auth, 'vendedor7@controlmax.com', 'ControlMax-Teste-2026!');
  console.log('Logged in as:', cred.user.uid, cred.user.email);

  const nonExistentId = 'non_existent_' + Date.now();
  console.log('Testing getDoc on non-existent customer document:', nonExistentId);
  try {
    const snap = await getDoc(doc(db, 'customers', nonExistentId));
    console.log('[PASS] getDoc returned without error! exists:', snap.exists());
  } catch (err: any) {
    console.error('[FAIL] getDoc threw error:', err.code, err.message);
  }
}

test().catch(console.error).finally(() => process.exit(0));
