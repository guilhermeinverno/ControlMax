import { useState, type ReactNode } from 'react';
import { 
  Menu, User, Home, CircleDollarSign, Crosshair, 
  UserCog, Calculator, AlertOctagon, ChevronDown, ChevronRight, MessageCircle, LogOut, ShieldCheck, Check, Users,
  BarChart3, Download, Smartphone
} from 'lucide-react';
import { Screen } from '../../types';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import { useTenant } from '../../hooks/useTenant';
import { useLocation } from '../../hooks/useLocation';
import { useLayoutUi } from '../../hooks/useLayoutUi';
import { AIVoiceAssistant } from './AIVoiceAssistant';
import { LayoutMobileDrawer } from './layout/LayoutMobileDrawer';
import { layoutRoleLabel } from '../../utils/statusLabels';

interface LayoutProps {
  children: ReactNode;
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  isSuperAdmin?: boolean;
}

export function Layout({ children, currentScreen, onNavigate, isSuperAdmin }: LayoutProps) {
  const { role } = useTenant();
  useLocation(); // Rastreamento automático quando caixa aberta
  const userEmail = auth.currentUser?.email || '';
  const currentEmail = userEmail.toLowerCase();
  const isSuperByEmail = currentEmail === 'maildojg@gmail.com';
  const showSuperAdmin = isSuperAdmin || isSuperByEmail;
  const displayRole = layoutRoleLabel(role, showSuperAdmin);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    ventas: true,
  });
  const {
    activeDropdown,
    setActiveDropdown,
    showInstallBanner,
    setShowInstallBanner,
    handleInstallClick,
    handleDropdownClick,
    impersonatedTenantId,
    handleExitImpersonation,
  } = useLayoutUi();

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  const nav = (screen: Screen) => {
    onNavigate(screen);
    setDrawerOpen(false);
    setActiveDropdown(null);
  };

  const handleLogout = () => {
    signOut(auth);
  };
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col font-sans text-[#333333]">
      
      {/* Impersonation Banner Alert */}
      {impersonatedTenantId && (
        <div className="bg-amber-500 text-amber-950 px-4 py-2.5 text-center text-xs font-black tracking-wide flex items-center justify-center gap-2 relative z-[9999] shadow-sm border-b border-amber-600/30">
          <span className="animate-pulse">⚠️</span>
          <span>MODO IMPERSONAÇÃO ATIVO: Você está visualizando o sistema como o tenant <span className="underline font-black">{impersonatedTenantId}</span>.</span>
          <button 
            onClick={handleExitImpersonation}
            className="bg-amber-950 text-amber-100 hover:bg-amber-900 hover:text-white px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors ml-4 cursor-pointer shadow-xs border border-amber-800/40"
          >
            Sair e Voltar ao SuperAdmin
          </button>
        </div>
      )}
      
      {/* HEADER: Desktop-first, fully responsive with TRY Controller styling */}
      <header className="h-[64px] flex items-stretch bg-[#6A008A] shrink-0 z-50 relative shadow-md">
        
        {/* Left Section: Logo & Mobile Hamburger */}
        <div className="bg-[#6A008A] flex items-center px-4 lg:px-6 shrink-0 border-r border-white/10">
          {/* Hamburger button visible only on mobile/tablet */}
          <button 
            onClick={() => setDrawerOpen(!drawerOpen)} 
            className="text-white p-1 -ml-1 focus:outline-none lg:hidden hover:opacity-80 transition-opacity mr-3"
          >
            <Menu className="w-7 h-7" />
          </button>

          {/* Logo themed elegantly like TRY Controller but with ControlMax */}
          <div 
            onClick={() => onNavigate('dashboard')}
            className="flex items-center cursor-pointer select-none"
          >
            <div className="flex flex-col items-start leading-tight">
              <span className="text-white font-black text-sm lg:text-base uppercase tracking-wider">Control</span>
              <div className="flex items-center gap-1">
                <span className="text-[#8CC63F] font-black text-lg tracking-tight uppercase leading-none">Max</span>
                <span className="bg-[#8CC63F] rounded-full p-0.5 flex items-center justify-center shadow-sm w-3.5 h-3.5 border border-white">
                  <Check className="w-2.5 h-2.5 text-white stroke-[4.5]" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Section: Desktop-Only Navigation Tabs inside WHITE bar */}
        <div className="hidden lg:flex items-stretch bg-white border-r border-gray-200">
          
          {/* HOME / INICIO */}
          <button
            onClick={() => nav('dashboard')}
            className={`px-5 flex items-center gap-2 transition-colors border-r border-gray-200 hover:bg-gray-50/80 text-xs uppercase font-extrabold ${
              currentScreen === 'dashboard' ? 'bg-gray-100/80 text-[#6A008A]' : 'text-gray-500'
            }`}
            title="Inicio / Dashboard"
          >
            <Home className="w-4.5 h-4.5 text-[#6A008A]" />
            <span>Dashboard</span>
          </button>

          {/* ESTADÍSTICAS */}
          {role !== 'collector' && (
            <button
              onClick={() => nav('statistics')}
              className={`px-5 flex items-center gap-2 transition-colors border-r border-gray-200 hover:bg-gray-50/80 text-xs uppercase font-extrabold ${
                currentScreen === 'statistics' ? 'bg-gray-100/80 text-[#6A008A]' : 'text-gray-500'
              }`}
              title="Estadísticas"
            >
              <BarChart3 className="w-4.5 h-4.5 text-[#6A008A]" />
              <span>Estadísticas</span>
            </button>
          )}

          {/* ASSISTENTE IA */}
          {(role === 'admin' || role === 'supervisor') && (
            <button
              onClick={() => nav('ai-assistant')}
              className={`px-5 flex items-center gap-2 transition-colors border-r border-gray-200 hover:bg-gray-50/80 text-xs uppercase font-extrabold ${
                currentScreen === 'ai-assistant' ? 'bg-gray-100/80 text-[#6A008A]' : 'text-gray-500'
              }`}
              title="Assistente IA"
            >
              <span className="text-base">🤖</span>
              <span>Assistente IA</span>
              <span className="bg-[#84CC16] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-1">
                NOVO
              </span>
            </button>
          )}

          {/* VENTAS DROPDOWN */}
          <div className="relative flex items-stretch border-r border-gray-200">
            <button
              onClick={(e) => handleDropdownClick(e, 'ventas')}
              className={`px-5 flex items-center gap-2 transition-colors text-xs uppercase font-extrabold hover:bg-gray-50/80 ${
                activeDropdown === 'ventas' || ['new-income', 'new-expense', 'sales', 'open-box', 'box-summary', 'auto-keys', 'collection-cleaning', 'period-summary', 'mass-box-opening', 'transfer-sales'].includes(currentScreen)
                  ? 'text-[#6A008A] bg-gray-50/80' 
                  : 'text-gray-600'
              }`}
            >
              <CircleDollarSign className="w-4.5 h-4.5 text-[#6A008A]" />
              <span>Ventas</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {activeDropdown === 'ventas' && (
              <div className="absolute top-[64px] left-0 w-64 bg-white rounded-b-md shadow-xl border-t-2 border-[#6A008A] py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <button onClick={() => nav('new-income')} className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-50 flex items-center justify-between">
                  Ingresos <ChevronRight className="w-3 h-3 text-gray-400" />
                </button>
                <button onClick={() => nav('new-expense')} className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-50 flex items-center justify-between">
                  Gastos <ChevronRight className="w-3 h-3 text-gray-400" />
                </button>
                <button onClick={() => nav('sales')} className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-50 flex items-center justify-between">
                  Ventas <ChevronRight className="w-3 h-3 text-gray-400" />
                </button>
                <button onClick={() => nav('open-box')} className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-50 flex items-center justify-between">
                  Abrir Caixa <ChevronRight className="w-3 h-3 text-gray-400" />
                </button>
                <button onClick={() => nav('close-box')} className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-50 flex items-center justify-between">
                  Fechar Caixa (Fechamento) <ChevronRight className="w-3 h-3 text-gray-400" />
                </button>
                <button onClick={() => nav('box-summary')} className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-50 flex items-center justify-between">
                  Resumen de Caja <ChevronRight className="w-3 h-3 text-gray-400" />
                </button>
                {role !== 'collector' && (
                  <>
                    <button onClick={() => nav('auto-keys')} className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-50 flex items-center justify-between">
                      Crear llave <ChevronRight className="w-3 h-3 text-gray-400" />
                    </button>
                    <button onClick={() => nav('collection-cleaning')} className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-50 flex items-center justify-between">
                      Limpieza de cobro <ChevronRight className="w-3 h-3 text-gray-400" />
                    </button>
                    <button onClick={() => nav('period-summary')} className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-50 flex items-center justify-between">
                      Resumen por periodo <ChevronRight className="w-3 h-3 text-gray-400" />
                    </button>
                    <button onClick={() => nav('mass-box-opening')} className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-50 flex items-center justify-between">
                      Apertura masiva de cajas <ChevronRight className="w-3 h-3 text-gray-400" />
                    </button>
                    <button onClick={() => nav('transfer-sales')} className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#6A008A] flex items-center justify-between">
                      Transferencia masiva <ChevronRight className="w-3 h-3 text-gray-400" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* STANDALONE CLIENTES TAB FOR COLLABORATOR / COLLECTOR */}
          {role === 'collector' && (
            <button
              onClick={() => nav('company-list')}
              className={`px-5 flex items-center gap-2 transition-colors border-r border-gray-200 hover:bg-gray-50/80 text-xs uppercase font-extrabold ${
                currentScreen === 'company-list' ? 'bg-gray-50/80 text-[#6A008A]' : 'text-gray-600'
              }`}
            >
              <Users className="w-4.5 h-4.5 text-[#6A008A]" />
              <span>Clientes</span>
            </button>
          )}

          {/* CENTROS DE NEGOCIOS DROPDOWN */}
          {role !== 'collector' && (
            <div className="relative flex items-stretch border-r border-gray-200">
              <button
                onClick={(e) => handleDropdownClick(e, 'centros')}
                className={`px-5 flex items-center gap-2 transition-colors text-xs uppercase font-extrabold hover:bg-gray-50/80 ${
                  activeDropdown === 'centros' || ['bc-incomes', 'bc-expenses', 'bc-transfers', 'bc-approvals', 'open-box', 'box-summary', 'bc-map', 'sales', 'credit-requests', 'period-summary', 'mass-box-opening', 'transfer-sales', 'insurance', 'finance', 'business-centers'].includes(currentScreen)
                    ? 'text-[#6A008A] bg-gray-50/80' 
                    : 'text-gray-600'
                }`}
              >
                <Crosshair className="w-4.5 h-4.5 text-[#6A008A]" />
                <span>Centros de negocios</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {activeDropdown === 'centros' && (
                <div className="absolute top-[64px] left-0 w-64 bg-white rounded-b-md shadow-xl border-t-2 border-[#6A008A] py-1 z-50 max-h-[80vh] overflow-y-auto">
                  <button onClick={() => nav('bc-incomes')} className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-50 flex items-center justify-between">
                    Ingresos <ChevronRight className="w-3 h-3 text-gray-400" />
                  </button>
                  <button onClick={() => nav('bc-expenses')} className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-50 flex items-center justify-between">
                    Egresos <ChevronRight className="w-3 h-3 text-gray-400" />
                  </button>
                  <button onClick={() => nav('bc-transfers')} className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-50 flex items-center justify-between">
                    Transferencia de dinheiro <ChevronRight className="w-3 h-3 text-gray-400" />
                  </button>
                  <button onClick={() => nav('bc-approvals')} className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-50 flex items-center justify-between">
                    Aprobar transferencias <ChevronRight className="w-3 h-3 text-gray-400" />
                  </button>
                  <button onClick={() => nav('open-box')} className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-50 flex items-center justify-between">
                    Abrir Caixa <ChevronRight className="w-3 h-3 text-[#8CC63F]" />
                  </button>
                  <button onClick={() => nav('close-box')} className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-50 flex items-center justify-between">
                    Fechar Caixa (Fechamento) <ChevronRight className="w-3 h-3 text-[#8CC63F]" />
                  </button>
                  <button onClick={() => nav('box-summary')} className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-50 flex items-center justify-between">
                    Resumen <ChevronRight className="w-3 h-3 text-gray-400" />
                  </button>
                  <button onClick={() => nav('bc-map')} className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-50 flex items-center justify-between">
                    Mapa <ChevronRight className="w-3 h-3 text-gray-400" />
                  </button>
                  <button onClick={() => nav('sales')} className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-50 flex items-center justify-between">
                    Facturación <ChevronRight className="w-3 h-3 text-gray-400" />
                  </button>
                  <button onClick={() => nav('credit-requests')} className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-50 flex items-center justify-between">
                    Aprobaciones <ChevronRight className="w-3 h-3 text-gray-400" />
                  </button>
                  <button onClick={() => nav('period-summary')} className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-50 flex items-center justify-between">
                    Resumen por periodo <ChevronRight className="w-3 h-3 text-gray-400" />
                  </button>
                  <button onClick={() => nav('mass-box-opening')} className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-50 flex items-center justify-between">
                    Cierre masivo de cajas <ChevronRight className="w-3 h-3 text-gray-400" />
                  </button>
                  <button onClick={() => nav('transfer-sales')} className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-50 flex items-center justify-between">
                    Traslado de unidades <ChevronRight className="w-3 h-3 text-gray-400" />
                  </button>
                  <button onClick={() => nav('insurance')} className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-50 flex items-center justify-between">
                    Seguros <ChevronRight className="w-3 h-3 text-gray-400" />
                  </button>
                  <button onClick={() => nav('finance')} className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-50 flex items-center justify-between">
                    Finança <ChevronRight className="w-3 h-3 text-gray-400" />
                  </button>
                  <button onClick={() => nav('business-centers')} className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-purple-50 hover:text-[#6A008A] flex items-center justify-between">
                    ⚙ Configuración de Centros <ChevronRight className="w-3 h-3 text-gray-400" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ADMINISTRACIÓN DROPDOWN */}
          {role !== 'collector' && (
            <div className="relative flex items-stretch border-r border-gray-200">
              <button
                onClick={(e) => handleDropdownClick(e, 'admin')}
                className={`px-5 flex items-center gap-2 transition-colors text-xs uppercase font-extrabold hover:bg-gray-50/80 ${
                  activeDropdown === 'admin' || ['superadmin', 'user-list', 'device-list', 'company-list', 'platform-management'].includes(currentScreen)
                    ? 'text-[#6A008A] bg-gray-50/80' 
                    : 'text-gray-600'
                }`}
              >
                <UserCog className="w-4.5 h-4.5 text-[#6A008A]" />
                <span>Administración</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {activeDropdown === 'admin' && (
                <div className="absolute top-[64px] left-0 w-64 bg-white rounded-b-md shadow-xl border-t-2 border-[#6A008A] py-1 z-50">
                  {showSuperAdmin && (
                    <button onClick={() => nav('superadmin')} className="w-full text-left px-4 py-2 text-xs font-bold text-[#6A008A] hover:bg-purple-100 border-b border-gray-100 flex items-center justify-between">
                      ★ Panel Super Admin <ChevronRight className="w-3 h-3 text-purple-600" />
                    </button>
                  )}
                  <button onClick={() => nav('platform-management')} className="w-full text-left px-4 py-2 text-xs font-bold text-[#6A008A] hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-50 flex items-center justify-between">
                    ⚙ Gestión de la Plataforma <ChevronRight className="w-3 h-3 text-purple-600" />
                  </button>
                  <button onClick={() => nav('user-list')} className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-50 flex items-center justify-between">
                    Gestión de Usuarios <ChevronRight className="w-3 h-3 text-gray-400" />
                  </button>
                  {(role === 'admin' || role === 'supervisor') && (
                    <button onClick={() => nav('collector-map')} className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-50 flex items-center justify-between">
                      Mapa de Cobradores <ChevronRight className="w-3 h-3 text-gray-400" />
                    </button>
                  )}
                  <button onClick={() => nav('device-list')} className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-50 flex items-center justify-between">
                    Gestión de Dispositivos <ChevronRight className="w-3 h-3 text-gray-400" />
                  </button>
                  <button onClick={() => nav('company-list')} className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#6A008A] flex items-center justify-between">
                    Gestión de Clientes <ChevronRight className="w-3 h-3 text-gray-400" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* REPORTES DROPDOWN */}
          {role !== 'collector' && (
            <div className="relative flex items-stretch border-r border-gray-200">
              <button
                onClick={(e) => handleDropdownClick(e, 'reportes')}
                className={`px-5 flex items-center gap-2 transition-colors text-xs uppercase font-extrabold hover:bg-gray-50/80 ${
                  activeDropdown === 'reportes' || ['performance', 'statistics'].includes(currentScreen)
                    ? 'text-[#6A008A] bg-gray-50/80' 
                    : 'text-gray-600'
                }`}
              >
                <Calculator className="w-4.5 h-4.5 text-[#6A008A]" />
                <span>Reportes</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {activeDropdown === 'reportes' && (
                <div className="absolute top-[64px] left-0 w-64 bg-white rounded-b-md shadow-xl border-t-2 border-[#6A008A] py-1 z-50">
                  <button onClick={() => nav('performance')} className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-50 flex items-center justify-between">
                    Reportes de Desempeño <ChevronRight className="w-3 h-3 text-gray-400" />
                  </button>
                  <button onClick={() => nav('statistics')} className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#6A008A] flex items-center justify-between">
                    Estadísticas <ChevronRight className="w-3 h-3 text-gray-400" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* CORE SYSTEM ACTIVE/SYNC BLOCK (Next to Reportes in white section, dark green bg) */}
          <div 
            onClick={() => nav('dashboard')}
            className="bg-[#4D851D] hover:bg-[#3d6b16] px-5 h-full flex items-center justify-center cursor-pointer transition-colors"
            title="Core Sistema Activo / Sincronizado"
          >
            <div className="flex items-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
          </div>

        </div>

        {/* Right Section: Stretches purple background and holds profile */}
        <div className="flex-1 bg-[#6A008A] flex items-center justify-end px-4 lg:px-6 space-x-4">
          <div className="hidden xl:flex flex-col text-right">
            <span className="text-white text-xs font-bold uppercase">{displayRole}</span>
            <span className="text-white/70 text-[10px]">{userEmail}</span>
          </div>

          <button className="text-white p-1.5 hover:opacity-85 focus:outline-none" onClick={() => nav('superadmin')} title="Super Administrador">
            <div className="border-2 border-white/80 rounded-full p-1 bg-white/10 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
          </button>
          
          <button 
            className="text-white p-1 hover:text-red-300 focus:outline-none transition-colors" 
            onClick={handleLogout} 
            title="Cerrar Sesión"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>

      </header>

      {/* BODY CONTENT: Spans the full viewport width on desktop */}
      <main className="flex-1 flex flex-col relative bg-[#F4F4F4] w-full min-h-0">
        <LayoutMobileDrawer
          drawerOpen={drawerOpen}
          setDrawerOpen={setDrawerOpen}
          showSuperAdmin={showSuperAdmin}
          role={role}
          currentScreen={currentScreen}
          expandedMenus={expandedMenus}
          toggleMenu={toggleMenu}
          nav={nav}
        />

        {/* Outer content padding and center alignments */}
        <div className="w-full flex-1 overflow-y-auto px-4 py-6 md:px-8 max-w-[1600px] mx-auto">
          {children}
        </div>

        {/* Floating PWA Install Prompt Banner */}
        {showInstallBanner && (
          <div className="fixed bottom-24 left-4 right-4 md:left-6 md:right-auto md:max-w-md bg-white border-2 border-[#6A008A] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-4 z-[99] flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
            <div className="flex items-start gap-3">
              <div className="bg-purple-100 rounded-lg p-2.5 text-[#6A008A] shrink-0">
                <Smartphone className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-gray-900 leading-tight">Instalar ControlMax no Celular</h4>
                <p className="text-xs text-gray-500 mt-1">Acesse de forma nativa na tela de início, salve dados móveis e use de forma ultra rápida!</p>
              </div>
              <button 
                onClick={() => setShowInstallBanner(false)} 
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <button 
                onClick={handleInstallClick}
                className="flex-1 bg-[#8CC63F] hover:bg-[#7cb337] active:scale-98 text-white font-extrabold text-xs py-2.5 px-4 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                <Download className="w-4 h-4" />
                <span>Instalar Aplicativo</span>
              </button>
              <button 
                onClick={() => setShowInstallBanner(false)}
                className="px-3.5 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-lg text-gray-500 text-xs font-bold transition-all uppercase tracking-wider"
              >
                Depois
              </button>
            </div>
          </div>
        )}

        {/* Floating WhatsApp Button (exactly like TryController bottom-right green contact button) */}
        {!isAIAssistantOpen && currentScreen !== 'ai-assistant' && (
          <a 
            href="https://wa.me/5511999999999" 
            target="_blank" 
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 bg-[#25D366] text-white p-3.5 rounded-full shadow-[0_6px_16px_rgba(0,0,0,0.3)] z-[100] flex items-center justify-center border-4 border-white hover:scale-110 active:scale-95 transition-transform"
            title="Contacto de WhatsApp"
          >
            <MessageCircle className="w-8 h-8 fill-white stroke-[1.2] text-[#25D366]" />
          </a>
        )}

         {/* AI Voice Assistant for Client Admin (Spanish) or Super Admin (Portuguese) */}
        {(role === 'admin' || showSuperAdmin) && currentScreen !== 'ai-assistant' && (
          <AIVoiceAssistant language={showSuperAdmin ? "pt" : "es"} onOpenChange={setIsAIAssistantOpen} />
        )}

      </main>
    </div>
  );
}
