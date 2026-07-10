import { useState } from 'react';
import type { FormOrButtonEvent } from '../types/reactEvents';
import { Screen } from '../types';
import { useTenant } from '../hooks/useTenant';
import { usePlatformSettings } from '../hooks/usePlatformSettings';
import { RefreshCw, Save } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { PlatformFinancialTab } from './components/platform/PlatformFinancialTab';
import { PlatformGeneralTab } from './components/platform/PlatformGeneralTab';
import { PlatformModulesTab } from './components/platform/PlatformModulesTab';
import { PlatformSecurityTab } from './components/platform/PlatformSecurityTab';
import { PlatformManagementHeader } from './components/platform/PlatformManagementHeader';
import { PlatformManagementAlerts } from './components/platform/PlatformManagementAlerts';
import {
  PlatformManagementSidebar,
  type PlatformTab,
} from './components/platform/PlatformManagementSidebar';
import { PlatformUnauthorizedView } from './components/platform/PlatformUnauthorizedView';

interface PlatformManagementProps {
  onNavigate?: (screen: Screen) => void;
}

export function PlatformManagement({ onNavigate }: PlatformManagementProps) {
  const { tenantId, role, isSuperAdmin, loading: tenantLoading } = useTenant();
  const [activeTab, setActiveTab] = useState<PlatformTab>('general');
  const {
    settings,
    loadingSettings,
    saving,
    successMsg,
    errorMsg,
    handleInputChange,
    handleSave,
  } = usePlatformSettings(tenantId);

  const handleSaveSubmit = async (e: FormOrButtonEvent) => {
    e.preventDefault();
    await handleSave();
  };

  if (tenantLoading || loadingSettings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-[#333333]">
        <div className="w-10 h-10 border-4 border-[#6A008A] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Cargando gestión de plataforma...</p>
      </div>
    );
  }

  const isAuthorized = role === 'admin' || isSuperAdmin;
  if (!isAuthorized) {
    return <PlatformUnauthorizedView onNavigate={onNavigate} />;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden flex flex-col min-h-[600px]">
      <PlatformManagementHeader saving={saving} onSave={() => void handleSave()} />
      <PlatformManagementAlerts successMsg={successMsg} errorMsg={errorMsg} />

      <div className="flex-1 flex flex-col lg:flex-row">
        <PlatformManagementSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <form onSubmit={handleSaveSubmit} className="flex-1 p-6 md:p-8 space-y-8 min-w-0">
          <AnimatePresence mode="wait">
            {activeTab === 'general' ? (
              <PlatformGeneralTab settings={settings} onChange={handleInputChange} />
            ) : null}
            {activeTab === 'financial' ? (
              <PlatformFinancialTab settings={settings} onChange={handleInputChange} />
            ) : null}
            {activeTab === 'modules' ? (
              <PlatformModulesTab settings={settings} onChange={handleInputChange} />
            ) : null}
            {activeTab === 'security' ? (
              <PlatformSecurityTab settings={settings} onChange={handleInputChange} />
            ) : null}
          </AnimatePresence>

          <div className="border-t border-gray-200 pt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onNavigate?.('dashboard')}
              className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-50 border border-gray-200 rounded-xl transition-all uppercase tracking-wide"
            >
              Cerrar Panel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#6A008A] hover:bg-[#52006A] text-white font-extrabold text-xs py-2.5 px-6 rounded-xl flex items-center gap-2 shadow-md transition-all uppercase tracking-wider cursor-pointer disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Guardar Todo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
