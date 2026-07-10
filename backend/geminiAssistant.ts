import { GoogleGenAI } from '@google/genai';
import {
  buildUserContentParts,
  fallbackTextResponse,
  missingApiKeyMessage,
} from './assistantPrompts';

type ContentPart = ReturnType<typeof buildUserContentParts>[number];

export async function generateAssistantText(
  ai: GoogleGenAI,
  userContentParts: ContentPart[],
  systemInstruction: string,
  isPt: boolean
): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userContentParts,
      config: { systemInstruction, temperature: 0.7 },
    });
    return response.text || fallbackTextResponse(isPt);
  } catch (primaryErr: unknown) {
    const message = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
    console.warn(
      'Primary model gemini-2.5-flash failed or busy. Falling back to gemini-3.1-flash-lite. Error:',
      message
    );
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: userContentParts,
      config: { systemInstruction, temperature: 0.7 },
    });
    return response.text || fallbackTextResponse(isPt);
  }
}

export async function generateAssistantAudio(
  ai: GoogleGenAI,
  textResponse: string,
  isPt: boolean
): Promise<{ audio: string | null; mimeType: string | null }> {
  try {
    const ttsResponse = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: textResponse }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: isPt ? 'Fenrir' : 'Zephyr' },
          },
        },
      },
    });

    const inlineData = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    const audio = inlineData?.data || null;
    const mimeType = inlineData?.mimeType || 'audio/mp3';
    console.log('TTS audio successfully generated. MimeType:', mimeType);
    return { audio, mimeType };
  } catch (ttsErr: unknown) {
    const errMessage = ttsErr instanceof Error ? ttsErr.message : String(ttsErr);
    if (errMessage.includes('429') || errMessage.includes('quota') || errMessage.includes('RESOURCE_EXHAUSTED')) {
      console.warn('TTS model quota limits reached (10 requests/day on the free tier). Falling back smoothly to browser speech synthesis.');
    } else {
      console.warn('TTS model generation unavailable. Falling back smoothly to browser speech synthesis. Details:', errMessage);
    }
    return { audio: null, mimeType: null };
  }
}

export function noApiKeyResponse(isPt: boolean) {
  return { text: missingApiKeyMessage(isPt), audio: null };
}
