import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  memoryLocalCache,
  FirestoreLocalCache,
  Firestore
} from 'firebase/firestore';
import firebaseConfigJsonModule from '../../firebase-applet-config.json';

const firebaseConfigJson = firebaseConfigJsonModule;

// Safely retrieve environment variables to prevent TypeError on import.meta or import.meta.env being undefined
const env: Record<string, string | undefined> = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

// Use environment variables if present, otherwise fallback to the auto-generated config
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || firebaseConfigJson?.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson?.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson?.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson?.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson?.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || firebaseConfigJson?.appId,
};

let app: FirebaseApp;
let authInstance: Auth;
let firestoreDb: Firestore;

try {
  if (!firebaseConfig.apiKey) {
    console.warn("Firebase API key is missing. Using dummy config to prevent crash.");
    firebaseConfig.apiKey = "dummy-api-key";
    firebaseConfig.projectId = "dummy-project";
    firebaseConfig.appId = "1:123:web:123";
  }
  
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  
  authInstance = getAuth(app);
  
  let localCacheSetting: FirestoreLocalCache | undefined;
  if (typeof window !== 'undefined') {
    let isIframe = false;
    try {
      isIframe = window.self !== window.top;
    } catch (e) {
      isIframe = true;
    }
    const hasIndexedDB = !!window.indexedDB;
    
    if (isIframe || !hasIndexedDB) {
      localCacheSetting = memoryLocalCache();
      console.log("Firestore: Running inside iframe or indexedDB unavailable. Defaulting to memoryLocalCache.");
    } else {
      try {
        localCacheSetting = persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        });
        console.log("Firestore: Enabled multi-tab persistent local cache.");
      } catch (e) {
        console.warn("Firestore: Failed to define persistent local cache, defaulting to memoryLocalCache.", e);
        localCacheSetting = memoryLocalCache();
      }
    }
  } else {
    localCacheSetting = memoryLocalCache();
  }

  try {
    const settings: { experimentalForceLongPolling?: boolean; localCache?: FirestoreLocalCache } = {
      experimentalForceLongPolling: true,
    };
    if (localCacheSetting) {
      settings.localCache = localCacheSetting;
    }
    
    firestoreDb = initializeFirestore(app, settings, firebaseConfigJson?.firestoreDatabaseId);
    console.log("Firestore initialized successfully via initializeFirestore with database ID:", firebaseConfigJson?.firestoreDatabaseId);
  } catch (error) {
    console.error("Critical: initializeFirestore failed, falling back to getFirestore:", error);
    try {
      firestoreDb = getFirestore(app, firebaseConfigJson?.firestoreDatabaseId);
      console.log("Firestore fell back to getFirestore with database ID:", firebaseConfigJson?.firestoreDatabaseId);
    } catch (fallbackError) {
      console.error("Critical: getFirestore fallback failed too, trying default:", fallbackError);
      try {
        firestoreDb = getFirestore(app);
        console.log("Firestore fell back to default database.");
      } catch (defaultError) {
        console.error("Critical: default getFirestore failed:", defaultError);
      }
    }
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

// Make absolutely sure we do not export an empty object `{}` as `db` or `auth`!
// If they failed to initialize, getFirestore(app) or getAuth() fallback as a last resort
if (!authInstance!) {
  try {
    authInstance = getAuth();
  } catch (e) {
    authInstance = {} as unknown as Auth;
  }
}

if (!firestoreDb!) {
  try {
    firestoreDb = getFirestore();
  } catch (e) {
    firestoreDb = {} as unknown as Firestore;
  }
}

export const auth = authInstance!;
export const db = firestoreDb!;
