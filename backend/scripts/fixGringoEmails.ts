import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import fs from 'fs';
import path from 'path';

function loadFirebaseConfig() {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

const config = loadFirebaseConfig();
if (getApps().length === 0) {
  initializeApp({ projectId: config.projectId });
}

const auth = getAuth();
const db = getFirestore();

async function fixEmails() {
  console.log('Iniciando corre\u00E7\u00E3o de e-mails de controlmark.com para controlmax.com...');
  
  for (let i = 1; i <= 12; i++) {
    const oldEmail = `vendedor${i}@controlmark.com`;
    const newEmail = `vendedor${i}@controlmax.com`;
    
    try {
      const userRecord = await auth.getUserByEmail(oldEmail);
      
      // Update in Auth
      await auth.updateUser(userRecord.uid, { email: newEmail });
      console.log(`Auth atualizado: ${oldEmail} -> ${newEmail}`);
      
      // Update in Firestore
      await db.collection('users').doc(userRecord.uid).update({
        email: newEmail
      });
      console.log(`Firestore atualizado: ${newEmail}`);
      
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        console.log(`Usu\u00E1rio n\u00E3o encontrado: ${oldEmail} (Pode j\u00E1 ter sido corrigido)`);
      } else {
        console.error(`Erro ao processar ${oldEmail}:`, err);
      }
    }
  }
  console.log('Conclu\u00EDdo!');
}

fixEmails().catch(console.error).finally(() => process.exit(0));
