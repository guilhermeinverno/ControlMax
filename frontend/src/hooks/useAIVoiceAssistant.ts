import { useRef } from 'react';
import { assistantStrings, type AssistantLanguage } from '../utils/assistantStrings';
import { useAssistantAudioPlayer } from './useAssistantAudioPlayer';
import { useAssistantLifecycle } from './useAssistantLifecycle';
import { useAssistantMessaging } from './useAssistantMessaging';
import { useAssistantState } from './useAssistantState';
import { useAssistantWaveform } from './useAssistantWaveform';

interface UseAIVoiceAssistantOptions {
  language: AssistantLanguage;
  tenantId?: string;
  userName?: string;
  role?: string;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
}

export function useAIVoiceAssistant({
  language,
  tenantId,
  userName,
  role,
  onOpenChange,
  defaultOpen = false,
}: UseAIVoiceAssistantOptions) {
  const strings = assistantStrings(language);
  const state = useAssistantState(defaultOpen);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const audioPlayer = useAssistantAudioPlayer(
    language,
    strings.playing,
    state.setIsPlaying,
    state.setStatusText,
  );
  const waveformPulse = useAssistantWaveform(state.isRecording, state.isPlaying);

  const messaging = useAssistantMessaging({
    language,
    tenantId,
    userName,
    role,
    strings,
    audioPlayer,
    isOpen: state.isOpen,
    setIsOpen: state.setIsOpen,
    isRecording: state.isRecording,
    setIsRecording: state.setIsRecording,
    setIsThinking: state.setIsThinking,
    inputText: state.inputText,
    setInputText: state.setInputText,
    setTranscript: state.setTranscript,
    setStatusText: state.setStatusText,
  });

  useAssistantLifecycle({
    isOpen: state.isOpen,
    onOpenChange,
    language,
    welcomeMessage: strings.welcome,
    transcript: state.transcript,
    setTranscript: state.setTranscript,
    isThinking: state.isThinking,
    chatEndRef,
  });

  return {
    strings,
    isOpen: state.isOpen,
    isRecording: state.isRecording,
    isThinking: state.isThinking,
    isPlaying: state.isPlaying,
    statusText: state.statusText,
    inputText: state.inputText,
    setInputText: state.setInputText,
    transcript: state.transcript,
    waveformPulse,
    chatEndRef,
    startRecording: messaging.startRecording,
    stopRecording: messaging.stopRecording,
    sendText: messaging.sendText,
    toggleOpen: messaging.toggleOpen,
    stopAllAudio: () => audioPlayer.stopAll(),
  };
}
