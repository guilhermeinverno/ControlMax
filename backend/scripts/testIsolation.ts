import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

// Need to read config
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '../frontend/.env') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function testAdminLogin(email, expectedTenantId) {
  console.log(`\n========================================`);
  console.log(`TESTE: LOGIN ADMIN - ${email}`);
  console.log(`========================================`);
  
  await signInWithEmailAndPassword(auth, email, 'ControlMax-Teste-2026!');
  console.log(`[PASSOU] Login realizado: ${auth.currentUser.uid}`);
  
  // Verify tenant isolation
  const targetTenant = expectedTenantId === 'gringo_corretora' ? 'milton_tenant' : 'gringo_corretora';
  console.log(`\nTestando vazamento para o tenant: ${targetTenant}`);
  
  let docs = await getDocs(query(collection(db, 'users'), where('tenantId', '==', targetTenant))).catch(e => ({ docs: [], error: e }));
  if (docs.error || docs.docs.length === 0) {
    console.log(`[PASSOU] ZERO usuários do tenant ${targetTenant} vazados.`);
  } else {
    console.log(`[FALHOU] Vazaram ${docs.docs.length} usuários.`);
  }

  docs = await getDocs(query(collection(db, 'customers'), where('tenantId', '==', targetTenant))).catch(e => ({ docs: [], error: e }));
  if (docs.error || docs.docs.length === 0) {
    console.log(`[PASSOU] ZERO clientes do tenant ${targetTenant} vazados.`);
  } else {
    console.log(`[FALHOU] Vazaram ${docs.docs.length} clientes.`);
  }

  docs = await getDocs(query(collection(db, 'sales'), where('tenantId', '==', targetTenant))).catch(e => ({ docs: [], error: e }));
  if (docs.error || docs.docs.length === 0) {
    console.log(`[PASSOU] ZERO vendas do tenant ${targetTenant} vazadas.`);
  } else {
    console.log(`[FALHOU] Vazaram ${docs.docs.length} vendas.`);
  }

  await signOut(auth);
}

async function run() {
  await testAdminLogin('gringoadmin@controlmax.com', 'gringo_corretora');
  await testAdminLogin('miltonadmin@controlmax.com', 'milton_tenant');
  
  console.log('\nFinalizado.');
  process.exit(0);
}

run().catch(console.error);
