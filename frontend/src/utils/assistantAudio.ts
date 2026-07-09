export interface AssistantAudioHandlers {
  playingLabel: string;
  onPlayStart: () => void;
  onPlayEnd: () => void;
  onSpeakFallback: (text: string) => void;
}

function getAudioContextClass(): typeof AudioContext | null {
  return window.AudioContext
    || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    || null;
}

function base64ToBytes(base64Data: string): Uint8Array {
  const binaryString = window.atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i += 1) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function hasWavHeader(bytes: Uint8Array): boolean {
  return bytes.length > 12
    && bytes[0] === 82 && bytes[1] === 73 && bytes[2] === 70 && bytes[3] === 70
    && bytes[8] === 87 && bytes[9] === 65 && bytes[10] === 86 && bytes[11] === 69;
}

function hasMp3Header(bytes: Uint8Array): boolean {
  return (bytes.length > 3 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33)
    || (bytes.length > 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
}

function isPcmMimeType(type: string): boolean {
  const lower = type.toLowerCase();
  return lower.includes('pcm') || lower.includes('l16') || lower.includes('linear') || lower.includes('raw');
}

function parseSampleRate(mimeType: string): number {
  const match = mimeType.match(/rate=(\d+)/i);
  return match?.[1] ? parseInt(match[1], 10) : 24000;
}

function detectPcmEndianness(bytes: Uint8Array): boolean {
  if (bytes.length < 100) return true;

  let diffLE = 0;
  let diffBE = 0;
  const limit = Math.min(bytes.length - 3, 2000);

  for (let i = 0; i < limit; i += 2) {
    const val1LE = bytes[i] | (bytes[i + 1] << 8);
    const val1LESigned = val1LE >= 32768 ? val1LE - 65536 : val1LE;
    const val2LE = bytes[i + 2] | (bytes[i + 3] << 8);
    const val2LESigned = val2LE >= 32768 ? val2LE - 65536 : val2LE;
    diffLE += Math.abs(val1LESigned - val2LESigned);

    const val1BE = (bytes[i] << 8) | bytes[i + 1];
    const val1BESigned = val1BE >= 32768 ? val1BE - 65536 : val1BE;
    const val2BE = (bytes[i + 2] << 8) | bytes[i + 3];
    const val2BESigned = val2BE >= 32768 ? val2BE - 65536 : val2BE;
    diffBE += Math.abs(val1BESigned - val2BESigned);
  }

  return diffLE < diffBE;
}

function pcmToWavBase64(bytes: Uint8Array, sampleRate: number, isLittleEndian: boolean): string {
  const wavBuffer = new ArrayBuffer(44 + bytes.byteLength);
  const view = new DataView(wavBuffer);
  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + bytes.byteLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, bytes.byteLength, true);

  const wavBytes = new Uint8Array(wavBuffer);
  if (!isLittleEndian) {
    for (let i = 0; i < bytes.byteLength; i += 2) {
      if (i + 1 < bytes.byteLength) {
        wavBytes[44 + i] = bytes[i + 1];
        wavBytes[44 + i + 1] = bytes[i];
      } else {
        wavBytes[44 + i] = bytes[i];
      }
    }
  } else {
    wavBytes.set(bytes, 44);
  }

  let binary = '';
  for (let i = 0; i < wavBytes.byteLength; i += 1) {
    binary += String.fromCharCode(wavBytes[i]);
  }
  return window.btoa(binary);
}

export class AssistantAudioPlayer {
  private audioRef: HTMLAudioElement | null = null;
  private sourceRef: AudioBufferSourceNode | null = null;
  private ctxRef: AudioContext | null = null;

  constructor(private readonly handlers: AssistantAudioHandlers) {}

  stopAll(): void {
    if (this.audioRef) {
      try { this.audioRef.pause(); } catch { /* noop */ }
      this.audioRef = null;
    }
    if (this.sourceRef) {
      try { this.sourceRef.stop(); } catch { /* noop */ }
      this.sourceRef = null;
    }
    if (this.ctxRef) {
      const ctx = this.ctxRef;
      this.ctxRef = null;
      void ctx.close().catch(() => {});
    }
    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch { /* noop */ }
    }
    this.handlers.onPlayEnd();
  }

  speakWithSynthesis(text: string, langCode: string): void {
    try {
      if (!('speechSynthesis' in window)) return;

      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[🤖✨*#_]/g, '').trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = langCode === 'pt' ? 'pt-BR' : 'es-ES';

      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find((item) =>
        (langCode === 'pt' && (item.lang === 'pt-BR' || item.lang.startsWith('pt')))
        || (langCode === 'es' && (item.lang === 'es-ES' || item.lang.startsWith('es'))),
      );
      if (voice) utterance.voice = voice;

      utterance.onstart = () => this.handlers.onPlayStart();
      utterance.onend = () => this.handlers.onPlayEnd();
      utterance.onerror = () => this.handlers.onPlayEnd();
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('SpeechSynthesis failed:', err);
      this.handlers.onPlayEnd();
    }
  }

  playBase64(base64Data: string, mimeType?: string, textContent?: string): void {
    try {
      this.stopAll();
      let bytes = base64ToBytes(base64Data);
      let type = mimeType || 'audio/mpeg';
      let finalBase64 = base64Data;

      let isPCM = isPcmMimeType(type);
      if (hasWavHeader(bytes)) {
        isPCM = false;
        type = 'audio/wav';
      } else if (hasMp3Header(bytes)) {
        isPCM = false;
        type = 'audio/mp3';
      }

      if (isPCM) {
        const sampleRate = parseSampleRate(type);
        const isLittleEndian = detectPcmEndianness(bytes);
        if (this.playPcmDirect(bytes, sampleRate, isLittleEndian)) return;

        finalBase64 = pcmToWavBase64(bytes, sampleRate, isLittleEndian);
        type = 'audio/wav';
        bytes = base64ToBytes(finalBase64);
      }

      if (this.playWithWebAudioDecode(bytes, finalBase64, type, textContent)) return;
      this.playHtml5Fallback(finalBase64, type, textContent);
    } catch (err) {
      console.warn('Audio playback error, falling back to speech synthesis:', err);
      if (textContent) this.handlers.onSpeakFallback(textContent);
      else this.handlers.onPlayEnd();
    }
  }

  private playPcmDirect(bytes: Uint8Array, sampleRate: number, isLittleEndian: boolean): boolean {
    const AudioCtxClass = getAudioContextClass();
    if (!AudioCtxClass) return false;

    try {
      const audioCtx = new AudioCtxClass();
      this.ctxRef = audioCtx;
      this.handlers.onPlayStart();

      const numSamples = Math.floor(bytes.byteLength / 2);
      const floats = new Float32Array(numSamples);
      const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

      for (let i = 0; i < numSamples; i += 1) {
        if (i * 2 + 1 < bytes.byteLength) {
          floats[i] = dataView.getInt16(i * 2, isLittleEndian) / 32768.0;
        }
      }

      const audioBuffer = audioCtx.createBuffer(1, numSamples, sampleRate);
      audioBuffer.copyToChannel(floats, 0);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.onended = () => this.handlers.onPlayEnd();
      this.sourceRef = source;

      if (audioCtx.state === 'suspended') void audioCtx.resume();
      source.start(0);
      return true;
    } catch (err) {
      console.warn('Direct Web Audio PCM playback failed:', err);
      return false;
    }
  }

  private playWithWebAudioDecode(
    bytes: Uint8Array,
    finalBase64: string,
    type: string,
    textContent?: string,
  ): boolean {
    const AudioCtxClass = getAudioContextClass();
    if (!AudioCtxClass) return false;

    try {
      const audioCtx = new AudioCtxClass();
      this.ctxRef = audioCtx;
      this.handlers.onPlayStart();

      const bufferToDecode = bytes.buffer.slice(0);
      audioCtx.decodeAudioData(
        bufferToDecode,
        (audioBuffer) => {
          const source = audioCtx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioCtx.destination);
          source.onended = () => this.handlers.onPlayEnd();
          this.sourceRef = source;
          source.start(0);
        },
        () => this.playHtml5Fallback(finalBase64, type, textContent),
      );
      return true;
    } catch (err) {
      console.warn('Web Audio API setup failed:', err);
      return false;
    }
  }

  private playHtml5Fallback(base64Data: string, mimeType: string, textContent?: string): void {
    try {
      const bytes = base64ToBytes(base64Data);
      let audioUrl = '';

      try {
        audioUrl = URL.createObjectURL(new Blob([bytes], { type: mimeType }));
      } catch {
        audioUrl = `data:${mimeType};base64,${base64Data}`;
      }

      const audio = new Audio(audioUrl);
      this.audioRef = audio;
      this.handlers.onPlayStart();

      const cleanupUrl = () => {
        if (audioUrl.startsWith('blob:')) URL.revokeObjectURL(audioUrl);
      };

      const fallbackToSpeech = () => {
        if (textContent) this.handlers.onSpeakFallback(textContent);
        else this.handlers.onPlayEnd();
      };

      audio.onended = () => {
        this.handlers.onPlayEnd();
        cleanupUrl();
      };

      audio.onerror = () => {
        cleanupUrl();
        if (!audioUrl.startsWith('blob:')) {
          fallbackToSpeech();
          return;
        }

        const directAudio = new Audio(`data:${mimeType};base64,${base64Data}`);
        this.audioRef = directAudio;
        directAudio.onended = () => this.handlers.onPlayEnd();
        directAudio.onerror = () => fallbackToSpeech();
        void directAudio.play().catch(() => fallbackToSpeech());
      };

      void audio.play().catch(() => {
        cleanupUrl();
        fallbackToSpeech();
      });
    } catch (err) {
      console.warn('HTML5 fallback error:', err);
      if (textContent) this.handlers.onSpeakFallback(textContent);
      else this.handlers.onPlayEnd();
    }
  }
}
