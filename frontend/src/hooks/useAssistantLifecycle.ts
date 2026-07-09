import { useEffect, type Dispatch, type RefObject, type SetStateAction } from 'react';
import type { AssistantLanguage } from '../utils/assistantStrings';

interface UseAssistantLifecycleOptions {
  isOpen: boolean;
  onOpenChange?: (open: boolean) => void;
  language: AssistantLanguage;
  welcomeMessage: string;
  transcript: string[];
  setTranscript: Dispatch<SetStateAction<string[]>>;
  isThinking: boolean;
  chatEndRef: RefObject<HTMLDivElement | null>;
}

export function useAssistantLifecycle({
  isOpen,
  onOpenChange,
  language,
  welcomeMessage,
  transcript,
  setTranscript,
  isThinking,
  chatEndRef,
}: UseAssistantLifecycleOptions): void {
  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  useEffect(() => {
    setTranscript((prev) => (prev.length === 0 ? [welcomeMessage] : prev));
  }, [language, welcomeMessage, setTranscript]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatEndRef, transcript, isThinking]);
}
