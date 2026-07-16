import {
  AlertOctagon,
  BarChart3,
  Calculator,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Crosshair,
  Home,
  ShieldCheck,
  UserCog,
  Users,
  Camera,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  Clock,
  Key,
  Settings,
  LogOut,
  Smartphone,
  Shield,
} from 'lucide-react';
import type { Screen } from '../../../types';
import { signOut } from 'firebase/auth';
import { auth } from '../../../lib/firebase';

interface LayoutMobileDrawerProps {
  drawerOpen: boolean;
  setDrawerOpen: (value: boolean) => void;
  showSuperAdmin: boolean;
  role?: string;
  currentScreen: Screen;
  expandedMenus: Record<string, boolean>;
  toggleMenu: (menuId: string) => void;
  nav: (screen: Screen) => void;
}

export function LayoutMobileDrawer({
  drawerOpen,
  setDrawerOpen,
  showSuperAdmin,
  role,
  currentScreen,
  expandedMenus,
  toggleMenu,
  nav,
}: LayoutMobileDrawerProps) {
  const isCollector = role === 'collector';

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <>
      {drawerOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 transition-opacity lg:hidden" onClick={() => setDrawerOpen(false)} />
      )}

      <div
        className={`fixed top-0 left-0 bottom-0 w-[290px] bg-white z-50 transform transition-transform duration-300 ease-in-out border-r border-gray-200 shadow-2xl overflow-y-auto flex flex-col lg:hidden ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {isCollector ? (
          /* REPLICATED TRY CONTROLLER LAYOUT FOR VENDEDOR / COLLECTOR */
          <div className="flex-1 flex flex-col bg-white">
            {/* Purple banner section */}
            <div className="bg-[#6A008A] pt-8 pb-14 px-4 relative flex flex-col items-center select-none shrink-0">
              {/* Logo / Title in style of screenshot */}
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center">
                  <span className="text-white font-black text-2xl tracking-tight uppercase">Control</span>
                  <div className="relative">
                    <span className="text-[#8CC63F] font-black text-2xl tracking-tight uppercase ml-1">Max</span>
                    <span className="absolute -top-1 -right-4 bg-[#8CC63F] rounded-full p-0.5 flex items-center justify-center shadow-md w-4 h-4 border border-white">
                      <Check className="w-2.5 h-2.5 text-white stroke-[4.5]" />
                    </span>
                  </div>
                </div>
                <span className="text-white/80 text-[10px] font-bold uppercase tracking-wider mt-1.5 opacity-90">Painel do Vendedor</span>
              </div>
            </div>

            {/* Overlapping top cards */}
            <div className="px-3 -mt-8 relative z-10 grid grid-cols-3 gap-1.5 mb-6 shrink-0">
              <button
                onClick={() => { nav('worker-profile'); setDrawerOpen(false); }}
                className="bg-white rounded-xl py-3 px-1 shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:bg-slate-50 border border-slate-100 flex flex-col items-center justify-between text-center transition-all active:scale-95 cursor-pointer h-[86px]"
              >
                <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center text-[#6A008A] shrink-0">
                  <Smartphone className="w-5 h-5 stroke-[2]" />
                </div>
                <span className="text-[9px] font-black text-slate-800 leading-tight">Meu perfil</span>
              </button>

              <button
                onClick={() => { nav('close-box'); setDrawerOpen(false); }}
                className="bg-white rounded-xl py-3 px-1 shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:bg-slate-50 border border-slate-100 flex flex-col items-center justify-between text-center transition-all active:scale-95 cursor-pointer h-[86px]"
              >
                <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center text-[#6A008A] shrink-0">
                  <Calculator className="w-5 h-5 stroke-[2]" />
                </div>
                <span className="text-[9px] font-black text-slate-800 leading-tight">Fechamento de Caixa</span>
              </button>

              <button
                onClick={() => { nav('insurance'); setDrawerOpen(false); }}
                className="bg-white rounded-xl py-3 px-1 shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:bg-slate-50 border border-slate-100 flex flex-col items-center justify-between text-center transition-all active:scale-95 cursor-pointer h-[86px]"
              >
                <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center text-[#6A008A] shrink-0">
                  <Shield className="w-5 h-5 stroke-[2]" />
                </div>
                <span className="text-[9px] font-black text-slate-800 leading-tight">Seguro</span>
              </button>
            </div>

            {/* List Menu Items styled perfectly matching the screenshot */}
            <div className="flex-1 px-4 flex flex-col space-y-1.5 pb-6 overflow-y-auto">
              <button
                onClick={() => { nav('company-list'); setDrawerOpen(false); }}
                className="flex items-center text-left py-2 px-3 rounded-xl hover:bg-purple-50 transition-colors w-full cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-[#6A008A] flex items-center justify-center text-white mr-3.5 shrink-0 group-hover:scale-105 transition-transform">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-black text-slate-700 tracking-wide">Ver todos os clientes</span>
              </button>

              <button
                onClick={() => { nav('forms'); setDrawerOpen(false); }}
                className="flex items-center text-left py-2 px-3 rounded-xl hover:bg-purple-50 transition-colors w-full cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-[#6A008A] flex items-center justify-center text-white mr-3.5 shrink-0 group-hover:scale-105 transition-transform">
                  <Camera className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-black text-slate-700 tracking-wide">Imagens</span>
              </button>

              <button
                onClick={() => { nav('bc-transfers'); setDrawerOpen(false); }}
                className="flex items-center text-left py-2 px-3 rounded-xl hover:bg-purple-50 transition-colors w-full cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-[#6A008A] flex items-center justify-center text-white mr-3.5 shrink-0 group-hover:scale-105 transition-transform">
                  <ArrowLeftRight className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-black text-slate-700 tracking-wide">Transferências</span>
              </button>

              <button
                onClick={() => { nav('new-expense'); setDrawerOpen(false); }}
                className="flex items-center text-left py-2 px-3 rounded-xl hover:bg-purple-50 transition-colors w-full cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-[#6A008A] flex items-center justify-center text-white mr-3.5 shrink-0 group-hover:scale-105 transition-transform">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-black text-slate-700 tracking-wide">Despesas ou rendas</span>
              </button>

              <button
                onClick={() => { nav('sales'); setDrawerOpen(false); }}
                className="flex items-center text-left py-2 px-3 rounded-xl hover:bg-purple-50 transition-colors w-full cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-[#6A008A] flex items-center justify-center text-white mr-3.5 shrink-0 group-hover:scale-105 transition-transform">
                  <ClipboardList className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-black text-slate-700 tracking-wide">Pre vendas</span>
              </button>

              <button
                onClick={() => { nav('new-expense'); setDrawerOpen(false); }}
                className="flex items-center text-left py-2 px-3 rounded-xl hover:bg-purple-50 transition-colors w-full cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-[#6A008A] flex items-center justify-center text-white mr-3.5 shrink-0 group-hover:scale-105 transition-transform">
                  <TrendingDown className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-black text-slate-700 tracking-wide">Pré despesas</span>
              </button>

              <button
                onClick={() => { nav('sales'); setDrawerOpen(false); }}
                className="flex items-center text-left py-2 px-3 rounded-xl hover:bg-purple-50 transition-colors w-full cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-[#6A008A] flex items-center justify-center text-white mr-3.5 shrink-0 group-hover:scale-105 transition-transform">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-black text-slate-700 tracking-wide">Vendas temporais</span>
              </button>

              <button
                onClick={() => { nav('auto-keys'); setDrawerOpen(false); }}
                className="flex items-center text-left py-2 px-3 rounded-xl hover:bg-purple-50 transition-colors w-full cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-[#6A008A] flex items-center justify-center text-white mr-3.5 shrink-0 group-hover:scale-105 transition-transform">
                  <Key className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-black text-slate-700 tracking-wide">Histórico de chaves</span>
              </button>

              <button
                onClick={() => { nav('device-list'); setDrawerOpen(false); }}
                className="flex items-center text-left py-2 px-3 rounded-xl hover:bg-purple-50 transition-colors w-full cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-[#6A008A] flex items-center justify-center text-white mr-3.5 shrink-0 group-hover:scale-105 transition-transform">
                  <Settings className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-black text-slate-700 tracking-wide">Configuração</span>
              </button>

              {/* Sair list item from screenshot */}
              <button
                onClick={() => { handleLogout(); setDrawerOpen(false); }}
                className="flex items-center text-left py-2.5 px-3 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors w-full cursor-pointer group mt-4 border-t border-slate-100"
              >
                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white mr-3.5 shrink-0 group-hover:scale-105 transition-transform">
                  <LogOut className="w-4 h-4 text-white ml-0.5" />
                </div>
                <span className="text-xs font-black text-red-600 tracking-wide">Sair</span>
              </button>
            </div>
          </div>
        ) : (
          /* STANDARD LAYOUT FOR ADMINS / GESTORES */
          <>
            <div className="bg-[#6A008A] h-[64px] flex items-center justify-between px-4 shrink-0 border-b border-[#52006A]">
              <div className="flex items-center space-x-2">
                <span className="text-white font-black text-lg tracking-tight">ControlMax</span>
                <div className="bg-[#8CC63F] rounded-full p-0.5 flex items-center justify-center shadow-sm w-4.5 h-4.5">
                  <Check className="w-2.5 h-2.5 text-white stroke-[3.5]" />
                </div>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="text-white p-1 focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <nav className="flex-1 flex flex-col text-sm text-gray-700 py-2">
              {showSuperAdmin && (
                <button onClick={() => nav('superadmin')} className="flex items-center px-4 py-3 border-b border-gray-100 bg-purple-50 text-[#6A008A] font-bold hover:bg-purple-100 w-full">
                  <ShieldCheck className="w-5 h-5 mr-3" />
                  <span>Panel Super Admin</span>
                </button>
              )}

              <button onClick={() => nav('dashboard')} className="flex items-center px-4 py-3 border-b border-gray-100 hover:bg-gray-50 text-gray-800 font-semibold w-full">
                <Home className="w-5 h-5 text-[#6A008A] mr-3" />
                <span>Inicio / Dashboard</span>
              </button>

              <button onClick={() => nav('statistics')} className="flex items-center px-4 py-3 border-b border-gray-100 hover:bg-gray-50 text-gray-800 font-semibold w-full">
                <BarChart3 className="w-5 h-5 text-[#6A008A] mr-3" />
                <span>Estadísticas</span>
              </button>

              {(role === 'admin' || role === 'supervisor') && (
                <button
                  onClick={() => nav('ai-assistant')}
                  className={`flex items-center px-4 py-3 border-b border-gray-100 hover:bg-purple-50 transition-colors w-full text-left ${
                    currentScreen === 'ai-assistant' ? 'bg-purple-50 text-[#6B21A8]' : 'text-gray-800'
                  }`}
                >
                  <span className="text-lg mr-3">🤖</span>
                  <span className="text-sm font-bold text-[#6B21A8]">Assistente IA</span>
                  <span className="ml-auto bg-[#84CC16] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">NOVO</span>
                </button>
              )}

              <div className="border-b border-gray-100">
                <button
                  onClick={() => toggleMenu('ventas')}
                  className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${expandedMenus['ventas'] ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-center font-semibold text-gray-800">
                    <CircleDollarSign className="w-5 h-5 text-[#6A008A] mr-3" />
                    <span>Ventas</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedMenus['ventas'] ? 'rotate-180' : ''}`} />
                </button>
                {expandedMenus['ventas'] && (
                  <div className="bg-gray-50/50 flex flex-col py-1 text-xs text-gray-600 pl-4 border-l-2 border-[#6A008A]">
                    <button onClick={() => nav('new-income')} className="text-left px-8 py-2.5 hover:bg-purple-50 hover:text-[#6A008A]">Ingresos</button>
                    <button onClick={() => nav('new-expense')} className="text-left px-8 py-2.5 hover:bg-purple-50 hover:text-[#6A008A]">Gastos</button>
                    <button onClick={() => nav('sales')} className="text-left px-8 py-2.5 hover:bg-purple-50 hover:text-[#6A008A]">Ventas</button>
                    <button onClick={() => nav('open-box')} className="text-left px-8 py-2.5 hover:bg-purple-50 hover:text-[#6A008A]">Abrir Caixa</button>
                    <button onClick={() => nav('close-box')} className="text-left px-8 py-2.5 hover:bg-purple-50 hover:text-[#6A008A]">Fechar Caixa (Fechamento)</button>
                    <button onClick={() => nav('box-summary')} className="text-left px-8 py-2.5 hover:bg-purple-50 hover:text-[#6A008A]">Resumen</button>
                    <button onClick={() => nav('auto-keys')} className="text-left px-8 py-2.5 hover:bg-purple-50 hover:text-[#6A008A]">Crear llave</button>
                    <button onClick={() => nav('collection-cleaning')} className="text-left px-8 py-2.5 hover:bg-purple-50 hover:text-[#6A008A]">Limpieza de cobro</button>
                    <button onClick={() => nav('period-summary')} className="text-left px-8 py-2.5 hover:bg-purple-50 hover:text-[#6A008A]">Resumen por periodo</button>
                    <button onClick={() => nav('mass-box-opening')} className="text-left px-8 py-2.5 hover:bg-purple-50 hover:text-[#6A008A]">Apertura masiva de cajas</button>
                    <button onClick={() => nav('transfer-sales')} className="text-left px-8 py-2.5 hover:bg-purple-50 hover:text-[#6A008A]">Transferencia masiva</button>
                  </div>
                )}
              </div>

              <div className="border-b border-gray-100">
                <button
                  onClick={() => toggleMenu('centros')}
                  className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${expandedMenus['centros'] ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-center font-semibold text-gray-800">
                    <Crosshair className="w-5 h-5 text-[#6A008A] mr-3" />
                    <span>Centros de negócios</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedMenus['centros'] ? 'rotate-180' : ''}`} />
                </button>
                {expandedMenus['centros'] && (
                  <div className="bg-gray-50/50 flex flex-col py-1 text-xs text-gray-600 pl-4 border-l-2 border-[#6A008A] max-h-[350px] overflow-y-auto">
                    <button onClick={() => nav('bc-incomes')} className="text-left px-8 py-2.5 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-100/50">Ingresos</button>
                    <button onClick={() => nav('bc-expenses')} className="text-left px-8 py-2.5 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-100/50">Egresos</button>
                    <button onClick={() => nav('bc-transfers')} className="text-left px-8 py-2.5 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-100/50">Transferencia de dinero</button>
                    <button onClick={() => nav('bc-approvals')} className="text-left px-8 py-2.5 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-100/50">Aprobar transferencias</button>
                    <button onClick={() => nav('open-box')} className="text-left px-8 py-2.5 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-100/50 font-semibold text-[#6A008A]">Abrir Caixa</button>
                    <button onClick={() => nav('close-box')} className="text-left px-8 py-2.5 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-100/50 font-semibold text-[#6A008A]">Fechar Caixa (Fechamento)</button>
                    <button onClick={() => nav('box-summary')} className="text-left px-8 py-2.5 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-100/50">Resumen</button>
                    <button onClick={() => nav('bc-map')} className="text-left px-8 py-2.5 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-100/50">Mapa</button>
                    <button onClick={() => nav('sales')} className="text-left px-8 py-2.5 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-100/50">Facturación</button>
                    <button onClick={() => nav('credit-requests')} className="text-left px-8 py-2.5 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-100/50">Aprobaciones</button>
                    <button onClick={() => nav('period-summary')} className="text-left px-8 py-2.5 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-100/50">Resumen por periodo</button>
                    <button onClick={() => nav('mass-box-opening')} className="text-left px-8 py-2.5 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-100/50">Cierre masivo de cajas</button>
                    <button onClick={() => nav('transfer-sales')} className="text-left px-8 py-2.5 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-100/50">Traslado de unidades</button>
                    <button onClick={() => nav('insurance')} className="text-left px-8 py-2.5 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-100/50">Seguros</button>
                    <button onClick={() => nav('finance')} className="text-left px-8 py-2.5 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-100/50">Finança</button>
                    <button onClick={() => nav('business-centers')} className="text-left px-8 py-2.5 hover:bg-purple-50 hover:text-[#6A008A] font-bold">⚙ Configuración de Centros</button>
                  </div>
                )}
              </div>

              <div className="border-b border-gray-100">
                <button
                  onClick={() => toggleMenu('admin')}
                  className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${expandedMenus['admin'] ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-center font-semibold text-gray-800">
                    <UserCog className="w-5 h-5 text-[#6A008A] mr-3" />
                    <span>Administración</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedMenus['admin'] ? 'rotate-180' : ''}`} />
                </button>
                {expandedMenus['admin'] && (
                  <div className="bg-gray-50/50 flex flex-col py-1 text-xs text-gray-600 pl-4 border-l-2 border-[#6A008A]">
                    <button onClick={() => nav('platform-management')} className="text-left px-8 py-2.5 font-bold text-[#6A008A] hover:bg-purple-50">⚙ Gestión de la Plataforma</button>
                    <button onClick={() => nav('user-list')} className="text-left px-8 py-2.5 hover:bg-purple-50 hover:text-[#6A008A]">Usuarios</button>
                    {(role === 'admin' || role === 'supervisor') && (
                      <button onClick={() => nav('collector-map')} className="text-left px-8 py-2.5 hover:bg-purple-50 hover:text-[#6A008A]">Mapa de Cobradores</button>
                    )}
                    <button onClick={() => nav('device-list')} className="text-left px-8 py-2.5 hover:bg-purple-50 hover:text-[#6A008A]">Dispositivos</button>
                    <button onClick={() => nav('company-list')} className="text-left px-8 py-2.5 hover:bg-purple-50 hover:text-[#6A008A]">Clientes / Clientes</button>
                    {(role === 'admin' || role === 'supervisor') && (
                      <>
                        <button onClick={() => nav('forms')} className="text-left px-8 py-2.5 hover:bg-purple-50 hover:text-[#6A008A] flex items-center gap-2">
                          <ClipboardList className="w-3.5 h-3.5" />
                          Formularios Dinámicos
                        </button>
                        <button onClick={() => nav('holidays')} className="text-left px-8 py-2.5 hover:bg-purple-50 hover:text-[#6A008A] flex items-center gap-2">
                          <CalendarDays className="w-3.5 h-3.5" />
                          Feriados / Calendario
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="border-b border-gray-100">
                <button
                  onClick={() => toggleMenu('reportes')}
                  className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${expandedMenus['reportes'] ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-center font-semibold text-gray-800">
                    <Calculator className="w-5 h-5 text-[#6A008A] mr-3" />
                    <span>Reportes</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedMenus['reportes'] ? 'rotate-180' : ''}`} />
                </button>
                {expandedMenus['reportes'] && (
                  <div className="bg-gray-50/50 flex flex-col py-1 text-xs text-gray-600 pl-4 border-l-2 border-[#6A008A]">
                    <button onClick={() => nav('performance')} className="text-left px-8 py-2.5 hover:bg-purple-50 hover:text-[#6A008A]">Desempeño</button>
                    <button onClick={() => nav('statistics')} className="text-left px-8 py-2.5 hover:bg-purple-50 hover:text-[#6A008A]">Estadísticas</button>
                  </div>
                )}
              </div>

              <button
                onClick={() => nav('dashboard')}
                className="flex items-center px-4 py-3 bg-[#4B8528] active:bg-[#3B7A24] text-white font-bold transition-colors w-full mt-auto animate-pulse"
              >
                <AlertOctagon className="w-5 h-5 mr-3" />
                <span>Novedades</span>
              </button>
            </nav>
          </>
        )}
      </div>
    </>
  );
}
