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

export function createAssistantHandler(ai: GoogleGenAI, apiKey?: string) {
  return async (req: Request, res: Response) => {
    try {
      const body = req.body as AssistantRequestBody;
      const { message, audio, language, role, userName, tenantId, clientOperationalContext } = body;
      const isPt = isPortugueseLanguage(language, role);
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

      if (!apiKey) {
        return res.json(noApiKeyResponse(isPt));
      }

      const textResponse = await generateAssistantText(ai, userContentParts, systemInstruction, isPt);
      const { audio: base64Audio, mimeType: audioMimeType } = await generateAssistantAudio(ai, textResponse, isPt);

      res.json({ text: textResponse, audio: base64Audio, mimeType: audioMimeType });
    } catch (error: unknown) {
      console.error('Assistant API Error:', error);
      const message = error instanceof Error ? error.message : 'Internal server error';
      res.status(500).json({ error: message });
    }
  };
}
