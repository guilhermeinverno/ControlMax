import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, updateDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf-8'));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

async function test() {
  const cred = await signInWithEmailAndPassword(auth, 'vendedor7@controlmax.com', 'ControlMax-Teste-2026!');
  console.log('Logged in as:', cred.user.uid, cred.user.email);
  try {
    await setDoc(doc(db, 'users', cred.user.uid), {
      name: 'Vendedor Sete',
      phone: '11999999999'
    }, { merge: true });
    console.log('[PASS] setDoc with merge worked!');
  } catch (e: any) {
    console.error('[FAIL] setDoc with merge failed:', e.code, e.message);
  }

  try {
    await updateDoc(doc(db, 'users', cred.user.uid), {
      name: 'Vendedor Sete',
      phone: '11999999999'
    });
    console.log('[PASS] updateDoc worked!');
  } catch (e: any) {
    console.error('[FAIL] updateDoc failed:', e.code, e.message);
  }
}

test().catch(console.error).finally(() => process.exit(0));
