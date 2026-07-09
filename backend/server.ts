import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { db } from "./firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Initialize Gemini SDK
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API routes go first
app.post("/api/gemini/assistant", async (req, res) => {
  try {
    const { message, audio, language, role, userName, tenantId, clientOperationalContext } = req.body;
    
    const isPt = language === "pt" || language === "pt-BR" || role === "superadmin";
    
    let operationalContext = clientOperationalContext || "";
    if (!operationalContext && tenantId) {
      try {
        // 1. Fetch active collectors
        const qUsers = query(
          collection(db, "users"),
          where("tenantId", "==", tenantId),
          where("role", "==", "collector"),
          where("active", "==", true)
        );
        const usersSnap = await getDocs(qUsers);
        const collectors = usersSnap.docs.map((doc: any) => ({
          id: doc.id,
          name: doc.data().name || doc.data().username || "Coletor",
          ...doc.data()
        }));

        // 2. Fetch open boxes for today
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const qBoxes = query(
          collection(db, "boxes"),
          where("tenantId", "==", tenantId),
          where("status", "==", "open")
        );
        const boxesSnap = await getDocs(qBoxes);
        const openBoxes = boxesSnap.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        })).filter((box: any) => {
          if (!box.openedAt) return false;
          const date = typeof box.openedAt.toDate === "function" 
            ? box.openedAt.toDate() 
            : new Date(box.openedAt.seconds * 1000);
          return date >= startOfToday;
        });

        // 3. Fetch active routes
        const qRoutes = query(
          collection(db, "routes"),
          where("tenantId", "==", tenantId)
        );
        const routesSnap = await getDocs(qRoutes);
        const routes = routesSnap.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        })).filter((r: any) => r.active !== false);

        // 4. Fetch collections for today
        const qCollections = query(
          collection(db, "collections"),
          where("tenantId", "==", tenantId)
        );
        const collectionsSnap = await getDocs(qCollections);
        const collectionsToday = collectionsSnap.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        })).filter((col: any) => {
          if (!col.createdAt) return false;
          const date = typeof col.createdAt.toDate === "function" 
            ? col.createdAt.toDate() 
            : new Date(col.createdAt.seconds * 1000);
          return date >= startOfToday;
        });

        const totalCollectedTodayCents = collectionsToday.reduce((sum: number, col: any) => sum + (col.amount || 0), 0);
        const totalCollectedToday = totalCollectedTodayCents / 100;

        // 5. Fetch sales for today
        const qSales = query(
          collection(db, "sales"),
          where("tenantId", "==", tenantId)
        );
        const salesSnap = await getDocs(qSales);
        const salesToday = salesSnap.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        })).filter((sale: any) => {
          if (!sale.createdAt) return false;
          const date = typeof sale.createdAt.toDate === "function" 
            ? sale.createdAt.toDate() 
            : new Date(sale.createdAt.seconds * 1000);
          return date >= startOfToday;
        });

        const totalSalesTodayCents = salesToday.reduce((sum: number, s: any) => sum + (s.totalAmount || s.amount || 0), 0);
        const totalSalesToday = totalSalesTodayCents / 100;

        const collectorIdsWithOpenBox = new Set(openBoxes.map((b: any) => b.userId));
        const notOnRouteCollectors = collectors.filter((c: any) => !collectorIdsWithOpenBox.has(c.id));
        const onRouteCollectors = collectors.filter((c: any) => collectorIdsWithOpenBox.has(c.id));

        operationalContext = `
--- CONTEXTO EM TEMPO REAL DO SISTEMA ---
Data/Hora Atual do Servidor: ${new Date().toLocaleString("pt-BR")}
Cobradores Ativos Cadastrados (Total ${collectors.length}): ${collectors.map((c: any) => c.name).join(", ") || "Nenhum"}
Cobradores em Rota Hoje (Caixa Aberto Hoje) (Total ${onRouteCollectors.length}): ${onRouteCollectors.map((c: any) => c.name).join(", ") || "Nenhum"}
Cobradores que ainda NÃO saíram para a rota hoje (Sem caixa aberto hoje) (Total ${notOnRouteCollectors.length}): ${notOnRouteCollectors.map((c: any) => c.name).join(", ") || "Nenhum"}
Rotas Ativas Cadastradas: ${routes.map((r: any) => `${r.name} (Atribuída a: ${r.assignedUserName || "Ninguém"})`).join("; ") || "Nenhuma"}
Faturamento Hoje (Vendas): R$ ${totalSalesToday.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
Total Cobrado Hoje (Recebimentos): R$ ${totalCollectedToday.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
----------------------------------------
Utilize estritamente estas informações reais em tempo real para responder de forma precisa a perguntas sobre quem saiu ou não para a rota, faturamento do dia, recebimentos ou rotas cadastradas. Seja extremamente preciso e nunca invente nomes ou valores.`;
      } catch (err) {
        console.error("Error building operational context:", err);
      }
    }
    
    const systemInstruction = isPt 
      ? `Você é o Assistente de Voz IA Oficial do ControlMax, o painel SaaS de controle financeiro, de rotas, cobradores e vendas.
Seu interlocutor é o proprietário (Super Admin: ${userName || "SaaS Owner"}). Seu tom deve ser prestativo, profissional e sofisticado.
Fale SEMPRE em português brasileiro (PT-BR). Dê respostas breves (máximo de 3 frases). Evite usar caracteres especiais, listas longas, marcadores ou tabelas, pois sua resposta será sintetizada por voz e precisa soar fluida e natural.

${operationalContext}

DIRETRIZES DE RESPOSTA CRÍTICAS:
1. Use as informações reais do "CONTEXTO EM TEMPO REAL DO SISTEMA" acima para responder de forma precisa a perguntas sobre quem saiu ou não para a rota, faturamento do dia, recebimentos ou rotas cadastradas.
2. Se o usuário perguntar quem NÃO saiu para a rota hoje, consulte o campo "Cobradores que ainda NÃO saíram para a rota hoje" no contexto acima e fale os nomes desses cobradores diretamente.
3. Se o campo disser "Nenhum" ou se a lista de cobradores pendentes estiver vazia, informe que todos os cobradores ativos já saíram para a rota hoje.
4. NUNCA invente nomes, dados, rotas ou valores que não estejam listados acima. Seja extremamente preciso e objetivo.`
      : `Eres el Asistente de Voz IA Oficial de ControlMax, el panel administrativo para la gestión de ventas, cobradores, cajas y rutas.
Tu interlocutor es el Cliente Administrador (${userName || "Administrador"}). Tu tono debe ser proactivo, claro, cálido y formal.
Responde SIEMPRE en español (ES). Tus respuestas deben ser cortas y concisas (máximo de 3 oraciones). Evita viñetas, tablas o caracteres especiales, ya que tu resposta se convertirá en voz y debe sonar natural, amable y fluida.

${operationalContext}

PAUTAS CRÍTICAS DE RESPUESTA:
1. Usa la información real de "CONTEXTO EM TEMPO REAL DO SISTEMA" anterior para responder con precisión sobre quién salió o no a la ruta, facturación del día, cobros o rutas registradas.
2. Si el usuario pregunta quién NO ha salido a la ruta hoy, consulta el campo "Cobradores que aún NO han salido a la ruta hoy" y di sus nombres directamente. Si dice "Ninguno", indica que todos los cobradores activos ya salieron a la ruta hoy.
3. NUNCA inventes nombres, datos o valores que no estén listados anteriormente. Sé sumamente preciso y directo.`;

    console.log(`[AI Assistant API] Received request from user=${userName}, role=${role}, tenantId=${tenantId}`);
    if (message) console.log(`[AI Assistant API] User message: "${message}"`);
    if (audio) console.log(`[AI Assistant API] User sent audio input`);
    console.log(`[AI Assistant API] System Instruction Context Length: ${operationalContext.length} chars`);

    let userContentParts: any[] = [];
    
    if (audio) {
      userContentParts.push({
        inlineData: {
          mimeType: "audio/webm",
          data: audio
        }
      });
    }
    
    if (message) {
      userContentParts.push({
        text: message
      });
    }
    
    if (userContentParts.length === 0) {
      return res.status(400).json({ error: "No input provided" });
    }

    if (!apiKey) {
      return res.json({
        text: isPt 
          ? "Olá! Para que eu possa te ajudar com comandos de voz, por favor configure a chave de API do Gemini nas configurações do painel." 
          : "¡Hola! Para que pueda ayudarte con comandos de voz, por favor configura la clave de API de Gemini en la sección de configuraciones del panel.",
        audio: null
      });
    }

    // Call Gemini with gemini-2.5-flash for ultra-fast response times, high availability and high rate limits
    let geminiResponse;
    try {
      geminiResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userContentParts,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });
    } catch (primaryErr: any) {
      console.warn("Primary model gemini-2.5-flash failed or busy. Falling back to gemini-3.1-flash-lite. Error:", primaryErr?.message || primaryErr);
      geminiResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: userContentParts,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });
    }

    const textResponse = geminiResponse.text || (isPt ? "Não consegui processar a informação." : "No logré procesar la información.");

    // Now convert the response text into a beautiful natural voice response!
    let base64Audio = null;
    let audioMimeType = null;
    try {
      const ttsResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: textResponse }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: isPt ? "Fenrir" : "Zephyr" } // High-quality non-robotic prebuilt voices
            }
          }
        }
      });
      
      const inlineData = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      base64Audio = inlineData?.data || null;
      audioMimeType = inlineData?.mimeType || "audio/mp3";
      console.log("TTS audio successfully generated. MimeType:", audioMimeType);
    } catch (ttsErr: any) {
      const errMessage = ttsErr?.message || String(ttsErr);
      if (errMessage.includes("429") || errMessage.includes("quota") || errMessage.includes("RESOURCE_EXHAUSTED")) {
        console.warn("TTS model quota limits reached (10 requests/day on the free tier). Falling back smoothly to browser speech synthesis.");
      } else {
        console.warn("TTS model generation unavailable. Falling back smoothly to browser speech synthesis. Details:", errMessage);
      }
    }

    res.json({
      text: textResponse,
      audio: base64Audio,
      mimeType: audioMimeType
    });

  } catch (error: any) {
    console.error("Assistant API Error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Vite Middleware & Static files setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: path.join(__dirname, "../frontend"),
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, '../frontend/dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
