import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { buildOperationalContext } from './buildOperationalContext';
import {
  buildAssistantSystemInstruction,
  buildUserContentParts,
  isPortugueseLanguage,
} from './assistantPrompts';
import { generateAssistantAudio, generateAssistantText, noApiKeyResponse } from './geminiAssistant';

interface AssistantRequestBody {
  message?: string;
  audio?: string;
  language?: string;
  role?: string;
  userName?: string;
  tenantId?: string;
  clientOperationalContext?: string;
  clientApiKey?: string;
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
  return async (req: Request, res: Response) => {
    try {
      const body = req.body as AssistantRequestBody;
      const { message, audio, language, role, userName, tenantId, clientOperationalContext, clientApiKey } = body;
      const isPt = isPortugueseLanguage(language, role);

      // Dynamically resolve apiKey (try client-passed first, then headers, then process.env, then fallback to initialApiKey)
      const resolvedApiKey = clientApiKey || 
                            req.headers['x-gemini-api-key'] as string || 
                            process.env.GEMINI_API_KEY || 
                            initialApiKey;

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

      console.log(`[AI Assistant API] Received request from user=${userName}, role=${role}, tenantId=${tenantId}`);
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
