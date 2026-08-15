import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadFirebaseConfig(): { projectId: string; firestoreDatabaseId?: string } {
  const configPath = path.join(__dirname, '..', 'firebase-applet-config.json');
  const examplePath = path.join(__dirname, '..', 'firebase-applet-config.example.json');
  const resolved = fs.existsSync(configPath) ? configPath : examplePath;
  return JSON.parse(fs.readFileSync(resolved, 'utf-8'));
}

function initAdminApp(): void {
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '..', '..', 'firebase-service-account.json');
  if (!fs.existsSync(credentialsPath)) {
    console.error('Service account file not found!');
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

async function createFabioUser() {
  try {
    initAdminApp();
    const auth = admin.auth();
    const db = admin.firestore();
    
    const email = 'fabio@controlmax.com';
    const password = 'jabuticaba';
    
    let uid = '';
    try {
      const existing = await auth.getUserByEmail(email);
      uid = existing.uid;
      await auth.updateUser(uid, { password });
      console.log('User fabio already exists, password updated.');
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        const userRecord = await auth.createUser({
          email,
          password,
          displayName: 'Fabio Vendedor',
        });
        uid = userRecord.uid;
        console.log('User fabio created.');
      } else {
        throw e;
      }
    }
    
    await db.collection('users').doc(uid).set({
      tenantId: 'tenant_oficinabrasil',
      role: 'collector',
      firstName: 'Fabio',
      lastName1: 'Vendedor',
      email: email,
      active: true,
      createdAt: new Date().toISOString()
    }, { merge: true });
    
    console.log('Firestore user doc updated successfully.');
  } catch (error) {
    console.error('Error creating user:', error);
  }
}

createFabioUser();
