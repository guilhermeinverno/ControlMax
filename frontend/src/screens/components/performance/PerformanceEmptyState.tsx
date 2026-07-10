import { Briefcase } from 'lucide-react';
import { Screen } from '../../../types';

interface PerformanceEmptyStateProps {
  onNavigate?: (screen: Screen) => void;
}

export function PerformanceEmptyState({ onNavigate }: PerformanceEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 min-h-[400px] bg-[#F3F4F6]">
      <div className="bg-purple-100 border border-purple-200 rounded-sm p-6 max-w-md w-full text-center shadow-sm space-y-4">
        <div className="mx-auto w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
          <Briefcase className="w-6 h-6 text-[#6B21A8]" />
        </div>
        <h2 className="text-base font-black text-purple-900 uppercase tracking-wide">
          Nenhuma caixa registrada hoje
        </h2>
        <p className="text-xs text-purple-700 leading-relaxed">
          Você não possui uma caixa de trabalho aberta ou registrada para o dia de hoje. Abra um novo caixa para começar a registrar transações e acompanhar o desempenho.
        </p>
        <button
          id="btn-open-box-performance"
          onClick={() => onNavigate?.('open-box')}
          className="w-full bg-[#6B21A8] hover:bg-purple-800 text-white font-bold py-2.5 px-4 rounded text-xs uppercase shadow transition-all tracking-wider"
        >
          Abrir Caixa
        </button>
      </div>
    </div>
  );
}
