import { useEffect, useState } from 'react';

export function useAssistantWaveform(isRecording: boolean, isPlaying: boolean): number {
  const [waveformPulse, setWaveformPulse] = useState(1);

  useEffect(() => {
    if (!isRecording && !isPlaying) {
      setWaveformPulse(1);
      return undefined;
    }

    let tick = 0;
    const intervalId = window.setInterval(() => {
      tick += 1;
      setWaveformPulse(0.6 + (Math.sin(tick * 0.5) + 1) * 0.75);
    }, 100);

    return () => clearInterval(intervalId);
  }, [isRecording, isPlaying]);

  return waveformPulse;
}
