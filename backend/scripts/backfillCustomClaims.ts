/**
 * AUTH-01 — Backfill de Custom Claims para usuários legados.
 *
 * Lê docs em `users` e sincroniza claims (role, tenantId, isSuperAdmin) no Firebase Auth.
 * Uso:
 *   cd backend && npx tsx scripts/backfillCustomClaims.ts
 *   DRY_RUN=1 npx tsx scripts/backfillCustomClaims.ts   # só lista, não grava
 *   TENANT_ID=xxx npx tsx scripts/backfillCustomClaims.ts  # filtra tenant
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import { syncUserCustomClaims } from '../customClaims';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';
const TENANT_FILTER = process.env.TENANT_ID ? String(process.env.TENANT_ID).trim() : '';

function loadFirebaseConfig(): { projectId: string } {
  const configPath = path.join(__dirname, '..', 'firebase-applet-config.json');
  const examplePath = path.join(__dirname, '..', 'firebase-applet-config.example.json');
  const resolved = fs.existsSync(configPath) ? configPath : examplePath;
  return JSON.parse(fs.readFileSync(resolved, 'utf-8'));
}

function initAdminApp(): void {
  const credentialsPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    path.join(__dirname, '..', '..', 'firebase-service-account.json');
  if (!fs.existsSync(credentialsPath)) {
    console.error('Service account não encontrado:', credentialsPath);
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
  const config = loadFirebaseConfig();

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: config.projectId || serviceAccount.project_id,
    });
  }
}

async function main() {
  initAdminApp();
  const db = admin.firestore();

  const snap = TENANT_FILTER
    ? await db.collection('users').where('tenantId', '==', TENANT_FILTER).get()
    : await db.collection('users').get();
  console.log(
    `Usuários encontrados: ${snap.size}` +
      (TENANT_FILTER ? ` (tenant=${TENANT_FILTER})` : '') +
      (DRY_RUN ? ' [DRY_RUN]' : ''),
  );

  let ok = 0;
  let skipped = 0;
  let failed = 0;

  for (const docSnap of snap.docs) {
    const uid = docSnap.id;
    const data = docSnap.data() || {};
    const role = String(data.role || 'collector');
    const tenantId = String(data.tenantId || '');
    const isSuperAdmin = data.isSuperAdmin === true || role.toLowerCase() === 'superadmin';

    if (!tenantId && !isSuperAdmin) {
      console.warn(`SKIP ${uid}: sem tenantId`);
      skipped += 1;
      continue;
    }

    try {
      if (DRY_RUN) {
        console.log(`DRY ${uid} → role=${role} tenantId=${tenantId} isSuperAdmin=${isSuperAdmin}`);
      } else {
        await syncUserCustomClaims(uid, { role, tenantId, isSuperAdmin });
        console.log(`OK  ${uid} → role=${role} tenantId=${tenantId}`);
      }
      ok += 1;
    } catch (err) {
      failed += 1;
      console.error(`FAIL ${uid}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`\nResumo: ok=${ok} skipped=${skipped} failed=${failed}`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
