import { Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { buildOperationalContext } from './buildOperationalContext';
import {
  buildAssistantSystemInstruction,
  buildUserContentParts,
  isPortugueseLanguage,
} from './assistantPrompts';
import { generateAssistantAudio, generateAssistantText, noApiKeyResponse } from './geminiAssistant';
import { adminDb, AuthenticatedRequest, checkRateLimit } from './authMiddleware';

interface AssistantRequestBody {
  message?: string;
  audio?: string;
  language?: string;
  clientOperationalContext?: string;
}

async function resolveOperationalContext(
  tenantId: string | undefined,
  clientOperationalContext: string | undefined
): Promise<string> {
  if (clientOperationalContext) return clientOperationalContext;
  if (!tenantId) return '';

  try {
    return await buildOperationalContext(tenantId);
  } catch (err) {
    console.error('Error building operational context:', err);
    return '';
  }
}

async function resolveGeminiApiKey(tenantId?: string): Promise<string | undefined> {
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  try {
    if (tenantId) {
      const tenantDoc = await adminDb.collection("tenants").doc(tenantId).get();
      if (tenantDoc.exists) {
        const data = tenantDoc.data();
        if (data?.geminiApiKey || data?.gemini_api_key) {
          return data.geminiApiKey || data.gemini_api_key;
        }
      }
    }
    const systemDoc = await adminDb.collection("system").doc("config").get();
    if (systemDoc.exists) {
      const data = systemDoc.data();
      if (data?.geminiApiKey || data?.gemini_api_key) {
        return data.geminiApiKey || data.gemini_api_key;
      }
    }
  } catch (err) {
    console.error("Erro ao buscar GEMINI_API_KEY no Firestore:", err);
  }
  return undefined;
}

export function createAssistantHandler(initialAi?: GoogleGenAI, initialApiKey?: string) {
  return async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Não autenticado.' });
      }

      const uid = req.user.uid;
      const tenantId = req.user.tenantId;
      const role = req.user.role;
      const userName = req.user.name;

      // Rate limit check: 10 requests per minute
      if (!checkRateLimit(uid, 10, 60000)) {
        return res.status(429).json({ error: 'Muitas solicitações. Por favor, tente novamente em um minuto.' });
      }

      const body = req.body as AssistantRequestBody;
      const { message, audio, language, clientOperationalContext } = body;
      const isPt = isPortugueseLanguage(language, role);

      // Gemini key can come from process.env, tenant doc or system/config doc in Firestore
      const resolvedApiKey = await resolveGeminiApiKey(tenantId);

      if (!resolvedApiKey) {
        return res.json(noApiKeyResponse(isPt));
      }

      // Lazily instantiate GoogleGenAI with the active, resolved API key
      const activeAi = new GoogleGenAI({
        apiKey: resolvedApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const operationalContext = await resolveOperationalContext(tenantId, clientOperationalContext);
      const systemInstruction = buildAssistantSystemInstruction(isPt, userName, operationalContext);

      console.log(`[AI Assistant API] Received request from authenticated user=${userName}, role=${role}, tenantId=${tenantId}`);
      if (message) console.log(`[AI Assistant API] User message: "${message}"`);
      if (audio) console.log('[AI Assistant API] User sent audio input');
      console.log(`[AI Assistant API] System Instruction Context Length: ${operationalContext.length} chars`);

      const userContentParts = buildUserContentParts(message, audio);

      if (audio) {
        const result = await generateAssistantAudio(activeAi, systemInstruction, userContentParts);
        return res.json(result);
      }

      const result = await generateAssistantText(activeAi, systemInstruction, userContentParts);
      return res.json(result);
    } catch (err: any) {
      console.error('[AI Assistant API] Error processing request:', err);
      const isPt = isPortugueseLanguage(req.body?.language, req.user?.role);
      return res.status(500).json({
        error: isPt ? 'Erro ao processar sua solicitação.' : 'Error al procesar su solicitud.',
        details: err?.message || String(err),
      });
    }
  };
}
