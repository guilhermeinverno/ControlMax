export interface VoiceRecorderSession {
  stop: () => void;
}

function blobToBase64Audio(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read audio blob'));
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Invalid audio data URL'));
        return;
      }
      resolve(result.split(',')[1] ?? '');
    };
    reader.readAsDataURL(blob);
  });
}

export async function startVoiceRecording(
  onAudioReady: (base64Audio: string) => void | Promise<void>,
): Promise<VoiceRecorderSession> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const audioChunks: Blob[] = [];
  const recorder = new MediaRecorder(stream);

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) audioChunks.push(event.data);
  };

  recorder.onstop = () => {
    void (async () => {
      try {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const base64Audio = await blobToBase64Audio(audioBlob);
        await onAudioReady(base64Audio);
      } finally {
        stream.getTracks().forEach((track) => track.stop());
      }
    })();
  };

  recorder.start();

  return {
    stop: () => {
      if (recorder.state !== 'inactive') recorder.stop();
    },
  };
}
