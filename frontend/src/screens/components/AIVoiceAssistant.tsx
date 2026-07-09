import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, Square, Sparkles, Volume2, VolumeX, Loader2, Send, X, MessageSquare, HelpCircle } from "lucide-react";
import { useTenant } from "../../hooks/useTenant";
import { db } from "../../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

function parseToDate(val: unknown): Date | null {
  if (!val) return null;
  if (typeof val === 'object' && val !== null) {
    if ('toDate' in val && typeof (val as Record<string, unknown>).toDate === 'function') return (val as { toDate: () => Date }).toDate();
    if ('seconds' in val && typeof (val as Record<string, unknown>).seconds === 'number') return new Date((val as { seconds: number }).seconds * 1000);
    if ('_seconds' in val && typeof (val as Record<string, unknown>)._seconds === 'number') return new Date((val as { _seconds: number })._seconds * 1000);
  }
  if (val instanceof Date) return val;
  if (typeof val === 'string' || typeof val === 'number') return new Date(val);
  return null;
}

async function getOperationalContext(tenantId: string) {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const isSuperAdminTenant = tenantId === "super_admin_tenant";

    // 1. Fetch active collectors
    const qUsers = isSuperAdminTenant
      ? query(
          collection(db, "users"),
          where("role", "==", "collector"),
          where("active", "==", true)
        )
      : query(
          collection(db, "users"),
          where("tenantId", "==", tenantId),
          where("role", "==", "collector"),
          where("active", "==", true)
        );

    const usersSnap = await getDocs(qUsers);
    const collectors = usersSnap.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      return {
        id: doc.id,
        name: data.userName || data.name || data.username || "Coletor",
        ...data
      };
    });

    // 2. Fetch open boxes
    const qBoxes = isSuperAdminTenant
      ? query(
          collection(db, "boxes"),
          where("status", "==", "open")
        )
      : query(
          collection(db, "boxes"),
          where("tenantId", "==", tenantId),
          where("status", "==", "open")
        );

    const boxesSnap = await getDocs(qBoxes);
    const openBoxes = boxesSnap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Record<string, unknown>)
    })).filter((box: Record<string, unknown>) => {
      const date = parseToDate(box.openedAt);
      return date ? date >= startOfToday : false;
    });

    // 3. Fetch active routes
    const qRoutes = isSuperAdminTenant
      ? query(
          collection(db, "routes")
        )
      : query(
          collection(db, "routes"),
          where("tenantId", "==", tenantId)
        );

    const routesSnap = await getDocs(qRoutes);
    const routes = routesSnap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Record<string, unknown>)
    })).filter((r: Record<string, unknown>) => r.active !== false);

    // 4. Fetch collections for today
    const qCollections = isSuperAdminTenant
      ? query(
          collection(db, "collections")
        )
      : query(
          collection(db, "collections"),
          where("tenantId", "==", tenantId)
        );

    const collectionsSnap = await getDocs(qCollections);
    const collectionsToday = collectionsSnap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Record<string, unknown>)
    })).filter((col: Record<string, unknown>) => {
      const date = parseToDate(col.createdAt);
      return date ? date >= startOfToday : false;
    });

    const totalCollectedTodayCents = collectionsToday.reduce((sum: number, col: Record<string, unknown>) => sum + ((col.amount as number) || 0), 0);
    const totalCollectedToday = totalCollectedTodayCents / 100;

    // 5. Fetch sales for today
    const qSales = isSuperAdminTenant
      ? query(
          collection(db, "sales")
        )
      : query(
          collection(db, "sales"),
          where("tenantId", "==", tenantId)
        );

    const salesSnap = await getDocs(qSales);
    const salesToday = salesSnap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Record<string, unknown>)
    })).filter((sale: Record<string, unknown>) => {
      const date = parseToDate(sale.createdAt);
      return date ? date >= startOfToday : false;
    });

    const totalSalesTodayCents = salesToday.reduce((sum: number, s: Record<string, unknown>) => sum + ((s.totalAmount as number) || (s.amount as number) || 0), 0);
    const totalSalesToday = totalSalesTodayCents / 100;

    const collectorIdsWithOpenBox = new Set(openBoxes.map((b: Record<string, unknown>) => b.userId));
    const notOnRouteCollectors = collectors.filter((c: Record<string, unknown>) => !collectorIdsWithOpenBox.has(c.id));
    const onRouteCollectors = collectors.filter((c: Record<string, unknown>) => collectorIdsWithOpenBox.has(c.id));

    const activeRoutesText = routes.map((r: Record<string, unknown>) => r.name + " (Atribuída a: " + (r.assignedUserName || "Ninguém") + ")").join("; ") || "Nenhuma";
    const salesText = totalSalesToday.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    const collectedText = totalCollectedToday.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

    const context = `
--- CONTEXTO EM TEMPO REAL DO SISTEMA ---
TenantID sendo consultado: ${tenantId} (${isSuperAdminTenant ? "SaaS Global" : "Empresa Específica"})
Data/Hora Atual do Servidor: ${new Date().toLocaleString("pt-BR")}
Cobradores Ativos Cadastrados (Total ${collectors.length}): ${collectors.map((c: Record<string, unknown>) => c.name).join(", ") || "Nenhum"}
Cobradores em Rota Hoje (Caixa Aberto Hoje) (Total ${onRouteCollectors.length}): ${onRouteCollectors.map((c: Record<string, unknown>) => c.name).join(", ") || "Nenhum"}
Cobradores que ainda NÃO saíram para a rota hoje (Sem caixa aberto hoje) (Total ${notOnRouteCollectors.length}): ${notOnRouteCollectors.map((c: Record<string, unknown>) => c.name).join(", ") || "Nenhum"}
Rotas Ativas Cadastradas: ${activeRoutesText}
Faturamento Hoje (Vendas): R$ ${salesText}
Total Cobrado Hoje (Recebimentos): R$ ${collectedText}
----------------------------------------`;

    console.log("GENERATED REAL-TIME AI OPERATIONAL CONTEXT:", context);
    return context;
  } catch (err) {
    console.error("Error fetching client-side operational context for assistant:", err);
    return "";
  }
}

interface AIVoiceAssistantProps {
  language: "pt" | "es";
  onOpenChange?: (open: boolean) => void;
  tenantId?: string;
  userName?: string;
  role?: string;
  defaultOpen?: boolean;
}

export function AIVoiceAssistant({
  language,
  onOpenChange,
  tenantId: propTenantId,
  userName: propUserName,
  role: propRole,
  defaultOpen = false
}: AIVoiceAssistantProps) {
  const { userName: tenantUserName, role: tenantRole, tenantId: tenantTenantId } = useTenant();
  const userName = propUserName || tenantUserName;
  const role = propRole || tenantRole;
  const tenantId = propTenantId || tenantTenantId;
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);
  const [isRecording, setIsRecording] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [inputText, setInputText] = useState("");
  const [transcript, setTranscript] = useState<string[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const currentAudioCtxRef = useRef<AudioContext | null>(null);
  const pulseIntervalRef = useRef<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [waveformPulse, setWaveformPulse] = useState(1);

  const stopAllAudio = () => {
    // Stop HTML5 Audio
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
      } catch (err) {}
      currentAudioRef.current = null;
    }
    // Stop Web Audio API Source
    if (currentAudioSourceRef.current) {
      try {
        currentAudioSourceRef.current.stop();
      } catch (err) {}
      currentAudioSourceRef.current = null;
    }
    // Close Web Audio Context if open
    if (currentAudioCtxRef.current) {
      try {
        currentAudioCtxRef.current.close();
      } catch (err) {}
      currentAudioCtxRef.current = null;
    }
    // Cancel SpeechSynthesis
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (err) {}
    }
    setIsPlaying(false);
  };

  // Localization strings
  const strings = {
    pt: {
      title: "Assistente de Voz IA ControlMax",
      sub: "Controle por voz em tela cheia • Toque e fale",
      placeholder: "Digite sua dúvida, comando ou transação...",
      idle: "Pronto para ajudar. Toque no microfone ou digite.",
      recording: "Ouvindo atentamente...",
      thinking: "Sintetizando inteligência artificial...",
      playing: "Falando...",
      error: "Ocorreu um erro na comunicação de voz.",
      noMic: "Acesso ao microfone recusado ou indisponível.",
      welcome: "Olá! Sou o Assistente Oficial do ControlMax. Pergunte-me sobre suas vendas, rotas, cobradores ou caixa!"
    },
    es: {
      title: "Asistente de Voz IA ControlMax",
      sub: "Control por voz en pantalla completa • Toque y hable",
      placeholder: "Escriba su duda, comando o transacción...",
      idle: "Listo para ayudar. Toque el micrófono o escriba.",
      recording: "Escuchando atentamente...",
      thinking: "Sintetizando inteligencia artificial...",
      playing: "Hablando...",
      error: "Ocurrió un error en la comunicación de voz.",
      noMic: "Acceso al micrófono denegado o no disponible.",
      welcome: "¡Hola! Soy el Asistente Oficial de ControlMax. ¡Pregúnteme sobre sus ventas, rutas, cobradores o caja!"
    }
  }[language];

  // Set initial welcome transcript
  useEffect(() => {
    if (transcript.length === 0) {
      setTranscript([strings.welcome]);
    }
  }, [language]);

  // Auto scroll to bottom when transcript updates
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcript, isThinking]);

  // Handle visual pulse effect for microphone or playback waveform
  useEffect(() => {
    if (isRecording || isPlaying) {
      pulseIntervalRef.current = window.setInterval(() => {
        setWaveformPulse(Math.random() * 1.5 + 0.6);
      }, 100);
    } else {
      if (pulseIntervalRef.current) {
        clearInterval(pulseIntervalRef.current);
      }
      setWaveformPulse(1);
    }

    return () => {
      if (pulseIntervalRef.current) {
        clearInterval(pulseIntervalRef.current);
      }
    };
  }, [isRecording, isPlaying]);

  // Stop any playing audio on unmount
  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  const startRecording = async () => {
    try {
      stopAllAudio();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setIsRecording(false);
        setIsThinking(true);
        setStatusText(strings.thinking);

        // Convert Blob to Base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(",")[1];
          await sendToAssistant(null, base64Audio);
        };

        // Stop all audio tracks to release the microphone resource
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setStatusText(strings.recording);
    } catch (err) {
      console.error("Microphone access error:", err);
      setStatusText(strings.noMic);
      setTimeout(() => setStatusText(""), 3000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const sendText = async () => {
    if (!inputText.trim()) return;
    const userMsg = inputText.trim();
    setInputText("");
    
    // Optimistic user update
    setTranscript(prev => [...prev, `👤 ${userMsg}`]);
    setIsThinking(true);
    setStatusText(strings.thinking);

    stopAllAudio();

    await sendToAssistant(userMsg, null);
  };

  const sendToAssistant = async (text: string | null, base64Audio: string | null) => {
    try {
      let clientOperationalContext = "";
      if (tenantId) {
        try {
          clientOperationalContext = await getOperationalContext(tenantId);
        } catch (e) {
          console.error("Failed to get operational context:", e);
        }
      }

      const response = await fetch("/api/gemini/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          audio: base64Audio,
          language: language,
          role: role,
          userName: userName,
          tenantId: tenantId,
          clientOperationalContext: clientOperationalContext
        })
      });

      if (!response.ok) {
        throw new Error("API call failed");
      }

      const data = await response.json();
      setIsThinking(false);
      setStatusText("");

      if (data.text) {
        setTranscript(prev => [...prev, `🤖 ${data.text}`]);
      }

      if (data.audio) {
        playBase64Audio(data.audio, data.mimeType, data.text || text || "");
      } else if (data.text) {
        speakTextWithSpeechSynthesis(data.text, language);
      }
    } catch (err) {
      console.error("Error communicating with Gemini assistant:", err);
      setStatusText(strings.error);
      setIsThinking(false);
      setTimeout(() => setStatusText(""), 4000);
    }
  };

  const speakTextWithSpeechSynthesis = (text: string, langCode: string) => {
    try {
      if (!('speechSynthesis' in window)) return;
      
      window.speechSynthesis.cancel();
      
      // Clean up markdown/emojis for a professional spoken response
      const cleanText = text.replace(/[🤖🤖✨✨*#_]/g, "").trim();
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = langCode === "pt" ? "pt-BR" : "es-ES";
      
      // Select appropriate voice for the language if loaded
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => 
        (langCode === "pt" && (v.lang === "pt-BR" || v.lang.startsWith("pt"))) || 
        (langCode === "es" && (v.lang === "es-ES" || v.lang.startsWith("es")))
      );
      if (voice) {
        utterance.voice = voice;
      }
      
      utterance.onstart = () => {
        setIsPlaying(true);
        setStatusText(strings.playing);
      };
      
      utterance.onend = () => {
        setIsPlaying(false);
        setStatusText("");
      };
      
      utterance.onerror = () => {
        setIsPlaying(false);
        setStatusText("");
      };
      
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("SpeechSynthesis failed:", err);
      setIsPlaying(false);
      setStatusText("");
    }
  };

  const playBase64Audio = (base64Data: string, mimeType?: string, textContent?: string) => {
    try {
      stopAllAudio(); // Stop any currently playing audio before starting new

      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      let bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      let type = mimeType || "audio/mpeg";
      let finalBase64 = base64Data;
      
      let isPCM = type.toLowerCase().includes("pcm") || 
                  type.toLowerCase().includes("l16") || 
                  type.toLowerCase().includes("linear") || 
                  type.toLowerCase().includes("raw");

      // Check if it's actually a standard formatted audio file (WAV, MP3, etc.) despite being labeled as PCM
      const hasWavHeader = bytes.length > 12 &&
                           bytes[0] === 82 && bytes[1] === 73 && bytes[2] === 70 && bytes[3] === 70 && // 'RIFF'
                           bytes[8] === 87 && bytes[9] === 65 && bytes[10] === 86 && bytes[11] === 69;  // 'WAVE'
      
      const hasMp3Header = (bytes.length > 3 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) || // 'ID3'
                           (bytes.length > 2 && bytes[0] === 0xFF && (bytes[1] & 0xE0) === 0xE0); // Syncword

      if (hasWavHeader || hasMp3Header) {
        isPCM = false;
        if (hasWavHeader) type = "audio/wav";
        if (hasMp3Header) type = "audio/mp3";
      }

      if (isPCM) {
        let sampleRate = 24000;
        const rateMatch = type.match(/rate=(\d+)/i);
        if (rateMatch && rateMatch[1]) {
          sampleRate = parseInt(rateMatch[1], 10);
        }

        // Auto-detect if PCM is Little Endian or Big Endian using sample correlation (smoothness score)
        let isLittleEndian = true;
        if (bytes.length >= 100) {
          let diffLE = 0;
          let diffBE = 0;
          const limit = Math.min(bytes.length - 3, 2000);
          for (let i = 0; i < limit; i += 2) {
            const val1_LE = (bytes[i] | (bytes[i + 1] << 8));
            const val1_LE_signed = val1_LE >= 32768 ? val1_LE - 65536 : val1_LE;
            const val2_LE = (bytes[i + 2] | (bytes[i + 3] << 8));
            const val2_LE_signed = val2_LE >= 32768 ? val2_LE - 65536 : val2_LE;
            diffLE += Math.abs(val1_LE_signed - val2_LE_signed);

            const val1_BE = ((bytes[i] << 8) | bytes[i + 1]);
            const val1_BE_signed = val1_BE >= 32768 ? val1_BE - 65536 : val1_BE;
            const val2_BE = ((bytes[i + 2] << 8) | bytes[i + 3]);
            const val2_BE_signed = val2_BE >= 32768 ? val2_BE - 65536 : val2_BE;
            diffBE += Math.abs(val1_BE_signed - val2_BE_signed);
          }
          isLittleEndian = diffLE < diffBE;
          console.log(`PCM Endianness Auto-Detected: ${isLittleEndian ? "Little Endian" : "Big Endian"} (Smoothness score: LE=${diffLE}, BE=${diffBE})`);
        }

        // Try direct Float32 Web Audio PCM playback first (no decoding, 100% reliable)
        const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
        if (AudioCtxClass) {
          try {
            const audioCtx = new AudioCtxClass();
            currentAudioCtxRef.current = audioCtx;

            setIsPlaying(true);
            setStatusText(strings.playing);

            // Convert raw PCM bytes to Float32Array
            const numSamples = Math.floor(bytes.byteLength / 2);
            const floats = new Float32Array(numSamples);
            const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

            for (let i = 0; i < numSamples; i++) {
              if (i * 2 + 1 < bytes.byteLength) {
                const intSample = dataView.getInt16(i * 2, isLittleEndian);
                floats[i] = intSample / 32768.0;
              }
            }

            const audioBuffer = audioCtx.createBuffer(1, numSamples, sampleRate);
            audioBuffer.copyToChannel(floats, 0);

            const source = audioCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioCtx.destination);
            
            source.onended = () => {
              setIsPlaying(false);
              setStatusText("");
            };

            currentAudioSourceRef.current = source;
            
            if (audioCtx.state === 'suspended') {
              audioCtx.resume();
            }
            
            source.start(0);
            return; // Successfully played!
          } catch (pcmPlayErr) {
            console.warn("Direct Web Audio PCM playback failed, falling back to WAV header generation:", pcmPlayErr);
          }
        }
        
        // Fallback: Wrap raw PCM in a standard 16-bit mono WAV container
        const wavBuffer = new ArrayBuffer(44 + bytes.byteLength);
        const view = new DataView(wavBuffer);
        
        const writeString = (offset: number, str: string) => {
          for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
          }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + bytes.byteLength, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true); // Subchunk1Size
        view.setUint16(20, 1, true);  // AudioFormat (1 = PCM)
        view.setUint16(22, 1, true);  // NumChannels (1 = Mono)
        view.setUint32(24, sampleRate, true); // SampleRate
        view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample / 8)
        view.setUint16(32, 2, true);  // BlockAlign (NumChannels * BitsPerSample / 8)
        view.setUint16(34, 16, true); // BitsPerSample
        writeString(36, 'data');
        view.setUint32(40, bytes.byteLength, true);
        
        // Copy PCM samples (swapping bytes if Big Endian, because WAV expects Little-Endian samples)
        const wavBytes = new Uint8Array(wavBuffer);
        if (!isLittleEndian) {
          for (let i = 0; i < bytes.byteLength; i += 2) {
            if (i + 1 < bytes.byteLength) {
              wavBytes[44 + i] = bytes[i + 1];     // Low byte
              wavBytes[44 + i + 1] = bytes[i];     // High byte
            } else {
              wavBytes[44 + i] = bytes[i];
            }
          }
        } else {
          wavBytes.set(bytes, 44);
        }
        
        // Convert the wrapped WAV bytes back to base64
        let binary = '';
        const wavLen = wavBytes.byteLength;
        for (let i = 0; i < wavLen; i++) {
          binary += String.fromCharCode(wavBytes[i]);
        }
        finalBase64 = window.btoa(binary);
        type = "audio/wav";
        bytes = wavBytes;
      }

      // Try playing with Web Audio API first as it's the most modern and sandbox-friendly approach for byte arrays
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        try {
          const audioCtx = new AudioCtxClass();
          currentAudioCtxRef.current = audioCtx;

          setIsPlaying(true);
          setStatusText(strings.playing);

          // We slice because decodeAudioData consumes the ArrayBuffer
          const bufferToDecode = bytes.buffer.slice(0);

          audioCtx.decodeAudioData(bufferToDecode, (audioBuffer) => {
            const source = audioCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioCtx.destination);
            source.onended = () => {
              setIsPlaying(false);
              setStatusText("");
            };
            currentAudioSourceRef.current = source;
            source.start(0);
          }, (decodeErr) => {
            console.warn("Web Audio API decode failed, falling back to HTML5 Audio element:", decodeErr);
            playHTML5AudioFallback(finalBase64, type, textContent);
          });
          return; // Handled
        } catch (webAudioErr) {
          console.warn("Web Audio API setup failed, falling back to HTML5 Audio element:", webAudioErr);
        }
      }

      // Fallback
      playHTML5AudioFallback(finalBase64, type, textContent);

    } catch (err) {
      console.warn("Audio playback error, falling back to speech synthesis:", err);
      if (textContent) {
        speakTextWithSpeechSynthesis(textContent, language);
      } else {
        setIsPlaying(false);
      }
    }
  };

  const playHTML5AudioFallback = (base64Data: string, mimeType: string, textContent?: string) => {
    try {
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      let audioUrl = "";
      try {
        const blob = new Blob([bytes], { type: mimeType });
        audioUrl = URL.createObjectURL(blob);
      } catch (blobErr) {
        audioUrl = `data:${mimeType};base64,${base64Data}`;
      }

      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      setIsPlaying(true);
      setStatusText(strings.playing);
      
      audio.onended = () => {
        setIsPlaying(false);
        setStatusText("");
        if (audioUrl.startsWith("blob:")) {
          URL.revokeObjectURL(audioUrl);
        }
      };
      
      audio.onerror = (e) => {
        console.warn("HTML5 Audio element warning event, falling back to speech synthesis:", e);
        if (audioUrl.startsWith("blob:")) {
          URL.revokeObjectURL(audioUrl);
        }
        
        // Try playing directly with Data URL if Blob URL failed
        if (audioUrl.startsWith("blob:")) {
          const directDataUrl = `data:${mimeType};base64,${base64Data}`;
          const fallbackAudio = new Audio(directDataUrl);
          currentAudioRef.current = fallbackAudio;
          
          fallbackAudio.onended = () => {
            setIsPlaying(false);
            setStatusText("");
          };
          fallbackAudio.onerror = (errEvent) => {
            console.warn("HTML5 Data URL fallback also failed, calling speech synthesis:", errEvent);
            if (textContent) {
              speakTextWithSpeechSynthesis(textContent, language);
            } else {
              setIsPlaying(false);
              setStatusText("");
            }
          };
          fallbackAudio.play().catch(pErr => {
            console.warn("HTML5 Data URL playback failed:", pErr);
            if (textContent) {
              speakTextWithSpeechSynthesis(textContent, language);
            } else {
              setIsPlaying(false);
              setStatusText("");
            }
          });
        } else {
          if (textContent) {
            speakTextWithSpeechSynthesis(textContent, language);
          } else {
            setIsPlaying(false);
            setStatusText("");
          }
        }
      };
      
      audio.play().catch(playErr => {
        console.warn("Playback restriction or error, falling back to speech synthesis:", playErr);
        if (audioUrl.startsWith("blob:")) {
          URL.revokeObjectURL(audioUrl);
        }
        if (textContent) {
          speakTextWithSpeechSynthesis(textContent, language);
        } else {
          setIsPlaying(false);
          setStatusText("");
        }
      });
    } catch (err) {
      console.warn("HTML5 fallback error, calling speech synthesis:", err);
      if (textContent) {
        speakTextWithSpeechSynthesis(textContent, language);
      } else {
        setIsPlaying(false);
        setStatusText("");
      }
    }
  };

  const toggleOpen = () => {
    if (isOpen) {
      stopAllAudio();
      setIsRecording(false);
      setStatusText("");
    }
    setIsOpen(!isOpen);
  };

  return (
    <div id="ai-voice-assistant-container" className={`fixed bottom-24 right-6 font-sans ${isOpen ? "z-[9999]" : "z-50"}`}>
      {/* Floating launcher button */}
      <motion.button
        id="ai-assistant-toggle"
        onClick={toggleOpen}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-xl border border-slate-700 hover:bg-slate-800 transition-colors"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <X className="h-6 w-6" key="close" />
          ) : (
            <div className="relative">
              <Sparkles className="h-6 w-6 text-indigo-400 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Assistant panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="ai-assistant-panel"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="fixed inset-0 z-[999] bg-slate-950/98 text-white flex flex-col overflow-hidden backdrop-blur-xl"
          >
            {/* Full screen gradient background effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent_45%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.04),transparent_45%)] pointer-events-none" />

            {/* Premium Header */}
            <header className="relative shrink-0 border-b border-slate-800/80 px-6 py-4 flex items-center justify-between bg-slate-950/60 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
                </div>
                <div>
                  <h1 className="font-bold text-base md:text-lg tracking-tight text-slate-100 flex items-center gap-2">
                    {strings.title}
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/15 border border-indigo-400/20 font-mono text-indigo-400 tracking-wider uppercase">
                      Gemini 3.5
                    </span>
                  </h1>
                  <p className="text-xs text-slate-400 font-medium">
                    {strings.sub}
                  </p>
                </div>
              </div>
              <button 
                onClick={toggleOpen} 
                className="flex items-center justify-center h-10 w-10 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white text-slate-300 transition-all cursor-pointer shadow-lg"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </header>

            {/* Conversation Log - Center Focused Layout */}
            <main className="relative flex-1 overflow-y-auto px-6 py-8 md:py-12 bg-slate-950/30">
              <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
                {transcript.map((msg, idx) => {
                  const isUser = msg.startsWith("👤");
                  const cleaned = msg.replace(/^[👤🤖]\s*/, "");
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`flex gap-3 max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                        <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center font-mono text-xs ${
                          isUser ? "bg-indigo-600/20 border border-indigo-500/30 text-indigo-300" : "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300"
                        }`}>
                          {isUser ? "U" : "AI"}
                        </div>
                        <div
                          className={`rounded-2xl px-5 py-4 text-sm md:text-base leading-relaxed shadow-lg border ${
                            isUser
                              ? "bg-indigo-600 border-indigo-500/40 text-slate-50 rounded-tr-none"
                              : "bg-slate-900/90 border-slate-800 text-slate-100 rounded-tl-none"
                          }`}
                        >
                          {cleaned}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                
                {/* Thinking loader */}
                {isThinking && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="flex gap-3 max-w-[85%]">
                      <div className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono text-xs">
                        AI
                      </div>
                      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl rounded-tl-none px-5 py-4 text-sm text-slate-400 shadow-lg flex items-center gap-3">
                        <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                        <span>{strings.thinking}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={chatEndRef} />
              </div>
            </main>

            {/* Immersive Action Bar */}
            <footer className="shrink-0 bg-slate-950 border-t border-slate-900/80 p-6 md:p-8">
              <div className="max-w-4xl mx-auto w-full flex flex-col items-center gap-6">
                
                {/* Subtle Voice Waveform (Only when recording or playing) */}
                {(isRecording || isPlaying) && (
                  <div className="flex flex-col items-center gap-2 w-full">
                    <div className="flex items-center gap-3 bg-slate-900/60 px-4 py-1.5 rounded-full border border-slate-800/80">
                      {isPlaying && <Volume2 className="h-4 w-4 text-emerald-400 animate-pulse" />}
                      {isRecording && <Mic className="h-4 w-4 text-red-400 animate-pulse" />}
                      <span className="text-xs text-slate-300 font-medium tracking-wide">
                        {statusText}
                      </span>
                      {isPlaying && (
                        <button
                          onClick={stopAllAudio}
                          className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-rose-500/20 hover:border-rose-500/40 transition-all cursor-pointer shadow-sm"
                          title="Parar reprodução de áudio"
                        >
                          <VolumeX className="h-3 w-3 animate-pulse" />
                          <span>Parar</span>
                        </button>
                      )}
                    </div>
                    
                    {/* Compact clean inline waveform */}
                    <div className="flex gap-1 items-end h-8 justify-center">
                      {[...Array(16)].map((_, i) => {
                        const factor = Math.sin((i / 15) * Math.PI);
                        const h = Math.max(4, waveformPulse * (factor * 24) * (0.4 + Math.random() * 0.6));
                        return (
                          <span
                            key={i}
                            style={{ height: `${h}px` }}
                            className={`w-1 rounded-full transition-all duration-100 ${
                              isRecording 
                                ? "bg-gradient-to-t from-red-500 to-rose-400" 
                                : "bg-gradient-to-t from-emerald-500 to-teal-400"
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="w-full flex flex-col md:flex-row items-center gap-6">
                  {/* Master voice touch triggers */}
                  <div className="flex items-center gap-4 w-full md:w-auto shrink-0 justify-center">
                    <button
                      id="voice-mic-button"
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`flex h-16 w-16 md:h-20 md:w-20 shrink-0 items-center justify-center rounded-full transition-all duration-300 cursor-pointer shadow-2xl ${
                        isRecording
                          ? "bg-gradient-to-br from-red-500 to-rose-600 text-white animate-pulse ring-8 ring-red-500/20"
                          : "bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white ring-8 ring-indigo-500/10 hover:scale-105"
                      }`}
                      title={isRecording ? "Stop recording" : "Speak to assistant"}
                    >
                      {isRecording ? <Square className="h-6 w-6 md:h-7 md:w-7" /> : <Mic className="h-7 w-7 md:h-9 md:w-9" />}
                    </button>
                  </div>

                  {/* Text Fallback Input Container */}
                  <div className="relative flex-1 w-full flex items-center bg-slate-900/90 rounded-2xl border border-slate-800 px-4 py-2 hover:border-slate-700 transition-colors">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendText()}
                      placeholder={strings.placeholder}
                      className="flex-1 bg-transparent text-sm md:text-base text-slate-100 placeholder-slate-500 focus:outline-none py-2 px-2"
                    />
                    <button
                      onClick={sendText}
                      disabled={!inputText.trim()}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition-all cursor-pointer shadow-lg"
                    >
                      <Send className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

