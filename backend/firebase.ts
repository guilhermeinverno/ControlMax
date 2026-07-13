import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firebaseConfigJson: any = {};
const configPath = path.join(__dirname, "firebase-applet-config.json");
const exampleConfigPath = path.join(__dirname, "firebase-applet-config.example.json");

try {
  if (fs.existsSync(configPath)) {
    firebaseConfigJson = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } else if (fs.existsSync(exampleConfigPath)) {
    console.warn("backend/firebase.ts: firebase-applet-config.json not found, falling back to example configuration");
    firebaseConfigJson = JSON.parse(fs.readFileSync(exampleConfigPath, "utf-8"));
  } else {
    console.warn("backend/firebase.ts: No firebase configuration files found");
  }
} catch (error) {
  console.error("backend/firebase.ts: Failed to read Firebase config", error);
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey || "dummy-api-key",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain || "dummy-project.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId || "dummy-project",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket || "dummy-project.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId || "1234567890",
  appId: process.env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId || "1:123:web:123",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfigJson.firestoreDatabaseId);

