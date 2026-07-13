import { CheckSquare, FileText, Plus } from 'lucide-react';

type FormsTab = 'forms' | 'responses' | 'builder';

interface FormsTabNavProps {
  activeTab: FormsTab;
  isAdminOrSupervisor: boolean;
  onTabChange: (tab: FormsTab) => void;
}

function tabClassName(isActive: boolean) {
  return `flex items-center gap-2 px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
    isActive ? 'border-purple-700 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-700'
  }`;
}

export function FormsTabNav({ activeTab, isAdminOrSupervisor, onTabChange }: FormsTabNavProps) {
  return (
    <div className="flex border-b border-gray-200">
      <button onClick={() => onTabChange('forms')} className={tabClassName(activeTab === 'forms')}>
        <FileText className="w-4 h-4" />
        <span>Formularios</span>
      </button>
      <button onClick={() => onTabChange('responses')} className={tabClassName(activeTab === 'responses')}>
        <CheckSquare className="w-4 h-4" />
        <span>Respuestas</span>
      </button>
      {isAdminOrSupervisor ? (
        <button onClick={() => onTabChange('builder')} className={tabClassName(activeTab === 'builder')}>
          <Plus className="w-4 h-4" />
          <span>Criar Formulário</span>
        </button>
      ) : null}
    </div>
  );
}
