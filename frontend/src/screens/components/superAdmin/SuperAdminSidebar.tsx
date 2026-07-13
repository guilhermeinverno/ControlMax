import { auth } from '../../../lib/firebase';
import {
  Building2, Users, ChevronRight, ShieldCheck, X,
  DollarSign, Terminal, Layers, ExternalLink
} from 'lucide-react';
import type { SuperAdminMenu, TenantMetrics } from '../../../types/superAdmin';

export interface SuperAdminSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeMenu: SuperAdminMenu;
  setActiveMenu: (menu: SuperAdminMenu) => void;
  setSelectedTenantDetail: (tenant: TenantMetrics | null) => void;
  tenantCount: number;
  userCount: number;
  handleGoToMainApp: () => void;
  handleLogout: () => void;
}

export function SuperAdminSidebar({
  sidebarOpen,
  setSidebarOpen,
  activeMenu,
  setActiveMenu,
  setSelectedTenantDetail,
  tenantCount,
  userCount,
  handleGoToMainApp,
  handleLogout,
}: SuperAdminSidebarProps) {
  const handleMenuClick = (menu: SuperAdminMenu) => {
    setActiveMenu(menu);
    setSelectedTenantDetail(null);
    setSidebarOpen(false);
  };

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 lg:hidden backdrop-blur-xs transition-opacity duration-200"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 w-72 bg-[#0C1224] border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:flex ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>

        <div className="flex flex-col">
          <div className="p-6 border-b border-slate-800/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-600/20">
                <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm uppercase tracking-wider text-white">Control</span>
                  <span className="bg-indigo-500/20 text-indigo-400 text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded-md border border-indigo-500/30">SAAS CORE</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[#8CC63F] font-black text-lg tracking-tight uppercase leading-none">Max</span>
                  <span className="w-2 h-2 rounded-full bg-[#8CC63F] animate-pulse"></span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-4 space-y-1.5">
            <button
              onClick={() => handleMenuClick('overview')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-black tracking-wide uppercase transition-all cursor-pointer ${
                activeMenu === 'overview'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
              }`}
            >
              <span className="flex items-center gap-3">
                <Layers className="w-4 h-4" /> Visão Geral
              </span>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeMenu === 'overview' ? 'rotate-90' : ''}`} />
            </button>

            <button
              onClick={() => handleMenuClick('tenants')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-black tracking-wide uppercase transition-all cursor-pointer ${
                activeMenu === 'tenants'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
              }`}
            >
              <span className="flex items-center gap-3">
                <Building2 className="w-4 h-4" /> Empresas (Tenants)
              </span>
              <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                {tenantCount}
              </span>
            </button>

            <button
              onClick={() => handleMenuClick('users')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-black tracking-wide uppercase transition-all cursor-pointer ${
                activeMenu === 'users'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
              }`}
            >
              <span className="flex items-center gap-3">
                <Users className="w-4 h-4" /> Colaboradores
              </span>
              <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                {userCount}
              </span>
            </button>

            <button
              onClick={() => handleMenuClick('plans')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-black tracking-wide uppercase transition-all cursor-pointer ${
                activeMenu === 'plans'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
              }`}
            >
              <span className="flex items-center gap-3">
                <DollarSign className="w-4 h-4" /> Finanças & Projeções
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => handleMenuClick('logs')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-black tracking-wide uppercase transition-all cursor-pointer ${
                activeMenu === 'logs'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
              }`}
            >
              <span className="flex items-center gap-3">
                <Terminal className="w-4 h-4" /> Live Terminal
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#8CC63F] animate-ping"></span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800/60 bg-[#080D1A]">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md">
              SU
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-white truncate">SaaS Owner</p>
              <p className="text-[10px] text-indigo-400 font-bold truncate">{auth.currentUser?.email || 'gringoeletronica@gmail.com'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleGoToMainApp}
              className="flex items-center justify-center gap-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-extrabold text-[10px] uppercase tracking-wide py-2.5 px-2 rounded-xl transition-all cursor-pointer border border-slate-700/55"
              title="Ir para o Dashboard padrão do tenant administrador"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Ver App
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-1.5 bg-rose-950/45 hover:bg-rose-900 text-rose-300 hover:text-white font-extrabold text-[10px] uppercase tracking-wide py-2.5 px-2 rounded-xl transition-all cursor-pointer border border-rose-900/30"
            >
              <X className="w-3.5 h-3.5" /> Sair
            </button>
          </div>
        </div>

      </aside>
    </>
  );
}
