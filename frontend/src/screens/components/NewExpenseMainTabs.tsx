import { CircleDollarSign, FileSpreadsheet } from 'lucide-react';

interface NewExpenseMainTabsProps {
  activeTab: 'new' | 'history';
  onChange: (tab: 'new' | 'history') => void;
}

export function NewExpenseMainTabs({ activeTab, onChange }: NewExpenseMainTabsProps) {
  return (
    <div className="px-4 max-w-md mx-auto w-full">
      <div className="grid grid-cols-2 gap-2 pb-1.5 border-b border-gray-200">
        <button
          id="tab-new-expense"
          onClick={() => onChange('new')}
          className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-extrabold transition-all border shadow-xs ${
            activeTab === 'new'
              ? 'bg-[#8CC63F] text-black border-[#8CC63F] font-black'
              : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <CircleDollarSign className="w-5 h-5 shrink-0" />
          Nuevo Egreso
        </button>
        <button
          id="tab-expense-history"
          onClick={() => onChange('history')}
          className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-extrabold transition-all border shadow-xs ${
            activeTab === 'history'
              ? 'bg-[#8CC63F] text-black border-[#8CC63F] font-black'
              : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <FileSpreadsheet className="w-5 h-5 shrink-0" />
          Histórico
        </button>
      </div>
    </div>
  );
}
