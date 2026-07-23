import { Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { buildOperationalContext } from './buildOperationalContext';
import {
  buildAssistantSystemInstruction,
  buildUserContentParts,
  isPortugueseLanguage,
} from './assistantPrompts';
import { generateAssistantAudio, generateAssistantText, noApiKeyResponse } from './geminiAssistant';
import { AuthenticatedRequest, checkRateLimit } from './authMiddleware';

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

      // Gemini key MUST only come from environment variables
      const resolvedApiKey = process.env.GEMINI_API_KEY;

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
      if (userContentParts.length === 0) {
        return res.status(400).json({ error: 'No input provided' });
      }

      const textResponse = await generateAssistantText(activeAi, userContentParts, systemInstruction, isPt);
      const { audio: base64Audio, mimeType: audioMimeType } = await generateAssistantAudio(activeAi, textResponse, isPt);

      res.json({ text: textResponse, audio: base64Audio, mimeType: audioMimeType });
    } catch (error: unknown) {
      console.error('Assistant API Error:', error);
      const message = error instanceof Error ? error.message : 'Internal server error';
      res.status(500).json({ error: message });
    }
  };
}
