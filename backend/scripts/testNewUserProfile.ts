import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf-8'));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

async function testNewUser() {
  const randomEmail = `testuser_${Date.now()}@controlmax.com`;
  console.log('Creating new user in Auth:', randomEmail);
  const cred = await createUserWithEmailAndPassword(auth, randomEmail, 'ControlMax-Teste-2026!');
  console.log('Created Auth user:', cred.user.uid);

  try {
    await setDoc(doc(db, 'users', cred.user.uid), {
      name: 'Novo Testador',
      phone: '11988887777',
      role: 'collector',
      tenantId: 'gringo_corretora'
    }, { merge: true });
    console.log('[SUCCESS] New user without previous doc saved profile cleanly!');
  } catch (e: any) {
    console.error('[FAIL] New user failed to save profile:', e.code, e.message);
  }
}

testNewUser().catch(console.error).finally(() => process.exit(0));
