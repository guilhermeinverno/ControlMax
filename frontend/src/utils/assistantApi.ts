import { getOperationalContext } from './assistantOperationalContext';
import {
  assistantAbortErrorMessage,
  ASSISTANT_FETCH_TIMEOUT_MS,
  type AssistantLanguage,
} from './assistantStrings';
import { getErrorMessage } from './errorMessage';

export interface GeminiAssistantResult {
  text?: string;
  audio?: string;
  mimeType?: string;
}

export interface CallGeminiAssistantParams {
  text: string | null;
  base64Audio: string | null;
  language: AssistantLanguage;
  role?: string;
  userName?: string;
  tenantId?: string;
}

async function loadOperationalContext(tenantId?: string): Promise<string> {
  if (!tenantId) return '';

  try {
    return await getOperationalContext(tenantId);
  } catch (error) {
    console.error('Failed to get operational context:', error);
    return '';
  }
}

async function parseAssistantResponse(response: Response): Promise<GeminiAssistantResult & { error?: string }> {
  return response.json().catch(() => ({}));
}

export function resolveAssistantApiUrl(path = '/api/gemini/assistant'): string {
  const base = import.meta.env.VITE_API_URL?.trim() ?? '';
  const isAbsolute = base.startsWith('http://') || base.startsWith('https://');
  return isAbsolute ? `${base.replace(/\/$/, '')}${path}` : path;
}

export async function callGeminiAssistant(params: CallGeminiAssistantParams): Promise<GeminiAssistantResult> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), ASSISTANT_FETCH_TIMEOUT_MS);

  try {
    const clientOperationalContext = await loadOperationalContext(params.tenantId);
    const clientApiKey = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) || 
                         (typeof window !== 'undefined' ? window.localStorage.getItem('gemini_api_key') : null) || 
                         undefined;

    const response = await fetch(resolveAssistantApiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        message: params.text,
        audio: params.base64Audio,
        language: params.language,
        role: params.role,
        userName: params.userName,
        tenantId: params.tenantId,
        clientOperationalContext,
        clientApiKey,
      }),
    });

    const data = await parseAssistantResponse(response);

    if (!response.ok) {
      throw new Error(data.error || `Erro na API do assistente (${response.status})`);
    }

    return data;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function formatAssistantError(
  err: unknown,
  language: AssistantLanguage,
  fallbackError: string,
): string {
  if (err instanceof DOMException && err.name === 'AbortError') {
    return assistantAbortErrorMessage(language);
  }

  const message = getErrorMessage(err);
  return message || fallbackError;
}
