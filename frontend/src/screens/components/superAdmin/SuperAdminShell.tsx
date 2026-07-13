import { AlertTriangle, RefreshCw, Menu, X } from 'lucide-react';
import { SKELETON_CARD_KEYS } from '../../../constants/placeholders';
import { AIVoiceAssistant } from '../AIVoiceAssistant';
import type { SuperAdminMenu } from '../../../types/superAdmin';
import type { useSuperAdminData } from '../../../hooks/useSuperAdminData';
import { SuperAdminSidebar } from './SuperAdminSidebar';
import { SuperAdminTabPanels } from './SuperAdminTabPanels';
import { SuperAdminTenantDrawer } from './SuperAdminTenantDrawer';

type SuperAdminData = ReturnType<typeof useSuperAdminData>;

interface SuperAdminShellProps extends SuperAdminData {
  activeMenu: SuperAdminMenu;
  setActiveMenu: (menu: SuperAdminMenu) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function SuperAdminShell({
  activeMenu,
  setActiveMenu,
  sidebarOpen,
  setSidebarOpen,
  tenants,
  users,
  loading,
  refreshing,
  error,
  setError,
  selectedTenantDetail,
  setSelectedTenantDetail,
  handleRefresh,
  handleLogout,
  handleGoToMainApp,
  handleImpersonate,
  handleToggleTenantActive,
  ...tabData
}: SuperAdminShellProps) {
  return (
    <div className="flex h-screen bg-[#060913] text-slate-100 font-sans overflow-hidden">

      <SuperAdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        setSelectedTenantDetail={setSelectedTenantDetail}
        tenantCount={tenants.length}
        userCount={users.length}
        handleGoToMainApp={handleGoToMainApp}
        handleLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col bg-[#060913] min-w-0 overflow-y-auto relative">

        <header className="h-[72px] bg-[#0C1224] border-b border-slate-800/80 px-4 lg:px-8 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2 lg:gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-[11px] font-black tracking-widest text-slate-400 uppercase hidden sm:inline-block">Status Operacional</span>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2.5 py-1 rounded-full font-black flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="hidden xs:inline">FIRESTORE</span> ONLINE & SINCRO
            </span>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-[11px] lg:text-xs py-1.5 px-2.5 lg:py-2 lg:px-3.5 rounded-xl border border-slate-700 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden xs:inline">Sincronizar</span>
            </button>
            <span className="text-[10px] lg:text-xs font-mono text-slate-400">{new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
          </div>
        </header>

        {error && (
          <div className="m-8 bg-rose-950/30 border border-rose-900/60 text-rose-300 rounded-2xl p-4 flex items-center justify-between text-sm shadow-sm animate-in fade-in duration-200">
            <span className="flex items-center gap-2.5">
              <AlertTriangle className="text-rose-500 shrink-0" size={18} />
              <span className="font-medium text-xs">{error}</span>
            </span>
            <button onClick={() => setError(null)} className="text-rose-400 hover:bg-rose-950/60 p-1 rounded-lg cursor-pointer">
              <X size={16} />
            </button>
          </div>
        )}

        <div className="p-8 space-y-8 flex-1">

          {loading && !refreshing ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {SKELETON_CARD_KEYS.slice(0, 4).map((key) => (
                  <div key={key} className="bg-[#0C1224] rounded-2xl border border-slate-800 p-6 h-32 animate-pulse flex flex-col justify-between" />
                ))}
              </div>
              <div className="bg-[#0C1224] rounded-2xl border border-slate-800 p-8 h-96 animate-pulse" />
            </div>
          ) : (
            <SuperAdminTabPanels
              activeMenu={activeMenu}
              tenants={tenants}
              users={users}
              loading={loading}
              refreshing={refreshing}
              error={error}
              setError={setError}
              selectedTenantDetail={selectedTenantDetail}
              setSelectedTenantDetail={setSelectedTenantDetail}
              handleRefresh={handleRefresh}
              handleLogout={handleLogout}
              handleGoToMainApp={handleGoToMainApp}
              handleImpersonate={handleImpersonate}
              handleToggleTenantActive={handleToggleTenantActive}
              {...tabData}
            />
          )}

        </div>

        <SuperAdminTenantDrawer
          selectedTenantDetail={selectedTenantDetail}
          setSelectedTenantDetail={setSelectedTenantDetail}
          users={users}
          handleImpersonate={handleImpersonate}
          handleToggleTenantActive={handleToggleTenantActive}
        />

        <AIVoiceAssistant language="pt" />

      </main>
    </div>
  );
}
