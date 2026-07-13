import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, onAuthStateChanged as fbOnAuthStateChanged, User } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  memoryLocalCache,
  FirestoreLocalCache,
  Firestore,
  disableNetwork,
  enableNetwork
} from 'firebase/firestore';
import firebaseConfigJsonModule from '@firebase-config';

const firebaseConfigJson = firebaseConfigJsonModule as {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  firestoreDatabaseId?: string;
};

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

  const firestoreDatabaseId = env.VITE_FIRESTORE_DATABASE_ID || firebaseConfigJson?.firestoreDatabaseId;

  try {
    const settings: { experimentalForceLongPolling?: boolean; localCache?: FirestoreLocalCache } = {
      experimentalForceLongPolling: true,
    };
    if (localCacheSetting) {
      settings.localCache = localCacheSetting;
    }
    
    firestoreDb = initializeFirestore(app, settings, firestoreDatabaseId);
    console.log("Firestore initialized successfully via initializeFirestore with database ID:", firestoreDatabaseId);
  } catch (error) {
    console.error("Critical: initializeFirestore failed, falling back to getFirestore:", error);
    try {
      firestoreDb = getFirestore(app, firestoreDatabaseId);
      console.log("Firestore fell back to getFirestore with database ID:", firestoreDatabaseId);
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
if (!authInstance) {
  try {
    authInstance = getAuth();
  } catch (e) {
    authInstance = {} as unknown as Auth;
  }
}

if (!firestoreDb) {
  try {
    firestoreDb = getFirestore();
  } catch (e) {
    firestoreDb = {} as unknown as Firestore;
  }
}

// Manage custom auth listeners for simulated/bypass login
const authListeners = new Set<(user: User | null) => void>();

export const getDemoUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const isDemo = localStorage.getItem('controlmax_demo_active') === 'true';
  if (isDemo) {
    const email = localStorage.getItem('controlmax_demo_email') || 'demo@controlmax.dev';
    const uid = email === 'controlmaxia@gmail.com' ? 'super_admin_demo_uid' : 'demo_admin_uid';
    const displayName = email === 'controlmaxia@gmail.com' ? 'Super Admin Demo' : 'Admin Demo';
    const baseUser: any = {
      uid,
      email,
      displayName,
      emailVerified: true,
      isAnonymous: false,
      providerData: [],
      phoneNumber: null,
      photoURL: null,
      metadata: {
        creationTime: new Date().toISOString(),
        lastSignInTime: new Date().toISOString(),
      },
      tenantId: 'tenant_demo',
      providerId: 'firebase',
      
      // Public methods
      getIdToken: async () => 'demo-token',
      getIdTokenResult: async () => ({
        token: 'demo-token',
        expirationTime: '2099-01-01T00:00:00.000Z',
        authTime: new Date().toISOString(),
        issuedAtTime: new Date().toISOString(),
        signInProvider: 'password',
        claims: {},
      }),
      reload: async () => {},
      delete: async () => {},
      toJSON: () => ({ uid: 'demo_admin_uid' }),

      // Common SDK internals to prevent crashes in Firebase/Firestore token refresh
      _startProactiveRefresh: () => {},
      _stopProactiveRefresh: () => {},
      auth: authInstance,
      stsTokenManager: {
        accessToken: 'demo-token',
        refreshToken: 'demo-token',
        expirationTime: Date.now() + 3600 * 1000,
      },
    };

    // Safe proxy to intercept any other internal SDK/library lookups gracefully
    return new Proxy(baseUser, {
      get(target, prop, receiver) {
        if (prop in target) {
          return Reflect.get(target, prop, receiver);
        }
        
        // Return dummy functions/values for missing properties to prevent SDK internal crashes
        if (typeof prop === 'string') {
          if (prop.startsWith('_')) {
            return () => {};
          }
          if (prop === 'stsTokenManager') {
            return {
              accessToken: 'demo-token',
              refreshToken: 'demo-token',
              expirationTime: Date.now() + 3600 * 1000,
            };
          }
          if (prop === 'proactiveRefresh' || prop === 'tokenManager') {
            return {
              user: target,
              _startProactiveRefresh: () => {},
              _stopProactiveRefresh: () => {},
            };
          }
        }
        return undefined;
      }
    }) as unknown as User;
  }
  return null;
};

// Safe mock user state managed at the module level
let localUser: User | null = null;

export const startDemoMode = async () => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('controlmax_demo_active', 'true');
  try {
    if (firestoreDb && typeof firestoreDb.app === 'object' && typeof disableNetwork === 'function') {
      await disableNetwork(firestoreDb);
      console.log("Firestore network disabled for local demo mode.");
    }
  } catch (e) {
    console.warn("Could not disable network for demo mode:", e);
  }
};

export const stopDemoMode = async () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('controlmax_demo_active');
  localStorage.removeItem('controlmax_demo_email');
  try {
    if (firestoreDb && typeof firestoreDb.app === 'object' && typeof enableNetwork === 'function') {
      await enableNetwork(firestoreDb);
      console.log("Firestore network enabled after demo mode exit.");
    }
  } catch (e) {
    console.warn("Could not enable network after demo mode:", e);
  }
};

// Auto-initialize offline mode if page is loaded/refreshed during active demo mode
if (typeof window !== 'undefined' && localStorage.getItem('controlmax_demo_active') === 'true') {
  if (firestoreDb && typeof firestoreDb.app === 'object' && typeof disableNetwork === 'function') {
    disableNetwork(firestoreDb).catch((err) => {
      console.warn("Error disabling network during startup:", err);
    });
  }
}

export function triggerAuthListeners(user: User | null) {
  localUser = user; // Update local state so proxied auth.currentUser returns it
  authListeners.forEach((cb) => {
    try {
      cb(user);
    } catch (e) {
      console.error("Error in custom auth listener:", e);
    }
  });
}

export function onAuthStateChanged(
  authObj: Auth,
  callback: (user: User | null) => void
) {
  authListeners.add(callback);
  
  // Call immediately with current active user state
  const currentUser = authObj.currentUser;
  callback(currentUser);

  // Subscribe to real Firebase auth changes on the clean unproxied authInstance
  const unsubFb = fbOnAuthStateChanged(authInstance, (user) => {
    if (typeof window !== 'undefined' && localStorage.getItem('controlmax_demo_active') !== 'true') {
      callback(user);
    }
  });

  return () => {
    authListeners.delete(callback);
    unsubFb();
  };
}

// Proxy wrapper around authInstance for application-level access
const authWrapper = new Proxy(authInstance, {
  get(target, prop, receiver) {
    if (prop === 'currentUser') {
      const demoUser = getDemoUser();
      if (demoUser) return demoUser;
      if (localUser) return localUser;
    }
    if (prop === 'signOut') {
      return async () => {
        await stopDemoMode();
        triggerAuthListeners(null);
        if (target.signOut) {
          try {
            await target.signOut();
          } catch (e) {
            console.warn("SignOut original function failed, clearing local state only:", e);
          }
        }
      };
    }
    const val = Reflect.get(target, prop, receiver);
    if (typeof val === 'function') {
      return val.bind(target);
    }
    return val;
  }
});

export const auth = authWrapper;
export const db = firestoreDb;

