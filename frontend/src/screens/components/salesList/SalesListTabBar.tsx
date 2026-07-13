import { History, ShieldAlert } from 'lucide-react';

interface SalesListTabBarProps {
  activeTab: 'Vendas' | 'Coleção';
  onTabChange: (tab: 'Vendas' | 'Coleção') => void;
}

export function SalesListTabBar({ activeTab, onTabChange }: SalesListTabBarProps) {
  const tabClass = (tab: 'Vendas' | 'Coleção') =>
    `flex-1 py-3 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-xs border transition-all ${
      activeTab === tab
        ? 'bg-[#8CC63F] text-white border-[#8CC63F]'
        : 'bg-white text-gray-500 border-gray-200/60 hover:bg-gray-50'
    }`;

  return (
    <div className="flex gap-2">
      <button onClick={() => onTabChange('Vendas')} className={tabClass('Vendas')}>
        <ShieldAlert size={16} />
        Vendas
      </button>
      <button onClick={() => onTabChange('Coleção')} className={tabClass('Coleção')}>
        <History size={16} />
        Coleção
      </button>
    </div>
  );
}
