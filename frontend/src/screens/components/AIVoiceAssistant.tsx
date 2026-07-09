import { useTenant } from '../../hooks/useTenant';
import { useAIVoiceAssistant } from '../../hooks/useAIVoiceAssistant';
import { AIVoiceAssistantPanel } from './AIVoiceAssistantPanel';

interface AIVoiceAssistantProps {
  language: 'pt' | 'es';
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
  defaultOpen = false,
}: AIVoiceAssistantProps) {
  const { userName: tenantUserName, role: tenantRole, tenantId: tenantTenantId } = useTenant();

  const assistant = useAIVoiceAssistant({
    language,
    onOpenChange,
    tenantId: propTenantId || tenantTenantId,
    userName: propUserName || tenantUserName,
    role: propRole || tenantRole,
    defaultOpen,
  });

  return (
    <AIVoiceAssistantPanel
      language={language}
      isOpen={assistant.isOpen}
      isRecording={assistant.isRecording}
      isThinking={assistant.isThinking}
      isPlaying={assistant.isPlaying}
      statusText={assistant.statusText}
      inputText={assistant.inputText}
      transcript={assistant.transcript}
      waveformPulse={assistant.waveformPulse}
      chatEndRef={assistant.chatEndRef}
      onToggleOpen={assistant.toggleOpen}
      onStartRecording={assistant.startRecording}
      onStopRecording={assistant.stopRecording}
      onInputChange={assistant.setInputText}
      onSendText={assistant.sendText}
      onStopAudio={assistant.stopAllAudio}
    />
  );
}
