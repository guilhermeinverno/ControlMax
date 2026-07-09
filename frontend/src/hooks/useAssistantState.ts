import { useState } from 'react';

export function useAssistantState(defaultOpen = false) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isRecording, setIsRecording] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [inputText, setInputText] = useState('');
  const [transcript, setTranscript] = useState<string[]>([]);

  return {
    isOpen,
    setIsOpen,
    isRecording,
    setIsRecording,
    isThinking,
    setIsThinking,
    isPlaying,
    setIsPlaying,
    statusText,
    setStatusText,
    inputText,
    setInputText,
    transcript,
    setTranscript,
  };
}
