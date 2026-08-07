import { Request, Response, NextFunction } from 'express';
import { getApps, initializeApp, cert, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFirebaseConfig() {
  const configPath = path.join(__dirname, 'firebase-applet-config.json');
  const examplePath = path.join(__dirname, 'firebase-applet-config.example.json');
  const resolved = fs.existsSync(configPath) ? configPath : examplePath;
  if (fs.existsSync(resolved)) {
    return JSON.parse(fs.readFileSync(resolved, 'utf-8'));
  }
  return {};
}

// Initialize Admin SDK once
if (getApps().length === 0) {
  const config = getFirebaseConfig();
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credentialsPath && fs.existsSync(credentialsPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
    initializeApp({
      credential: cert(serviceAccount),
      projectId: config.projectId || serviceAccount.project_id,
    });
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      initializeApp({
        credential: cert(serviceAccount),
        projectId: config.projectId || serviceAccount.project_id,
      });
    } catch (e) {
      initializeApp({
        projectId: config.projectId,
      });
    }
  } else {
    initializeApp({
      projectId: config.projectId,
    });
  }
}

const config = getFirebaseConfig();
const appInstance = getApps()[0] || getApp();
export const adminDb = config.firestoreDatabaseId 
  ? getFirestore(appInstance, config.firestoreDatabaseId)
  : getFirestore(appInstance);

const adminAuth = getAuth(appInstance);

// Rate limiting in-memory map
const rateLimitMap = new Map<string, number[]>();

export function checkRateLimit(uid: string, limit = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(uid) || [];
  
  // Filter out expired timestamps
  const activeTimestamps = timestamps.filter(ts => now - ts < windowMs);
  
  if (activeTimestamps.length >= limit) {
    return false;
  }
  
  activeTimestamps.push(now);
  rateLimitMap.set(uid, activeTimestamps);
  return true;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email: string;
    tenantId: string;
    role: string;
    name: string;
  };
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação ausente ou inválido.' });
  }

  const token = authHeader.substring(7);

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;
    const email = decodedToken.email || '';

    // Fetch user details from Firestore with Admin SDK (bypassing security rules)
    const userDoc = await adminDb.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(401).json({ error: 'Usuário não cadastrado no Firestore.' });
    }

    const userData = userDoc.data() || {};
    const tenantId = userData.tenantId || '';
    const role = userData.role || 'collector';
    const name = userData.name || userData.userName || userData.displayName || email;

    // Attach verified user data to request object
    req.user = {
      uid,
      email,
      tenantId,
      role,
      name
    };

    next();
  } catch (err: any) {
    console.error('Erro na autenticação do token:', err);
    return res.status(401).json({ error: 'Token de autenticação inválido ou expirado.' });
  }
}
