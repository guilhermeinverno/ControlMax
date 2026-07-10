import type { CreditRequestTab } from '../../../utils/creditRequestFilters';

const TAB_LABELS: Record<CreditRequestTab, string> = {
  all: 'Todos',
  pending: 'Pendentes',
  approved: 'Aprovadas',
  rejected: 'Rejeitadas',
  auto: 'Automáticas',
};

interface CreditRequestsTabBarProps {
  activeTab: CreditRequestTab;
  pendingCount: number;
  onTabChange: (tab: CreditRequestTab) => void;
}

export function CreditRequestsTabBar({ activeTab, pendingCount, onTabChange }: CreditRequestsTabBarProps) {
  const tabs: CreditRequestTab[] = ['all', 'pending', 'approved', 'rejected', 'auto'];

  return (
    <div className="flex border-b border-gray-200 bg-white overflow-x-auto shrink-0 scrollbar-none scroll-smooth">
      {tabs.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`flex-1 min-w-[90px] text-center py-3 px-2 text-xs font-semibold uppercase tracking-wider relative whitespace-nowrap cursor-pointer transition-colors ${
              isActive ? 'text-[#6B21A8] font-bold' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>{TAB_LABELS[tab]}</span>
            {tab === 'pending' && pendingCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-purple-100 text-[#6B21A8] text-[9px] font-black rounded-full border border-purple-200">
                {pendingCount}
              </span>
            )}
            {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6B21A8]" />}
          </button>
        );
      })}
    </div>
  );
}
