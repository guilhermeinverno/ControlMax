import { type ReactNode } from 'react';
import { Award, Check, Loader2, RefreshCw } from 'lucide-react';

interface SalesListSeedPanelProps {
  seeding: boolean;
  seedSuccess: boolean;
  onSeed: () => void;
}

function seedButtonContent(seeding: boolean, seedSuccess: boolean): ReactNode {
  if (seeding) {
    return (
      <>
        <Loader2 size={14} className="animate-spin" />
        <span>Semeando...</span>
      </>
    );
  }
  if (seedSuccess) {
    return (
      <>
        <Check size={14} className="stroke-[3]" />
        <span>Vendas Criadas com Sucesso!</span>
      </>
    );
  }
  return (
    <>
      <RefreshCw size={14} className="stroke-[2.5]" />
      <span>Criar 3 Vendas de Exemplo</span>
    </>
  );
}

export function SalesListSeedPanel({ seeding, seedSuccess, onSeed }: SalesListSeedPanelProps) {
  return (
    <div className="bg-purple-50/60 border border-purple-200/80 rounded-2xl p-4 flex flex-col items-center text-center space-y-3.5 shadow-xs">
      <div className="bg-purple-100 p-2.5 rounded-full text-[#6B21A8]">
        <Award size={20} className="stroke-[2.5]" />
      </div>
      <div className="space-y-1">
        <h3 className="text-xs font-black text-purple-950 uppercase tracking-wide">Semear 3 Vendas do Exemplo</h3>
        <p className="text-[11px] text-purple-700/80 max-w-[280px]">
          Clique no botão abaixo para adicionar as 3 vendas do exemplo (Alexa, Ana karolina, Cleber) diretamente ao seu perfil de cobrador.
        </p>
      </div>
      <button
        onClick={onSeed}
        disabled={seeding}
        className="w-full bg-[#6B21A8] hover:bg-[#581c87] text-white font-extrabold text-xs py-3 px-5 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
      >
        {seedButtonContent(seeding, seedSuccess)}
      </button>
    </div>
  );
}
