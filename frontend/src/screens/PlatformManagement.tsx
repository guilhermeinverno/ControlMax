import { useState } from 'react';
import type { FormOrButtonEvent } from '../types/reactEvents';
import { Screen } from '../types';
import { useTenant } from '../hooks/useTenant';
import { usePlatformSettings } from '../hooks/usePlatformSettings';
import {
  AlertTriangle,
  AppWindow,
  Building2,
  CheckCircle,
  DollarSign,
  Lock,
  RefreshCw,
  Save,
  ShieldAlert,
  Sliders,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { PlatformFinancialTab } from './components/platform/PlatformFinancialTab';
import { PlatformGeneralTab } from './components/platform/PlatformGeneralTab';
import { PlatformModulesTab } from './components/platform/PlatformModulesTab';
import { PlatformSecurityTab } from './components/platform/PlatformSecurityTab';

interface PlatformManagementProps {
  onNavigate?: (screen: Screen) => void;
}

type PlatformTab = 'general' | 'financial' | 'modules' | 'security';

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
    return (
      <div className="bg-white border border-red-200 rounded-xl p-8 max-w-lg mx-auto text-center shadow-md">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4 animate-bounce" />
        <h3 className="text-base font-black text-red-600 uppercase tracking-wide">Acceso Restringido</h3>
        <p className="text-xs text-gray-650 mt-2">
          Lo sentimos, el panel de <strong>Gestión de la Plataforma</strong> está reservado únicamente para Administradores de Cuenta y propietarios de licencias SaaS.
        </p>
        <button
          onClick={() => onNavigate && onNavigate('dashboard')}
          className="mt-6 bg-gray-800 hover:bg-gray-900 text-white font-bold text-xs py-2 px-4 rounded-lg uppercase tracking-wider transition-all cursor-pointer"
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden flex flex-col min-h-[600px]">
      <div className="bg-[#6A008A] p-5 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#52006A] shadow-inner relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 translate-y-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

        <div className="flex items-start gap-3.5 relative z-10">
          <div className="bg-white/10 p-2.5 rounded-xl border border-white/20">
            <Sliders className="w-6 h-6 text-[#8CC63F]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black uppercase tracking-wider text-white">Gestión de la Plataforma</h2>
              <span className="bg-[#8CC63F] text-[#4A0063] font-black text-[9px] px-2 py-0.5 rounded-full border border-white/20 uppercase tracking-widest">
                Admin Console
              </span>
            </div>
            <p className="text-xs text-purple-100/90 mt-1 font-medium">
              Ajustes globales de marca, topes de operación, módulos del ecosistema e índices de seguridad de su empresa.
            </p>
          </div>
        </div>

        <button
          onClick={() => void handleSave()}
          disabled={saving}
          className="bg-[#8CC63F] hover:bg-[#7cb337] active:scale-98 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all uppercase tracking-wider shrink-0 relative z-10 cursor-pointer disabled:opacity-50 border border-white/10"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Guardar Configuración</span>
        </button>
      </div>

      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-50 border-b border-emerald-100 text-emerald-800 px-5 py-3.5 text-xs font-bold flex items-center gap-2.5 shadow-sm"
          >
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>{successMsg}</span>
          </motion.div>
        )}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-rose-50 border-b border-rose-100 text-rose-800 px-5 py-3.5 text-xs font-bold flex items-center gap-2.5 shadow-sm"
          >
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col lg:flex-row">
        <aside className="w-full lg:w-64 bg-gray-50 border-r border-gray-200 shrink-0 flex flex-row lg:flex-col py-1.5 lg:py-4 px-2.5 gap-1.5 lg:gap-2 overflow-x-auto lg:overflow-x-visible">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wide transition-all w-full whitespace-nowrap cursor-pointer text-left ${
              activeTab === 'general'
                ? 'bg-purple-100 text-[#6A008A] font-black'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span>1. Datos de Identidad</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('financial')}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wide transition-all w-full whitespace-nowrap cursor-pointer text-left ${
              activeTab === 'financial'
                ? 'bg-purple-100 text-[#6A008A] font-black'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <DollarSign className="w-4 h-4 shrink-0" />
            <span>2. Reglas Financieras</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('modules')}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wide transition-all w-full whitespace-nowrap cursor-pointer text-left ${
              activeTab === 'modules'
                ? 'bg-purple-100 text-[#6A008A] font-black'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <AppWindow className="w-4 h-4 shrink-0" />
            <span>3. Módulos & Alertas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wide transition-all w-full whitespace-nowrap cursor-pointer text-left ${
              activeTab === 'security'
                ? 'bg-purple-100 text-[#6A008A] font-black'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <Lock className="w-4 h-4 shrink-0" />
            <span>4. Control & Horario</span>
          </button>
        </aside>

        <form onSubmit={handleSaveSubmit} className="flex-1 p-6 md:p-8 space-y-8 min-w-0">
          <AnimatePresence mode="wait">
            {activeTab === 'general' && (
              <PlatformGeneralTab settings={settings} onChange={handleInputChange} />
            )}
            {activeTab === 'financial' && (
              <PlatformFinancialTab settings={settings} onChange={handleInputChange} />
            )}
            {activeTab === 'modules' && (
              <PlatformModulesTab settings={settings} onChange={handleInputChange} />
            )}
            {activeTab === 'security' && (
              <PlatformSecurityTab settings={settings} onChange={handleInputChange} />
            )}
          </AnimatePresence>

          <div className="border-t border-gray-200 pt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('dashboard')}
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
