import { AppWindow, Building2, DollarSign, Lock } from 'lucide-react';

export type PlatformTab = 'general' | 'financial' | 'modules' | 'security';

interface PlatformManagementSidebarProps {
  activeTab: PlatformTab;
  onTabChange: (tab: PlatformTab) => void;
}

const TABS: { id: PlatformTab; icon: typeof Building2; label: string }[] = [
  { id: 'general', icon: Building2, label: '1. Datos de Identidad' },
  { id: 'financial', icon: DollarSign, label: '2. Reglas Financieras' },
  { id: 'modules', icon: AppWindow, label: '3. Módulos & Alertas' },
  { id: 'security', icon: Lock, label: '4. Control & Horario' },
];

export function PlatformManagementSidebar({ activeTab, onTabChange }: PlatformManagementSidebarProps) {
  return (
    <aside className="w-full lg:w-64 bg-gray-50 border-r border-gray-200 shrink-0 flex flex-row lg:flex-col py-1.5 lg:py-4 px-2.5 gap-1.5 lg:gap-2 overflow-x-auto lg:overflow-x-visible">
      {TABS.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onTabChange(id)}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wide transition-all w-full whitespace-nowrap cursor-pointer text-left ${
            activeTab === id
              ? 'bg-purple-100 text-[#6A008A] font-black'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
          }`}
        >
          <Icon className="w-4 h-4 shrink-0" />
          <span>{label}</span>
        </button>
      ))}
    </aside>
  );
}
