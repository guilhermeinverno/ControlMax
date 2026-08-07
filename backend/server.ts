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

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

import adminRoutes from "./adminRoutes";

app.post("/api/gemini/assistant", authMiddleware, createAssistantHandler(ai, apiKey));
app.use("/api/boxes", authMiddleware, boxRoutes);
app.use("/api/transactions", authMiddleware, transactionRoutes);
app.use("/api/admin", authMiddleware, adminRoutes);

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: path.join(__dirname, "../frontend"),
    });
    app.use(vite.middlewares);
  } else {
    const isCompiled = __dirname.endsWith("dist");
    const distPath = isCompiled
      ? path.resolve(__dirname, "../../frontend/dist")
      : path.resolve(__dirname, "../frontend/dist");
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (process.env.NODE_ENV !== "production" && !process.env.FUNCTIONS_EMULATOR) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
}

if (process.env.LOCAL_DEV === 'true') {
  startServer();
}

import { onRequest } from 'firebase-functions/v2/https';

// Exportando a aplicação como uma Firebase Cloud Function (Gen 2 com acesso público)
export const api = onRequest({ invoker: 'public', region: 'us-central1' }, app);
