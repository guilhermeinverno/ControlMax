import {
  Home, CircleDollarSign, Crosshair, UserCog, Calculator, ChevronDown, ChevronRight,
  Users, BarChart3, ShieldCheck, ClipboardList, CalendarDays,
} from 'lucide-react';
import { useState } from 'react';
import type { Screen } from '../../../types';
import type { MouseEvent } from 'react';

interface LayoutDesktopNavProps {
  currentScreen: Screen;
  role: string | undefined;
  showSuperAdmin: boolean;
  activeDropdown: string | null;
  handleDropdownClick: (e: MouseEvent, id: string) => void;
  nav: (screen: Screen) => void;
}

export function LayoutDesktopNav({
  currentScreen,
  role,
  showSuperAdmin,
  activeDropdown,
  handleDropdownClick,
  nav,
}: LayoutDesktopNavProps) {
  return (
    <div className="hidden lg:flex items-stretch bg-white border-r border-gray-200">
      <button
        onClick={() => nav('dashboard')}
        className={`px-6 flex items-center justify-center transition-colors border-r border-gray-200 hover:bg-gray-50/80 ${
          currentScreen === 'dashboard' ? 'bg-gray-100/80' : ''
        }`}
        title="Inicio / Dashboard"
      >
        <Home className="w-5.5 h-5.5 text-[#6A008A]" />
      </button>

      {role !== 'collector' && (
        <button
          onClick={() => nav('statistics')}
          className={`px-6 flex items-center justify-center transition-colors border-r border-gray-200 hover:bg-gray-50/80 ${
            currentScreen === 'statistics' ? 'bg-gray-100/80' : ''
          }`}
          title="Estadísticas"
        >
          <BarChart3 className="w-5.5 h-5.5 text-[#6A008A]" />
        </button>
      )}

      <LayoutVentasDropdown
        currentScreen={currentScreen}
        role={role}
        activeDropdown={activeDropdown}
        handleDropdownClick={handleDropdownClick}
        nav={nav}
      />

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

      {role !== 'collector' && (
        <LayoutCentrosDropdown
          currentScreen={currentScreen}
          activeDropdown={activeDropdown}
          handleDropdownClick={handleDropdownClick}
          nav={nav}
        />
      )}

      {role !== 'collector' && (
        <LayoutAdminDropdown
          currentScreen={currentScreen}
          role={role}
          showSuperAdmin={showSuperAdmin}
          activeDropdown={activeDropdown}
          handleDropdownClick={handleDropdownClick}
          nav={nav}
        />
      )}

      {role !== 'collector' && (
        <LayoutReportesDropdown
          currentScreen={currentScreen}
          activeDropdown={activeDropdown}
          handleDropdownClick={handleDropdownClick}
          nav={nav}
        />
      )}

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
  );
}

function LayoutVentasDropdown({
  currentScreen,
  role,
  activeDropdown,
  handleDropdownClick,
  nav,
}: Pick<LayoutDesktopNavProps, 'currentScreen' | 'role' | 'activeDropdown' | 'handleDropdownClick' | 'nav'>) {
  const ventasScreens = [
    'new-income', 'new-expense', 'sales', 'open-box', 'box-summary', 'auto-keys',
    'collection-cleaning', 'period-summary', 'mass-box-opening', 'transfer-sales',
  ];
  const isActive = activeDropdown === 'ventas' || ventasScreens.includes(currentScreen);

  return (
    <div className="relative flex items-stretch border-r border-gray-200">
      <button
        onClick={(e) => handleDropdownClick(e, 'ventas')}
        className={`px-5 flex items-center gap-2 transition-colors text-xs uppercase font-extrabold hover:bg-gray-50/80 ${
          isActive ? 'text-[#6A008A] bg-gray-50/80' : 'text-gray-600'
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
  );
}

function LayoutCentrosDropdown({
  currentScreen,
  activeDropdown,
  handleDropdownClick,
  nav,
}: Pick<LayoutDesktopNavProps, 'currentScreen' | 'activeDropdown' | 'handleDropdownClick' | 'nav'>) {
  const centrosScreens = [
    'bc-incomes', 'bc-expenses', 'bc-transfers', 'bc-approvals', 'open-box', 'box-summary',
    'bc-map', 'sales', 'credit-requests', 'period-summary', 'mass-box-opening', 'transfer-sales',
    'insurance', 'finance', 'business-centers',
  ];
  const isActive = activeDropdown === 'centros' || centrosScreens.includes(currentScreen);

  return (
    <div className="relative flex items-stretch border-r border-gray-200">
      <button
        onClick={(e) => handleDropdownClick(e, 'centros')}
        className={`px-5 flex items-center gap-2 transition-colors text-xs uppercase font-extrabold hover:bg-gray-50/80 ${
          isActive ? 'text-[#6A008A] bg-gray-50/80' : 'text-gray-600'
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
          <button onClick={() => nav('bc-transfers')} className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#6A008A] border-b border-gray-50 flex items-center justify-between whitespace-nowrap">
            Transferência de dinheiro <ChevronRight className="w-3 h-3 text-gray-400" />
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
  );
}

function LayoutAdminDropdown({
  currentScreen,
  role,
  showSuperAdmin,
  activeDropdown,
  handleDropdownClick,
  nav,
}: Pick<LayoutDesktopNavProps, 'currentScreen' | 'role' | 'showSuperAdmin' | 'activeDropdown' | 'handleDropdownClick' | 'nav'>) {
  const adminScreens = ['superadmin', 'user-list', 'device-list', 'company-list', 'platform-management', 'forms', 'holidays', 'profiles', 'vendedor-mobile', 'business-centers', 'route-list'];
  const isActive = activeDropdown === 'admin' || adminScreens.includes(currentScreen);
  const [hoverSubmenu, setHoverSubmenu] = useState<'plataforma' | 'usuarios' | 'clientes' | null>(null);

  return (
    <div className="relative flex items-stretch border-r border-gray-200">
      <button
        onClick={(e) => handleDropdownClick(e, 'admin')}
        className={`px-5 flex items-center gap-2 transition-colors text-xs uppercase font-extrabold hover:bg-gray-50/80 ${
          isActive ? 'text-[#6A008A] bg-gray-50/80' : 'text-gray-600'
        }`}
      >
        <UserCog className="w-4.5 h-4.5 text-[#6A008A]" />
        <span>Administración</span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
      </button>

      {activeDropdown === 'admin' && (
        <div className="absolute top-[64px] left-0 flex z-50">
          {/* Main Flyout Column 1 */}
          <div className="w-64 bg-white rounded-b-md shadow-xl border-t-2 border-[#8CC63F] py-1 border-r border-gray-100">
            {showSuperAdmin && (
              <button onClick={() => nav('superadmin')} className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#6A008A] hover:bg-purple-100 border-b border-gray-100 flex items-center justify-between">
                ★ Panel Super Admin <ChevronRight className="w-3 h-3 text-purple-600" />
              </button>
            )}
            <div 
              onMouseEnter={() => setHoverSubmenu('plataforma')}
              className={`w-full text-left px-4 py-3 text-xs font-bold transition-colors cursor-pointer flex items-center justify-between ${
                hoverSubmenu === 'plataforma' ? 'bg-[#8CC63F] text-[#6A008A]' : 'text-[#6A008A] hover:bg-purple-50'
              }`}
            >
              <span>Gestión de Plataforma</span>
              <ChevronRight className="w-4 h-4" />
            </div>

            <div 
              onMouseEnter={() => setHoverSubmenu('usuarios')}
              onClick={() => nav('user-list')}
              className="w-full text-left px-4 py-3 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#6A008A] flex items-center justify-between cursor-pointer"
            >
              <span>Gestión de Usuarios</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            </div>

            <div 
              onMouseEnter={() => setHoverSubmenu('clientes')}
              onClick={() => nav('company-list')}
              className="w-full text-left px-4 py-3 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-[#6A008A] flex items-center justify-between cursor-pointer"
            >
              <span>Gestión de Clientes</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            </div>
          </div>

          {/* Flyout Submenu Column 2 */}
          {hoverSubmenu === 'plataforma' && (
            <div className="w-64 bg-white rounded-b-md shadow-2xl border-t-2 border-[#8CC63F] py-2 ml-1 text-xs text-gray-700 space-y-1">
              <button
                type="button"
                disabled
                title="Piloto: Sociedade = tenantId. CRUD multi-sociedade adiado (CTX-03)."
                className="w-full text-left px-5 py-2.5 text-gray-400 cursor-not-allowed font-semibold"
              >
                Sociedades (piloto: via tenant)
              </button>
              <button onClick={() => nav('business-centers')} className="w-full text-left px-5 py-2.5 hover:bg-purple-50 hover:text-[#6A008A] font-semibold">
                Centros de negocios
              </button>
              <button onClick={() => nav('route-list')} className="w-full text-left px-5 py-2.5 hover:bg-purple-50 hover:text-[#6A008A] font-semibold">
                Unidades
              </button>
              <button onClick={() => nav('user-list')} className="w-full text-left px-5 py-2.5 hover:bg-purple-50 hover:text-[#6A008A] font-semibold">
                Trabajadores
              </button>
              <button onClick={() => nav('platform-management')} className="w-full text-left px-5 py-2.5 hover:bg-purple-50 hover:text-[#6A008A] font-semibold">
                Tipos de movimientos
              </button>
              <button onClick={() => nav('device-list')} className="w-full text-left px-5 py-2.5 hover:bg-purple-50 hover:text-[#6A008A] font-semibold">
                Dispositivos
              </button>
              <button onClick={() => nav('close-box')} className="w-full text-left px-5 py-2.5 hover:bg-purple-50 hover:text-[#6A008A] font-semibold">
                Liquidación del trabajador
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LayoutReportesDropdown({
  currentScreen,
  activeDropdown,
  handleDropdownClick,
  nav,
}: Pick<LayoutDesktopNavProps, 'currentScreen' | 'activeDropdown' | 'handleDropdownClick' | 'nav'>) {
  const isActive = activeDropdown === 'reportes' || ['performance', 'statistics', 'collector-map', 'device-list'].includes(currentScreen);

  return (
    <div className="relative flex items-stretch border-r border-gray-200">
      <button
        onClick={(e) => handleDropdownClick(e, 'reportes')}
        className={`px-5 flex items-center gap-2 transition-colors text-xs uppercase font-extrabold hover:bg-gray-50/80 ${
          isActive ? 'text-[#6A008A] bg-gray-50/80' : 'text-gray-600'
        }`}
      >
        <Calculator className="w-4.5 h-4.5 text-[#6A008A]" />
        <span>Reportes</span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
      </button>

      {activeDropdown === 'reportes' && (
        <div className="absolute top-[64px] left-0 w-72 bg-white rounded-b-md shadow-2xl border-t-2 border-[#8CC63F] py-2 z-50 text-xs font-semibold text-gray-600 space-y-1">
          <button onClick={() => nav('sales')} className="w-full text-left px-6 py-2 hover:bg-purple-50 hover:text-[#6A008A]">
            Ventas
          </button>
          <button onClick={() => nav('platform-management')} className="w-full text-left px-6 py-2 hover:bg-purple-50 hover:text-[#6A008A]">
            Plataforma
          </button>
          <button onClick={() => nav('sales')} className="w-full text-left px-6 py-2 hover:bg-purple-50 hover:text-[#6A008A]">
            Procesos encolados
          </button>
          <button onClick={() => nav('statistics')} className="w-full text-left px-6 py-2 hover:bg-purple-50 hover:text-[#6A008A]">
            Log de Acciones
          </button>
          <button onClick={() => nav('vendedor-mobile')} className="w-full text-left px-6 py-2 hover:bg-purple-50 hover:text-[#6A008A]">
            Log Móvil
          </button>
          <button onClick={() => nav('performance')} className="w-full text-left px-6 py-2 hover:bg-purple-50 hover:text-[#6A008A]">
            Reportes Personalizados
          </button>
          <button onClick={() => nav('collector-map')} className="w-full text-left px-6 py-2 hover:bg-purple-50 hover:text-[#6A008A]">
            Ubicar Mis Trabajadores
          </button>
          <button onClick={() => nav('performance')} className="w-full text-left px-6 py-2 hover:bg-purple-50 hover:text-[#6A008A]">
            Reportes Rápidos
          </button>
          <button onClick={() => nav('device-list')} className="w-full text-left px-6 py-2 hover:bg-purple-50 hover:text-[#6A008A]">
            Reporte Dispositivos Vinculados
          </button>
          <button onClick={() => nav('statistics')} className="w-full text-left px-6 py-2 hover:bg-purple-50 hover:text-[#6A008A]">
            Histórico de alertas de pánico
          </button>
        </div>
      )}
    </div>
  );
}
