import { UserPlus, Users } from 'lucide-react';

interface CompanyListTabBarProps {
  activeTab: 'list' | 'create';
  customerCount: number;
  onChange: (tab: 'list' | 'create') => void;
}

export function CompanyListTabBar({ activeTab, customerCount, onChange }: CompanyListTabBarProps) {
  return (
    <div className="flex items-center border-b border-gray-200">
      <button
        onClick={() => onChange('create')}
        className={`flex items-center gap-2 px-6 py-3.5 text-xs font-bold uppercase transition-all duration-150 border-t-2 border-x rounded-t-md cursor-pointer ${
          activeTab === 'create'
            ? 'bg-gradient-to-r from-[#8CC63F] to-[#7BB52F] text-white border-b-transparent border-t-[#8CC63F] border-x-gray-200 shadow-sm'
            : 'bg-white text-gray-500 hover:text-gray-800 hover:bg-gray-50 border-transparent border-b-gray-200'
        }`}
      >
        <UserPlus className="w-4.5 h-4.5" />
        <span>Nuevo Cliente</span>
      </button>

      <button
        onClick={() => onChange('list')}
        className={`flex items-center gap-2 px-6 py-3.5 text-xs font-bold uppercase transition-all duration-150 border-t-2 border-x rounded-t-md cursor-pointer ${
          activeTab === 'list'
            ? 'bg-gradient-to-r from-[#8CC63F] to-[#7BB52F] text-white border-b-transparent border-t-[#8CC63F] border-x-gray-200 shadow-sm'
            : 'bg-white text-gray-500 hover:text-gray-800 hover:bg-gray-50 border-transparent border-b-gray-200'
        }`}
      >
        <Users className="w-4.5 h-4.5" />
        <span>Lista De Clientes ({customerCount})</span>
      </button>
    </div>
  );
}
