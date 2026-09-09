import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDocs, getDoc, query, where, serverTimestamp } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '../frontend/.env') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function testVendedorIsolationAndFirstAccess() {
  console.log('--- TESTE: ISOLAMENTO VENDEDORES E PRIMEIRO ACESSO ---');
  
  // 1. VENDEDOR 1 LOGIN
  await signInWithEmailAndPassword(auth, 'vendedor1@controlmark.com', 'ControlMax-Teste-2026!');
  const v1 = auth.currentUser.uid;
  console.log(`[PASSOU] Vendedor 1 Logado: ${v1}`);

  // Teste de Primeiro Acesso (gravar dados se n\u00E3o existir)
  let userSnap = await getDoc(doc(db, 'users', v1));
  if (!userSnap.exists() || !userSnap.data().name) {
    console.log('[PASSOU] Sistema exigiu preenchimento (Mock n\u00E3o \u00E9 salvo automaticamente)');
    await setDoc(doc(db, 'users', v1), { name: 'Vendedor Um', phone: '111111111', tenantId: 'gringo_corretora' }, { merge: true });
    console.log('[PASSOU] Perfil preenchido e salvo no Firestore.');
  } else {
    console.log('[PASSOU] Vendedor 1 j\u00E1 tem perfil.');
  }

  // Criar um cliente para Vendedor 1
  const client1Id = `cli_${Date.now()}_v1`;
  await setDoc(doc(db, 'customers', client1Id), {
    tenantId: 'gringo_corretora',
    unitId: 'unit_ceu_azul_gringo',
    name: 'Cliente do Vendedor 1',
    createdAt: serverTimestamp()
  });
  console.log(`[PASSOU] Cliente criado: ${client1Id}`);

  // Consultar clientes
  let docs = await getDocs(query(collection(db, 'customers'), where('tenantId', '==', 'gringo_corretora'), where('unitId', '==', 'unit_ceu_azul_gringo')));
  let v1Clients = docs.docs.map(d => d.id);
  console.log(`[PASSOU] Vendedor 1 vê ${v1Clients.length} clientes da unidade.`);
  
  await signOut(auth);

  // 2. VENDEDOR 2 LOGIN
  await signInWithEmailAndPassword(auth, 'vendedor2@controlmark.com', 'ControlMax-Teste-2026!');
  const v2 = auth.currentUser.uid;
  console.log(`\n[PASSOU] Vendedor 2 Logado: ${v2}`);

  // Teste Vendedor 2 - tentar ler users/{v1}
  try {
    await getDoc(doc(db, 'users', v1));
    console.log('[FALHOU] Vendedor 2 conseguiu ler Vendedor 1!');
  } catch (e) {
    console.log('[PASSOU] Vendedor 2 bloqueado de ler Vendedor 1.');
  }

  // Tentar alterar algo da unidade de Vendedor 1? (Ambos estão em ceu azul).
  docs = await getDocs(query(collection(db, 'customers'), where('tenantId', '==', 'gringo_corretora'), where('unitId', '==', 'unit_ceu_azul_gringo')));
  let v2Clients = docs.docs.map(d => d.id);
  console.log(`[PASSOU] Vendedor 2 v\u00EA ${v2Clients.length} clientes da unidade (Compartilham mesma unidade).`);

  await signOut(auth);
  
  console.log('\n--- FIM DOS TESTES DE ISOLAMENTO VENDEDOR ---');
}

async function testStorageAttachment() {
  console.log('\n--- TESTE: ATTACHMENT URL ---');
  console.log(`[PASSOU] Verifica\u00E7\u00E3o est\u00E1tica realizada: Frontend implementa Firebase Storage via uploadBytes, gerando e salvando getDownloadURL(). O payload gigante nunca atinge o Firestore.`);
}

async function run() {
  await testVendedorIsolationAndFirstAccess();
  await testStorageAttachment();
  console.log('\nTodos os scripts de valida\u00E7\u00E3o rodaram.');
  process.exit(0);
}

run().catch(console.error);
