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

// Configuração estrita de CORS baseada na variável FRONTEND_ORIGIN
const allowedOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));

console.log(`[CORS] Permitindo acesso exclusivamente à origem: ${allowedOrigin}`);

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
import roleRoutes from "./roleRoutes";
import customerRoutes from "./customerRoutes";
import platformRoutes from "./platformRoutes";
import reportRoutes from "./reportRoutes";
import saasBillingRoutes from "./saasBillingRoutes";

app.post("/api/gemini/assistant", authMiddleware, createAssistantHandler(ai, apiKey));
app.use("/api/boxes", authMiddleware, boxRoutes);
app.use("/api/transactions", authMiddleware, transactionRoutes);
app.use("/api/customers", authMiddleware, customerRoutes);
app.use("/api/platform", authMiddleware, platformRoutes);
app.use("/api/reports", authMiddleware, reportRoutes);
app.use("/api/admin", authMiddleware, saasBillingRoutes);
app.use("/api/admin/roles", authMiddleware, roleRoutes);
app.use("/api/admin", authMiddleware, adminRoutes);

if (process.env.LOCAL_DEV === 'true') {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server local rodando na porta ${PORT}`);
  });
}

import { onRequest } from 'firebase-functions/v2/https';

// Exportando a aplicação como uma Firebase Cloud Function (Gen 2 com acesso público)
export const api = onRequest({ invoker: 'public', region: 'us-central1' }, app);
