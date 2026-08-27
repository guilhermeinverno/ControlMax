import { Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { buildOperationalContextWithRag } from './buildOperationalContext';
import {
  buildAssistantSystemInstruction,
  buildUserContentParts,
  isPortugueseLanguage,
} from './assistantPrompts';
import { generateAssistantAudio, generateAssistantText, noApiKeyResponse } from './geminiAssistant';
import { adminDb, AuthenticatedRequest } from './authMiddleware';
import { DEFAULT_AUDIO_RAG_QUERY, type RagMetrics } from './services/assistantRag';

interface AssistantRequestBody {
  message?: string;
  audio?: string;
  language?: string;
  clientOperationalContext?: string;
}

async function resolveOperationalContext(
  tenantId: string | undefined,
  clientOperationalContext: string | undefined,
  userQuery: string
): Promise<{ text: string; metrics: RagMetrics | null }> {
  if (tenantId) {
    try {
      const result = await buildOperationalContextWithRag(tenantId, userQuery);
      return { text: result.text, metrics: result.metrics };
    } catch (err) {
      console.error('Error building operational context (RAG):', err);
    }
  }

  if (clientOperationalContext) {
    return {
      text: clientOperationalContext,
      metrics: {
        mode: 'full',
        totalChunks: 1,
        selectedChunks: 1,
        selectedIds: ['client'],
        charsFull: clientOperationalContext.length,
        charsSelected: clientOperationalContext.length,
        queryPreview: userQuery.slice(0, 80),
      },
    };
  }

  return { text: '', metrics: null };
}

async function resolveGeminiApiKey(tenantId?: string): Promise<string | undefined> {
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  try {
    if (tenantId) {
      const tenantDoc = await adminDb.collection('tenants').doc(tenantId).get();
      if (tenantDoc.exists) {
        const data = tenantDoc.data();
        if (data?.geminiApiKey || data?.gemini_api_key) {
          return data.geminiApiKey || data.gemini_api_key;
        }
      }
    }
    const systemDoc = await adminDb.collection('system').doc('config').get();
    if (systemDoc.exists) {
      const data = systemDoc.data();
      if (data?.geminiApiKey || data?.gemini_api_key) {
        return data.geminiApiKey || data.gemini_api_key;
      }
    }
  } catch (err) {
    console.error('Erro ao buscar GEMINI_API_KEY no Firestore:', err);
  }
  return undefined;
}

export function createAssistantHandler(_initialAi?: GoogleGenAI, _initialApiKey?: string) {
  return async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Não autenticado.' });
      }

      const tenantId = req.user.tenantId;
      const role = req.user.role;
      const userName = req.user.name;

      const body = req.body as AssistantRequestBody;
      const { message, audio, language, clientOperationalContext } = body;
      const isPt = isPortugueseLanguage(language, role);

      const resolvedApiKey = await resolveGeminiApiKey(tenantId);

      if (!resolvedApiKey) {
        return res.json(noApiKeyResponse(isPt));
      }

      const activeAi = new GoogleGenAI({
        apiKey: resolvedApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const ragQuery =
        (typeof message === 'string' && message.trim()) || (audio ? DEFAULT_AUDIO_RAG_QUERY : '');

      const { text: operationalContext, metrics: ragMetrics } = await resolveOperationalContext(
        tenantId,
        clientOperationalContext,
        ragQuery
      );
      const systemInstruction = buildAssistantSystemInstruction(isPt, userName, operationalContext);

      console.log(
        `[AI Assistant API] user=${userName} role=${role} tenant=${tenantId} rag=${ragMetrics?.mode || 'n/a'} chunks=${ragMetrics?.selectedChunks ?? 0}/${ragMetrics?.totalChunks ?? 0} chars=${ragMetrics?.charsSelected ?? operationalContext.length}/${ragMetrics?.charsFull ?? operationalContext.length}`
      );
      if (message) console.log(`[AI Assistant API] User message: "${message}"`);
      if (audio) console.log('[AI Assistant API] User sent audio input');

      const userContentParts = buildUserContentParts(message, audio);
      const includeRagDebug = process.env.ASSISTANT_RAG_DEBUG === 'true';

      if (audio) {
        const result = await generateAssistantAudio(activeAi, systemInstruction, userContentParts);
        return res.json(includeRagDebug && ragMetrics ? { ...result, rag: ragMetrics } : result);
      }

      const result = await generateAssistantText(activeAi, systemInstruction, userContentParts);
      return res.json(includeRagDebug && ragMetrics ? { ...result, rag: ragMetrics } : result);
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
