import { useState, useEffect, type ReactNode } from 'react';
import { 
  Menu, User, LogOut, Check, Download, Smartphone, ClipboardList
} from 'lucide-react';
import { Screen } from '../../types';
import { auth, db, getDemoUser, triggerAuthListeners } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import { useTenant } from '../../hooks/useTenant';
import { useLocation } from '../../hooks/useLocation';
import { useLayoutUi } from '../../hooks/useLayoutUi';
import { AIVoiceAssistant } from './AIVoiceAssistant';
import { LayoutMobileDrawer } from './layout/LayoutMobileDrawer';
import { LayoutDesktopNav } from './layout/LayoutDesktopNav';
import { layoutRoleLabel } from '../../utils/statusLabels';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { SyncStatusBadge } from '../../components/sync/SyncStatusBadge';

import { useGlobalContext } from '../../context/GlobalContext';

interface LayoutProps {
  children: ReactNode;
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  isSuperAdmin?: boolean;
}

export function Layout({ children, currentScreen, onNavigate, isSuperAdmin }: LayoutProps) {
  const { tenantId, role } = useTenant();
  const { selectedCnId, selectedUnitId, setSelectedCnId, setSelectedUnitId } = useGlobalContext();
  const shouldHideGlobalHeader = currentScreen === 'bc-transfers' || currentScreen === 'transfer-sales' || currentScreen === 'sale-detail' || currentScreen === 'new-expense' || currentScreen === 'new-income' || (currentScreen === 'sales' && role === 'collector') || currentScreen === 'vendedor-mobile';
  useLocation(); // Rastreamento automático quando caixa aberta


  const [collectorStats, setCollectorStats] = useState({ clients: 65, paid: 1, balance: 1007951 });

  useEffect(() => {
    if (role !== 'collector' || !tenantId) return;

    const targetUserId = auth.currentUser?.uid || '';
    const q = query(
      collection(db, 'sales'),
      where('tenantId', '==', tenantId),
      where('userId', '==', targetUserId),
      where('status', '==', 'active')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const activeSales = snapshot.docs.map(d => d.data());
      const clientsCount = activeSales.length || 65;
      const totalBal = activeSales.reduce((sum, s) => sum + (Number(s.saldoPendienteCents || s.balance || 0)), 0) || 1007951;

      setCollectorStats(prev => ({
        ...prev,
        clients: clientsCount,
        balance: totalBal
      }));
    }, (err) => {
      console.warn("Error loading collector stats for layout header, using defaults:", err);
    });

    return unsub;
  }, [tenantId, role]);

  useEffect(() => {
    if (role !== 'collector' || !tenantId) return;

    const targetUserId = auth.currentUser?.uid || '';
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const q = query(
      collection(db, 'collections'),
      where('tenantId', '==', tenantId),
      where('userId', '==', targetUserId)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const todayCollections = snapshot.docs.filter(docSnap => {
        const data = docSnap.data();
        const createdAtDate = data.createdAt?.toDate() || null;
        return createdAtDate ? createdAtDate.getTime() >= startOfToday.getTime() : true;
      });

      setCollectorStats(prev => ({
        ...prev,
        paid: todayCollections.length || 1
      }));
    }, (err) => {
      console.warn("Error loading collector collection stats for layout header, using defaults:", err);
    });

    return unsub;
  }, [tenantId, role]);

  const handleDemoRoleChange = (newRole: 'admin' | 'collector') => {
    localStorage.setItem('controlmax_demo_role', newRole);
    const demoUser = getDemoUser();
    triggerAuthListeners(demoUser);
    if (newRole === 'collector') {
      onNavigate('sales');
    } else {
      onNavigate('dashboard');
    }
  };
  const userEmail = auth.currentUser?.email || '';
  const currentEmail = userEmail.toLowerCase();
  const showSuperAdmin = isSuperAdmin;
  const displayRole = layoutRoleLabel(role, showSuperAdmin);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const handleOpenDrawer = () => setDrawerOpen(true);
    window.addEventListener('controlmax_open_drawer', handleOpenDrawer);
    return () => {
      window.removeEventListener('controlmax_open_drawer', handleOpenDrawer);
    };
  }, []);
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
      {!shouldHideGlobalHeader && (
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

          {/* Logo em círculo elegante */}
          <div 
            onClick={() => onNavigate(role === 'collector' ? 'sales' : 'dashboard')}
            className="flex items-center cursor-pointer select-none py-1"
          >
            <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-full bg-white border-2 border-white/40 shadow-md flex items-center justify-center overflow-hidden shrink-0">
              <img src="/logo.png" alt="ControlMax Logo" className="h-8 lg:h-9 w-auto object-contain" />
            </div>
          </div>
        </div>

        {/* Center Section: Desktop-Only Navigation Tabs inside WHITE bar */}
        <LayoutDesktopNav
          currentScreen={currentScreen}
          role={role}
          showSuperAdmin={showSuperAdmin}
          activeDropdown={activeDropdown}
          handleDropdownClick={handleDropdownClick}
          nav={nav}
        />

        {/* Right Section: Stretches purple background and holds profile */}
        <div className="flex-1 bg-[#6A008A] flex items-center justify-end px-4 lg:px-6 space-x-4">
          <SyncStatusBadge />

          {(role === 'admin' || role === 'supervisor' || showSuperAdmin) && (
            <button 
              onClick={() => nav('ai-assistant')} 
              className={`p-1.5 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center relative cursor-pointer ${
                currentScreen === 'ai-assistant' ? 'bg-white/15 text-white' : 'text-white'
              }`}
              title="Assistente de Voz IA"
            >
              <span className="text-xl">🤖</span>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#84CC16] rounded-full ring-1 ring-[#6A008A]"></span>
            </button>
          )}

          <div className="hidden xl:flex flex-col text-right">
            <span className="text-white text-xs font-bold uppercase">{displayRole}</span>
            <span className="text-white/70 text-[10px]">{userEmail}</span>
          </div>

          <button className="text-white p-1.5 hover:opacity-85 focus:outline-none cursor-pointer" onClick={() => nav('superadmin')} title="Super Administrador">
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
      )}

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
        <div className={`w-full flex-1 overflow-y-auto ${shouldHideGlobalHeader ? ((currentScreen === 'sales' && role === 'collector') ? 'p-0' : 'p-4 md:p-8') : 'px-4 py-6 md:px-8'} max-w-[1600px] mx-auto`}>
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



         {/* AI Voice Assistant for Client Admin (Spanish) or Super Admin (Portuguese) */}
        {(role === 'admin' || showSuperAdmin) && currentScreen !== 'ai-assistant' && (
          <AIVoiceAssistant language={showSuperAdmin ? "pt" : "es"} onOpenChange={setIsAIAssistantOpen} />
        )}

      </main>
    </div>
  );
}
