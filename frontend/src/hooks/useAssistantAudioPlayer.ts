import { useEffect, useRef } from 'react';
import { AssistantAudioPlayer } from '../utils/assistantAudio';
import type { AssistantLanguage } from '../utils/assistantStrings';

export function useAssistantAudioPlayer(
  language: AssistantLanguage,
  playingLabel: string,
  setIsPlaying: (value: boolean) => void,
  setStatusText: (value: string) => void,
): AssistantAudioPlayer {
  const audioPlayerRef = useRef<AssistantAudioPlayer | null>(null);

  if (!audioPlayerRef.current) {
    const player = new AssistantAudioPlayer({
      playingLabel,
      onPlayStart: () => {
        setIsPlaying(true);
        setStatusText(playingLabel);
      },
      onPlayEnd: () => {
        setIsPlaying(false);
        setStatusText('');
      },
      onSpeakFallback: (text) => {
        player.speakWithSynthesis(text, language);
      },
    });
    audioPlayerRef.current = player;
  }

  const audioPlayer = audioPlayerRef.current;

  useEffect(() => () => audioPlayer.stopAll(), [audioPlayer]);

  return audioPlayer;
}
