import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyCC7C-ZFYv9TeZsiYKUp6ghYHIoh7XjlAE",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "controlmax-ia.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "controlmax-ia",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "controlmax-ia.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "183509994412",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:183509994412:web:0e99e8a5eb4c3d271c8809"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  try {
    console.log('Creating auth user...');
    const cred = await createUserWithEmailAndPassword(auth, 'fabio@controlmax.com', 'jabuticaba');
    console.log('Auth user created. UID:', cred.user.uid);

    console.log('Writing to Firestore...');
    await setDoc(doc(db, 'users', cred.user.uid), {
      tenantId: 'tenant_oficinabrasil',
      role: 'collector',
      firstName: 'Fabio',
      lastName1: 'Vendedor',
      email: 'fabio@controlmax.com',
      active: true,
      username: 'fabio',
      createdAt: new Date().toISOString()
    });
    console.log('Firestore write success!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
