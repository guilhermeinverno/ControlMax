/**
 * Cria (ou atualiza) o inquilino inicial e o usuário administrador do cliente no Firebase Auth + Firestore.
 *
 * Uso:
 *   export GOOGLE_APPLICATION_CREDENTIALS="/caminho/service-account.json"
 *   npx tsx src/scripts/seedInitialClient.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLIENT_EMAIL = 'oficinabrasil279@gmail.com';
const CLIENT_PASSWORD = process.env.CLIENT_PASSWORD || 'OficinaBrasil-2026!';
const TENANT_ID = 'tenant_oficinabrasil';
const TENANT_NAME = 'Oficina Brasil';
const DISPLAY_NAME = 'Oficina Brasil Admin';

function loadFirebaseConfig(): { projectId: string; firestoreDatabaseId?: string } {
  // Tentar carregar da pasta backend ou frontend
  const backendConfig = path.join(__dirname, '..', '..', 'backend', 'firebase-applet-config.json');
  const frontendConfig = path.join(__dirname, '..', '..', 'frontend', 'firebase-applet-config.json');
  const exampleConfig = path.join(__dirname, '..', '..', 'backend', 'firebase-applet-config.example.json');
  
  const resolved = fs.existsSync(backendConfig) 
    ? backendConfig 
    : fs.existsSync(frontendConfig) 
      ? frontendConfig 
      : exampleConfig;
      
  return JSON.parse(fs.readFileSync(resolved, 'utf-8'));
}

function initAdminApp(): void {
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const config = loadFirebaseConfig();

  if (credentialsPath && fs.existsSync(credentialsPath)) {
    console.log(`[Firebase Admin] Inicializando com GOOGLE_APPLICATION_CREDENTIALS: ${credentialsPath}`);
    const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: config.projectId || serviceAccount.project_id,
    });
  } else if (serviceAccountKey) {
    console.log(`[Firebase Admin] Inicializando com FIREBASE_SERVICE_ACCOUNT_KEY da variável de ambiente.`);
    const serviceAccount = JSON.parse(serviceAccountKey);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: config.projectId || serviceAccount.project_id,
    });
  } else {
    console.warn(`[Firebase Admin] Nenhuma credencial encontrada. Usando inicialização padrão.`);
    admin.initializeApp({
      projectId: config.projectId || 'dummy-project',
    });
  }
}

async function ensureAuthUser(): Promise<string> {
  const auth = getAuth();

  try {
    const existing = await auth.getUserByEmail(CLIENT_EMAIL);
    await auth.updateUser(existing.uid, {
      password: CLIENT_PASSWORD,
      displayName: DISPLAY_NAME,
      emailVerified: true,
      disabled: false,
    });
    console.log(`Usuário Auth já existia — senha e perfil atualizados (uid: ${existing.uid})`);
    return existing.uid;
  } catch (error: unknown) {
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
    if (code !== 'auth/user-not-found') {
      throw error;
    }
  }

  const created = await auth.createUser({
    email: CLIENT_EMAIL,
    password: CLIENT_PASSWORD,
    displayName: DISPLAY_NAME,
    emailVerified: true,
    disabled: false,
  });
  console.log(`Usuário Auth criado (uid: ${created.uid})`);
  return created.uid;
}

async function ensureFirestoreProfile(uid: string): Promise<void> {
  const config = loadFirebaseConfig();
  const db = config.firestoreDatabaseId
    ? getFirestore(admin.app(), config.firestoreDatabaseId)
    : getFirestore();

  const now = FieldValue.serverTimestamp();

  // 1. Cadastrar Tenant
  await db.collection('tenants').doc(TENANT_ID).set(
    {
      name: TENANT_NAME,
      active: true,
      plan: 'standard',
      billingStatus: 'active',
      createdAt: now,
      updatedAt: now,
    },
    { merge: true },
  );

  // 2. Cadastrar Perfil do Usuário
  await db.collection('users').doc(uid).set(
    {
      email: CLIENT_EMAIL,
      role: 'admin',
      tenantId: TENANT_ID,
      name: DISPLAY_NAME,
      userName: DISPLAY_NAME,
      username: 'oficina_brasil_admin',
      firstName: 'Oficina',
      lastName1: 'Brasil',
      active: true,
      isSuperAdmin: false,
      createdAt: new Date().toISOString(),
      updatedAt: now,
    },
    { merge: true },
  );

  // 3. Cadastrar Platform Settings
  await db.collection('platform_settings').doc(TENANT_ID).set(
    {
      tenantId: TENANT_ID,
      platformName: TENANT_NAME,
      updatedAt: now,
    },
    { merge: true },
  );

  console.log(`Perfil Firestore provisionado em tenants/${TENANT_ID} e users/${uid}`);
}

async function main(): Promise<void> {
  initAdminApp();
  const uid = await ensureAuthUser();
  await ensureFirestoreProfile(uid);

  console.log('\n--- Inquilino e Usuário do Cliente Pronto ---');
  console.log(`Email:    ${CLIENT_EMAIL}`);
  console.log(`Senha:    ${CLIENT_PASSWORD}`);
  console.log(`Tenant:   ${TENANT_ID}`);
  console.log(`Role:     admin`);
  console.log('Login:    http://localhost:5173/login');
}

main().catch((error) => {
  console.error('Falha ao criar inquilino e usuário do cliente:', error);
  process.exit(1);
});
