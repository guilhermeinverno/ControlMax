import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { callGeminiAssistant, formatAssistantError, type GeminiAssistantResult } from '../utils/assistantApi';
import type { AssistantAudioPlayer } from '../utils/assistantAudio';
import { startVoiceRecording, type VoiceRecorderSession } from '../utils/assistantRecording';
import type { AssistantLanguage } from '../utils/assistantStrings';

interface AssistantMessagingOptions {
  language: AssistantLanguage;
  tenantId?: string;
  userName?: string;
  role?: string;
  strings: {
    thinking: string;
    recording: string;
    noMic: string;
    error: string;
  };
  audioPlayer: AssistantAudioPlayer;
  isOpen: boolean;
  setIsOpen: (value: boolean | ((open: boolean) => boolean)) => void;
  isRecording: boolean;
  setIsRecording: (value: boolean) => void;
  setIsThinking: (value: boolean) => void;
  inputText: string;
  setInputText: (value: string) => void;
  setTranscript: Dispatch<SetStateAction<string[]>>;
  setStatusText: (value: string) => void;
}

function appendBotReply(
  data: GeminiAssistantResult,
  fallbackText: string | null,
  audioPlayer: AssistantAudioPlayer,
  language: AssistantLanguage,
  setTranscript: Dispatch<SetStateAction<string[]>>,
  setIsThinking: (value: boolean) => void,
  setStatusText: (value: string) => void,
): void {
  setIsThinking(false);
  setStatusText('');
  if (data.text) setTranscript((prev) => [...prev, `🤖 ${data.text}`]);

  if (data.audio) {
    audioPlayer.playBase64(data.audio, data.mimeType, data.text || fallbackText || '');
    return;
  }

  if (data.text) {
    audioPlayer.speakWithSynthesis(data.text, language);
  }
}

function appendAssistantError(
  userFacing: string,
  setStatusText: (value: string) => void,
  setTranscript: Dispatch<SetStateAction<string[]>>,
  setIsThinking: (value: boolean) => void,
): void {
  setStatusText(userFacing);
  setTranscript((prev) => [...prev, `⚠️ ${userFacing}`]);
  setIsThinking(false);
  setTimeout(() => setStatusText(''), 8000);
}

export function useAssistantMessaging({
  language,
  tenantId,
  userName,
  role,
  strings,
  audioPlayer,
  isOpen,
  setIsOpen,
  setIsRecording,
  setIsThinking,
  inputText,
  setInputText,
  setTranscript,
  setStatusText,
}: AssistantMessagingOptions) {
  const recorderSessionRef = useRef<VoiceRecorderSession | null>(null);

  const deliverToAssistant = useCallback(
    async (text: string | null, base64Audio: string | null) => {
      try {
        const data = await callGeminiAssistant({
          text,
          base64Audio,
          language,
          role,
          userName,
          tenantId,
        });
        appendBotReply(data, text, audioPlayer, language, setTranscript, setIsThinking, setStatusText);
      } catch (err) {
        console.error('Error communicating with Gemini assistant:', err);
        appendAssistantError(
          formatAssistantError(err, language, strings.error),
          setStatusText,
          setTranscript,
          setIsThinking,
        );
      }
    },
    [audioPlayer, language, role, setIsThinking, setStatusText, setTranscript, strings.error, tenantId, userName],
  );

  const startRecording = useCallback(async () => {
    try {
      audioPlayer.stopAll();
      recorderSessionRef.current = await startVoiceRecording(async (base64Audio) => {
        setIsRecording(false);
        setIsThinking(true);
        setStatusText(strings.thinking);
        await deliverToAssistant(null, base64Audio);
      });
      setIsRecording(true);
      setStatusText(strings.recording);
    } catch (err) {
      console.error('Microphone access error:', err);
      setStatusText(strings.noMic);
      setTimeout(() => setStatusText(''), 3000);
    }
  }, [audioPlayer, deliverToAssistant, setIsRecording, setIsThinking, setStatusText, strings.noMic, strings.recording, strings.thinking]);

  const stopRecording = useCallback(() => {
    recorderSessionRef.current?.stop();
    recorderSessionRef.current = null;
  }, []);

  const sendText = useCallback(async () => {
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    setInputText('');
    setTranscript((prev) => [...prev, `👤 ${userMsg}`]);
    setIsThinking(true);
    setStatusText(strings.thinking);
    audioPlayer.stopAll();
    await deliverToAssistant(userMsg, null);
  }, [audioPlayer, deliverToAssistant, inputText, setInputText, setIsThinking, setStatusText, setTranscript, strings.thinking]);

  const toggleOpen = useCallback(() => {
    if (isOpen) {
      audioPlayer.stopAll();
      setIsRecording(false);
      setStatusText('');
    }
    setIsOpen((open) => !open);
  }, [audioPlayer, isOpen, setIsOpen, setIsRecording, setStatusText]);

  useEffect(
    () => () => {
      recorderSessionRef.current?.stop();
    },
    [],
  );

  return {
    deliverToAssistant,
    startRecording,
    stopRecording,
    sendText,
    toggleOpen,
  };
}
