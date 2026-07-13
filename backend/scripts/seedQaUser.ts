/**
 * Cria (ou atualiza) o usuário de homologação no Firebase Auth + Firestore.
 *
 * Uso:
 *   export GOOGLE_APPLICATION_CREDENTIALS="/caminho/service-account.json"
 *   cd backend && npm run seed:qa-user
 *
 * Variáveis opcionais:
 *   QA_USER_EMAIL      (padrão: qa@controlmax.dev)
 *   QA_USER_PASSWORD   (padrão: ControlMax-QA-2026!)
 *   QA_TENANT_ID       (padrão: tenant_qa)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const QA_EMAIL = process.env.QA_USER_EMAIL || 'qa@controlmax.dev';
const QA_PASSWORD = process.env.QA_USER_PASSWORD || 'ControlMax-QA-2026!';
const QA_TENANT_ID = process.env.QA_TENANT_ID || 'tenant_qa';
const QA_TENANT_NAME = 'ControlMax QA';
const QA_DISPLAY_NAME = 'QA Admin';

function loadFirebaseConfig(): { projectId: string; firestoreDatabaseId?: string } {
  const configPath = path.join(__dirname, '..', 'firebase-applet-config.json');
  const examplePath = path.join(__dirname, '..', 'firebase-applet-config.example.json');
  const resolved = fs.existsSync(configPath) ? configPath : examplePath;
  return JSON.parse(fs.readFileSync(resolved, 'utf-8'));
}

function initAdminApp(): void {
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credentialsPath || !fs.existsSync(credentialsPath)) {
    console.error(
      'Erro: defina GOOGLE_APPLICATION_CREDENTIALS apontando para o JSON da service account do Firebase.',
    );
    console.error('Console Firebase → Configurações do projeto → Contas de serviço → Gerar nova chave privada');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
  const config = loadFirebaseConfig();

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: config.projectId || serviceAccount.project_id,
  });
}

async function ensureAuthUser(): Promise<string> {
  const auth = admin.auth();

  try {
    const existing = await auth.getUserByEmail(QA_EMAIL);
    await auth.updateUser(existing.uid, {
      password: QA_PASSWORD,
      displayName: QA_DISPLAY_NAME,
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
    email: QA_EMAIL,
    password: QA_PASSWORD,
    displayName: QA_DISPLAY_NAME,
    emailVerified: true,
    disabled: false,
  });
  console.log(`Usuário Auth criado (uid: ${created.uid})`);
  return created.uid;
}

async function ensureFirestoreProfile(uid: string): Promise<void> {
  const config = loadFirebaseConfig();
  const db = config.firestoreDatabaseId
    ? admin.firestore(admin.app(), config.firestoreDatabaseId)
    : admin.firestore();

  const now = admin.firestore.FieldValue.serverTimestamp();

  await db.collection('tenants').doc(QA_TENANT_ID).set(
    {
      name: QA_TENANT_NAME,
      active: true,
      plan: 'qa',
      billingStatus: 'active',
      createdAt: now,
      updatedAt: now,
    },
    { merge: true },
  );

  await db.collection('users').doc(uid).set(
    {
      email: QA_EMAIL,
      role: 'admin',
      tenantId: QA_TENANT_ID,
      name: QA_DISPLAY_NAME,
      userName: QA_DISPLAY_NAME,
      username: 'qa_admin',
      firstName: 'QA',
      lastName1: 'Admin',
      active: true,
      isSuperAdmin: false,
      createdAt: new Date().toISOString(),
      updatedAt: now,
    },
    { merge: true },
  );

  await db.collection('platform_settings').doc(QA_TENANT_ID).set(
    {
      tenantId: QA_TENANT_ID,
      platformName: QA_TENANT_NAME,
      updatedAt: now,
    },
    { merge: true },
  );

  console.log(`Perfil Firestore provisionado em tenants/${QA_TENANT_ID} e users/${uid}`);
}

async function main(): Promise<void> {
  initAdminApp();
  const uid = await ensureAuthUser();
  await ensureFirestoreProfile(uid);

  console.log('\n--- Usuário de QA pronto ---');
  console.log(`Email:    ${QA_EMAIL}`);
  console.log(`Senha:    ${QA_PASSWORD}`);
  console.log(`Tenant:   ${QA_TENANT_ID}`);
  console.log(`Role:     admin`);
  console.log('Login:    http://localhost:5173/login');
}

main().catch((error) => {
  console.error('Falha ao criar usuário de QA:', error);
  process.exit(1);
});
