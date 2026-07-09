import { AIVoiceAssistant } from './components/AIVoiceAssistant';
import { useTenant } from '../hooks/useTenant';
import { Screen } from '../types';

export function AIAssistant({ onNavigate }: { onNavigate?: (screen: Screen) => void }) {
  const { role, tenantId, userName } = useTenant();

  // Controle de acesso — só admin e supervisor
  if (role === 'collector') {
    return (
      <div id="ai-assistant-restricted" className="flex flex-col items-center justify-center min-h-screen bg-[#F3F4F6] p-8 text-center">
        <div className="text-5xl mb-4">🤖</div>
        <h2 className="text-lg font-bold text-[#333333] mb-2">
          Acesso Restrito
        </h2>
        <p className="text-sm text-[#6B7280] mb-6">
          O Assistente de IA é exclusivo para gestores e supervisores.
        </p>
        <button
          onClick={() => onNavigate?.('dashboard')}
          className="bg-[#6B21A8] hover:bg-[#521A82] active:scale-95 transition-all text-white font-bold text-sm py-2 px-6 rounded shadow cursor-pointer">
          Voltar ao Dashboard
        </button>
      </div>
    );
  }

  return (
    <div id="ai-assistant-screen" className="flex flex-col bg-[#F3F4F6] min-h-screen">
      {/* Header da tela */}
      <div className="bg-[#6B21A8] px-4 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#84CC16] rounded-full flex items-center justify-center text-xl shadow-md">
            🤖
          </div>
          <div>
            <h1 className="text-white font-bold text-base">
              Assistente de IA
            </h1>
            <p className="text-purple-200 text-xs font-medium">
              Análise inteligente da sua operação em tempo real
            </p>
          </div>
        </div>
      </div>

      {/* Chips de sugestão */}
      <div className="px-4 py-3 bg-white border-b border-gray-200 shrink-0">
        <p className="text-[11px] font-bold text-[#555555] uppercase mb-2">Perguntas frequentes</p>
        <div className="flex gap-2 flex-wrap">
          {[
            'Resumo do dia',
            'Melhor cobrador hoje',
            'Caixas abertas agora',
            'Total arrecadado',
            'Gastos pendentes',
          ].map(q => (
            <button key={q}
              className="bg-[#F3E8FF] text-[#6B21A8] text-xs font-semibold px-3 py-1.5 rounded-full border border-[#D8B4FE] hover:bg-[#6B21A8] hover:text-white hover:border-[#6B21A8] transition-all cursor-pointer">
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Componente de voz/chat */}
      <div className="flex-1 relative">
        <AIVoiceAssistant
          language="pt"
          tenantId={tenantId}
          userName={userName}
          role={role}
          defaultOpen={true}
        />
      </div>
    </div>
  );
}
