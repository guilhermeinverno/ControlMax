import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { buildOperationalContext } from "./buildOperationalContext";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = 3000; // Porta local de desenvolvimento — não expõe stack em produção sem proxy reverso

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
        operationalContext = await buildOperationalContext(tenantId);
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
