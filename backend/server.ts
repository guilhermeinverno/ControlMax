import express from "express";
import path from "path";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { createAssistantHandler } from "./assistantRoute";
import boxRoutes from "./boxRoutes";
import transactionRoutes from "./transactionRoutes";
import { authMiddleware } from "./authMiddleware";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = 3000; // Porta local de desenvolvimento — não expõe stack em produção sem proxy reverso

// Origens permitidas: env var + domínios padrão do Firebase Hosting
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  "https://controlmax-ia.web.app",
  "https://controlmax-ia.firebaseapp.com",
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permite requisições sem origin (ex.: mobile apps, curl, Cloud Functions internas)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origem não permitida — ${origin}`));
    }
  },
  credentials: true,
}));

console.log(`[CORS] Origens permitidas: ${allowedOrigins.join(", ")}`);

app.use(express.json({ limit: "50mb" }));

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = apiKey ? new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
}) : undefined;

import adminRoutes from "./adminRoutes";

app.post("/api/gemini/assistant", authMiddleware, createAssistantHandler(ai, apiKey));
app.use("/api/boxes", authMiddleware, boxRoutes);
app.use("/api/transactions", authMiddleware, transactionRoutes);
app.use("/api/admin", authMiddleware, adminRoutes);

// Removido app.listen para evitar timeout no deploy do Firebase.
// O Cloud Functions gerencia o servidor.

import { onRequest } from 'firebase-functions/v2/https';

// Exportando a aplicação como uma Firebase Cloud Function (Gen 2 com acesso público)
// O secret GEMINI_API_KEY é injetado automaticamente pelo Firebase Secrets Manager
export const api = onRequest({
  invoker: 'public',
  region: 'us-central1',
  secrets: ['GEMINI_API_KEY'],
  memory: '512MiB',
  timeoutSeconds: 60,
}, app);
