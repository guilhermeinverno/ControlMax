import type { RefObject } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Square, Sparkles, Volume2, VolumeX, Loader2, Send, X } from 'lucide-react';
import { WAVE_BAR_KEYS } from '../../constants/placeholders';
import type { AssistantLanguage } from '../../utils/assistantStrings';
import { assistantStrings } from '../../utils/assistantStrings';

function waveBarJitter(barIndex: number): number {
  return 0.4 + ((barIndex * 17 + 7) % 60) / 100;
}

interface AIVoiceAssistantPanelProps {
  language: AssistantLanguage;
  isOpen: boolean;
  isRecording: boolean;
  isThinking: boolean;
  isPlaying: boolean;
  statusText: string;
  inputText: string;
  transcript: string[];
  waveformPulse: number;
  chatEndRef: RefObject<HTMLDivElement | null>;
  onToggleOpen: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onInputChange: (value: string) => void;
  onSendText: () => void;
  onStopAudio: () => void;
}

export function AIVoiceAssistantPanel({
  language,
  isOpen,
  isRecording,
  isThinking,
  isPlaying,
  statusText,
  inputText,
  transcript,
  waveformPulse,
  chatEndRef,
  onToggleOpen,
  onStartRecording,
  onStopRecording,
  onInputChange,
  onSendText,
  onStopAudio,
}: AIVoiceAssistantPanelProps) {
  const strings = assistantStrings(language);

  return (
    <div id="ai-voice-assistant-container" className={`fixed bottom-24 right-6 font-sans ${isOpen ? 'z-[9999]' : 'z-50'}`}>
      <motion.button
        id="ai-assistant-toggle"
        onClick={onToggleOpen}
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
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            </div>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="ai-assistant-panel"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="fixed inset-0 z-[999] bg-slate-950/98 text-white flex flex-col overflow-hidden backdrop-blur-xl"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent_45%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.04),transparent_45%)] pointer-events-none" />

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
                  <p className="text-xs text-slate-400 font-medium">{strings.sub}</p>
                </div>
              </div>
              <button
                onClick={onToggleOpen}
                className="flex items-center justify-center h-10 w-10 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white text-slate-300 transition-all cursor-pointer shadow-lg"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </header>

            <main className="relative flex-1 overflow-y-auto px-6 py-8 md:py-12 bg-slate-950/30">
              <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
                {transcript.map((msg) => {
                  const isUser = msg.startsWith('👤');
                  const cleaned = msg.replace(/^[👤🤖]\s*/, '');
                  return (
                    <motion.div
                      key={msg}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-3 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center font-mono text-xs ${
                          isUser
                            ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-300'
                            : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                        }`}
                        >
                          {isUser ? 'U' : 'AI'}
                        </div>
                        <div
                          className={`rounded-2xl px-5 py-4 text-sm md:text-base leading-relaxed shadow-lg border ${
                            isUser
                              ? 'bg-indigo-600 border-indigo-500/40 text-slate-50 rounded-tr-none'
                              : 'bg-slate-900/90 border-slate-800 text-slate-100 rounded-tl-none'
                          }`}
                        >
                          {cleaned}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {isThinking && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
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

            <footer className="shrink-0 bg-slate-950 border-t border-slate-900/80 p-6 md:p-8">
              <div className="max-w-4xl mx-auto w-full flex flex-col items-center gap-6">
                {(isRecording || isPlaying) && (
                  <div className="flex flex-col items-center gap-2 w-full">
                    <div className="flex items-center gap-3 bg-slate-900/60 px-4 py-1.5 rounded-full border border-slate-800/80">
                      {isPlaying && <Volume2 className="h-4 w-4 text-emerald-400 animate-pulse" />}
                      {isRecording && <Mic className="h-4 w-4 text-red-400 animate-pulse" />}
                      <span className="text-xs text-slate-300 font-medium tracking-wide">{statusText}</span>
                      {isPlaying && (
                        <button
                          onClick={onStopAudio}
                          className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-rose-500/20 hover:border-rose-500/40 transition-all cursor-pointer shadow-sm"
                          title="Parar reprodução de áudio"
                        >
                          <VolumeX className="h-3 w-3 animate-pulse" />
                          <span>Parar</span>
                        </button>
                      )}
                    </div>

                    <div className="flex gap-1 items-end h-8 justify-center">
                      {WAVE_BAR_KEYS.map((barKey, i) => {
                        const factor = Math.sin((i / 15) * Math.PI);
                        const h = Math.max(4, waveformPulse * (factor * 24) * waveBarJitter(i));
                        return (
                          <span
                            key={barKey}
                            style={{ height: `${h}px` }}
                            className={`w-1 rounded-full transition-all duration-100 ${
                              isRecording
                                ? 'bg-gradient-to-t from-red-500 to-rose-400'
                                : 'bg-gradient-to-t from-emerald-500 to-teal-400'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="w-full flex flex-col md:flex-row items-center gap-6">
                  <div className="flex items-center gap-4 w-full md:w-auto shrink-0 justify-center">
                    <button
                      id="voice-mic-button"
                      onClick={isRecording ? onStopRecording : onStartRecording}
                      className={`flex h-16 w-16 md:h-20 md:w-20 shrink-0 items-center justify-center rounded-full transition-all duration-300 cursor-pointer shadow-2xl ${
                        isRecording
                          ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white animate-pulse ring-8 ring-red-500/20'
                          : 'bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white ring-8 ring-indigo-500/10 hover:scale-105'
                      }`}
                      title={isRecording ? 'Stop recording' : 'Speak to assistant'}
                    >
                      {isRecording ? <Square className="h-6 w-6 md:h-7 md:w-7" /> : <Mic className="h-7 w-7 md:h-9 md:w-9" />}
                    </button>
                  </div>

                  <div className="relative flex-1 w-full flex items-center bg-slate-900/90 rounded-2xl border border-slate-800 px-4 py-2 hover:border-slate-700 transition-colors">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => onInputChange(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && onSendText()}
                      placeholder={strings.placeholder}
                      className="flex-1 bg-transparent text-sm md:text-base text-slate-100 placeholder-slate-500 focus:outline-none py-2 px-2"
                    />
                    <button
                      onClick={onSendText}
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
