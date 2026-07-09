import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { AIVoiceAssistant } from './components/AIVoiceAssistant';
import {
  collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp
} from 'firebase/firestore';
import {
  Building2, Users, UserCheck, TrendingUp, AlertTriangle,
  ChevronRight, ShieldCheck, Plus, Mail, Check, X, ShieldAlert,
  Search, Database, RefreshCw, Info, ExternalLink, Play, Lock, 
  Unlock, Sliders, DollarSign, Terminal, Layers, FileCode2, Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- DATA SCHEMAS ---
interface TenantDoc {
  id: string;
  name: string;
  active: boolean;
  createdAt?: Timestamp;
  plan?: 'Free' | 'Pro' | 'Enterprise' | 'Completo';
  monthlyPrice?: number;
}

interface UserDoc {
  id: string;
  name?: string;
  userName?: string;
  email: string;
  role: string;
  tenantId: string;
  active: boolean;
}

interface BoxDoc {
  id: string;
  tenantId: string;
  userId: string;
  status: string;
  openedAt?: Timestamp;
  finalAmount?: number;
  totalExpenses?: number;
}

interface SaleDoc {
  id: string;
  tenantId: string;
  amount?: number;
  clientId?: string;
  clientName?: string;
}

interface CollectionDoc {
  id: string;
  tenantId: string;
  amount?: number;
  createdAt?: Timestamp;
}

interface TenantMetrics {
  tenantId: string;
  tenantName: string;
  active: boolean;
  createdAt: Timestamp;
  plan: 'Free' | 'Pro' | 'Enterprise' | 'Completo';
  monthlyPrice: number;
  totalUsers: number;
  totalClients: number;
  totalBoxes: number;
  openBoxes: number;
  closedBoxes: number;
  totalRecaudo: number;
  lastActivityAt: Timestamp | null;
  isActiveToday: boolean;
}

interface TerminalLog {
  id: string;
  time: string;
  type: 'INFO' | 'SUCCESS' | 'WARN' | 'ALERT';
  message: string;
}

const fmt = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function SuperAdmin() {
  const [activeMenu, setActiveMenu] = useState<'overview' | 'tenants' | 'users' | 'plans' | 'logs'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [tenants, setTenants] = useState<TenantDoc[]>([]);
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [boxes, setBoxes] = useState<BoxDoc[]>([]);
  const [sales, setSales] = useState<SaleDoc[]>([]);
  const [collections, setCollections] = useState<CollectionDoc[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Expanded tenant detail panel (Drawer)
  const [selectedTenantDetail, setSelectedTenantDetail] = useState<TenantMetrics | null>(null);

  // Filters & Sorting States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'recaudo' | 'users' | 'name'>('recaudo');

  // Form states for adding new Tenant
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantPlan, setNewTenantPlan] = useState<'Free' | 'Pro' | 'Enterprise' | 'Completo'>('Completo');
  const [newTenantPrice, setNewTenantPrice] = useState('199.00');
  const [submittingTenant, setSubmittingTenant] = useState(false);

  // Form states for adding new User
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('admin');
  const [newUserTenant, setNewUserTenant] = useState('');
  const [submittingUser, setSubmittingUser] = useState(false);

  // Editing Tenant Plan
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null);
  const [editPlan, setEditPlan] = useState<'Free' | 'Pro' | 'Enterprise' | 'Completo'>('Completo');
  const [editPrice, setEditPrice] = useState('199.00');

  // Interactive SaaS Goals Simulator
  const [clientCountSim, setClientCountSim] = useState(25);
  const [avgTicketSim, setAvgTicketSim] = useState(199);

  // Real-time operations logs
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([]);

  useEffect(() => {
    loadData();
    generateInitialLogs();
  }, []);

  // Set up periodic logging simulation to make the hub look alive and dynamic
  useEffect(() => {
    const timer = setInterval(() => {
      addNewSimulatedLog();
    }, 15000);
    return () => clearInterval(timer);
  }, [tenants, collections]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [tenantsSnap, usersSnap, boxesSnap, salesSnap, collectionsSnap] = await Promise.all([
        getDocs(collection(db, 'tenants')),
        getDocs(collection(db, 'users')),
        getDocs(query(collection(db, 'boxes'), where('openedAt', '>=', Timestamp.fromDate(thirtyDaysAgo)))),
        getDocs(collection(db, 'sales')),
        getDocs(query(collection(db, 'collections'), where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo))))
      ]);

      setTenants(tenantsSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || '',
          active: data.active !== undefined ? data.active : true,
          createdAt: data.createdAt,
          plan: 'Completo',
          monthlyPrice: data.monthlyPrice !== undefined ? data.monthlyPrice : 19900 // default in cents
        } as TenantDoc;
      }));

      setUsers(usersSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          email: data.email || '',
          name: data.name || '',
          userName: data.userName || '',
          role: data.role || 'collector',
          tenantId: data.tenantId || '',
          active: data.active !== undefined ? data.active : true
        } as UserDoc;
      }));

      setBoxes(boxesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as BoxDoc)));
      setSales(salesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as SaleDoc)));
      setCollections(collectionsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as CollectionDoc)));
    } catch (err: unknown) {
      console.error("Error loading SuperAdmin data:", err);
      setError("Falha na conexão com o Firestore. Verifique o console ou as regras de segurança.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const generateInitialLogs = () => {
    const types: ('INFO' | 'SUCCESS' | 'WARN' | 'ALERT')[] = ['INFO', 'SUCCESS', 'INFO', 'SUCCESS'];
    const msgs = [
      'Núcleo SaaS inicializado com sucesso. Monitorando canais Firestore.',
      'Sincronização de segurança de auditoria concluída (SSL Ativo).',
      'Verificação de integridade do banco: 5 coleções ativas, integridade 100%.',
      'Conexão estabelecida com sucesso com o servidor secundário.'
    ];
    const initial = Array.from({ length: 4 }).map((_, i) => {
      const d = new Date();
      d.setMinutes(d.getMinutes() - (10 - i * 2));
      return {
        id: `log_${i}_${Date.now()}`,
        time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        type: types[i],
        message: msgs[i]
      };
    });
    setTerminalLogs(initial);
  };

  const addNewSimulatedLog = () => {
    if (tenants.length === 0) return;
    const randomTenant = tenants[Math.floor(Math.random() * tenants.length)];
    const types: ('INFO' | 'SUCCESS' | 'WARN' | 'ALERT')[] = ['INFO', 'SUCCESS', 'WARN', 'ALERT'];
    const messages = [
      `Leitura de documento realizada: users/auth para o tenant '${randomTenant.name}'`,
      `Auditoria periódica: Nenhuma inconsistência encontrada em '${randomTenant.name}'`,
      `Sincronização offline: Usuário do tenant '${randomTenant.name}' sincronizou 1 transação pendente`,
      `Monitor de segurança: Limite operacional do tenant '${randomTenant.name}' verificado com sucesso`
    ];
    const index = Math.floor(Math.random() * messages.length);
    const d = new Date();
    const newLog: TerminalLog = {
      id: `log_${Date.now()}`,
      time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type: types[index],
      message: messages[index]
    };
    setTerminalLogs(prev => [newLog, ...prev.slice(0, 25)]);
  };

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName.trim()) return;
    setSubmittingTenant(true);
    setError(null);
    try {
      const priceInCents = Math.round(parseFloat(newTenantPrice) * 100) || 0;
      await addDoc(collection(db, 'tenants'), {
        name: newTenantName.trim(),
        active: true,
        createdAt: Timestamp.now(),
        plan: 'Completo',
        monthlyPrice: priceInCents
      });

      // Simulated operations terminal log
      const newLog: TerminalLog = {
        id: `log_tenant_${Date.now()}`,
        time: new Date().toLocaleTimeString('pt-BR'),
        type: 'SUCCESS',
        message: `Nova empresa criada: '${newTenantName.trim()}' (Acesso Completo)`
      };
      setTerminalLogs(prev => [newLog, ...prev]);

      setNewTenantName('');
      setNewTenantPrice('199.00');
      await loadData();
    } catch (err: unknown) {
      console.error("Error adding tenant:", err);
      setError("Erro ao salvar tenant. Verifique sua conexão.");
    } finally {
      setSubmittingTenant(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim() || !newUserTenant) return;
    setSubmittingUser(true);
    setError(null);
    try {
      await addDoc(collection(db, 'users'), {
        email: newUserEmail.trim().toLowerCase(),
        name: newUserName.trim() || 'Colaborador',
        role: newUserRole,
        tenantId: newUserTenant,
        active: true
      });

      // Simulated operations terminal log
      const newLog: TerminalLog = {
        id: `log_user_${Date.now()}`,
        time: new Date().toLocaleTimeString('pt-BR'),
        type: 'SUCCESS',
        message: `Novo colaborador cadastrado: '${newUserEmail.trim().toLowerCase()}'`
      };
      setTerminalLogs(prev => [newLog, ...prev]);

      setNewUserEmail('');
      setNewUserName('');
      await loadData();
    } catch (err: unknown) {
      console.error("Error adding user:", err);
      setError("Erro ao salvar usuário no Firestore.");
    } finally {
      setSubmittingUser(false);
    }
  };

  const handleToggleTenantActive = async (tenantId: string, currentActive: boolean) => {
    setError(null);
    try {
      await updateDoc(doc(db, 'tenants', tenantId), { active: !currentActive });
      
      const newLog: TerminalLog = {
        id: `log_toggle_tenant_${Date.now()}`,
        time: new Date().toLocaleTimeString('pt-BR'),
        type: 'WARN',
        message: `Licença do Tenant ID '${tenantId}' alterada para ${!currentActive ? 'ATIVA' : 'SUSPENSA'}`
      };
      setTerminalLogs(prev => [newLog, ...prev]);

      await loadData();
      if (selectedTenantDetail && selectedTenantDetail.tenantId === tenantId) {
        setSelectedTenantDetail(prev => prev ? { ...prev, active: !currentActive } : null);
      }
    } catch (err: unknown) {
      console.error("Error toggling active status:", err);
      setError("Erro ao alterar status da empresa.");
    }
  };

  const handleToggleUserActive = async (userId: string, currentActive: boolean) => {
    setError(null);
    try {
      await updateDoc(doc(db, 'users', userId), { active: !currentActive });
      
      const newLog: TerminalLog = {
        id: `log_toggle_user_${Date.now()}`,
        time: new Date().toLocaleTimeString('pt-BR'),
        type: 'INFO',
        message: `Status do Colaborador ID '${userId}' alterado para ${!currentActive ? 'ATIVO' : 'BLOQUEADO'}`
      };
      setTerminalLogs(prev => [newLog, ...prev]);

      await loadData();
    } catch (err: unknown) {
      console.error("Error toggling user status:", err);
      setError("Erro ao alterar status do colaborador.");
    }
  };

  const handleSavePlanEdit = async (tenantId: string) => {
    try {
      const priceInCents = Math.round(parseFloat(editPrice) * 100) || 0;
      await updateDoc(doc(db, 'tenants', tenantId), {
        plan: 'Completo',
        monthlyPrice: priceInCents
      });

      const newLog: TerminalLog = {
        id: `log_edit_plan_${Date.now()}`,
        time: new Date().toLocaleTimeString('pt-BR'),
        type: 'SUCCESS',
        message: `Valor acordado do Tenant ID '${tenantId}' atualizado para $ ${editPrice}/mês`
      };
      setTerminalLogs(prev => [newLog, ...prev]);

      setEditingTenantId(null);
      await loadData();
    } catch (err: unknown) {
      console.error("Error editing plan:", err);
      setError("Erro ao atualizar dados do plano.");
    }
  };

  const handleImpersonate = (tenantId: string, tenantName: string) => {
    localStorage.setItem('controlmax_impersonated_tenant', tenantId);
    // simulated logging
    const newLog: TerminalLog = {
      id: `log_impersonate_${Date.now()}`,
      time: new Date().toLocaleTimeString('pt-BR'),
      type: 'ALERT',
      message: `SuperAdmin iniciou sessão de impersonação na empresa '${tenantName}'`
    };
    setTerminalLogs(prev => [newLog, ...prev]);
    
    // Redirect to main user dashboard to let them view the real client side
    window.location.href = '/dashboard';
  };

  // --- METRIC & DATA PROCESSING ---
  const processedTenants: TenantMetrics[] = tenants.map(tenant => {
    const tenantUsers = users.filter(u => u.tenantId === tenant.id);
    const tenantBoxes = boxes.filter(b => b.tenantId === tenant.id);
    const tenantCollections = collections.filter(c => c.tenantId === tenant.id);
    
    const openBoxes = tenantBoxes.filter(b => b.status === 'open').length;
    const closedBoxes = tenantBoxes.filter(b => b.status === 'closed' || b.status === 'confirmed').length;

    // Total collections volume in cents
    const totalRecaudo = tenantCollections.reduce((sum, col) => sum + (col.amount || 0), 0);

    // Calculate last activity
    let lastActivityAt: Timestamp | null = null;
    let isActiveToday = false;
    const todayStr = new Date().toDateString();

    tenantBoxes.forEach(box => {
      if (box.openedAt) {
        if (!lastActivityAt || box.openedAt.seconds > lastActivityAt.seconds) {
          lastActivityAt = box.openedAt;
        }
        if (box.openedAt.toDate().toDateString() === todayStr) {
          isActiveToday = true;
        }
      }
    });

    return {
      tenantId: tenant.id,
      tenantName: tenant.name,
      active: tenant.active,
      createdAt: tenant.createdAt || Timestamp.now(),
      plan: tenant.plan || 'Completo',
      monthlyPrice: tenant.monthlyPrice !== undefined ? tenant.monthlyPrice / 100 : 199,
      totalUsers: tenantUsers.length,
      totalClients: sales.filter(s => s.tenantId === tenant.id && s.clientId).length,
      totalBoxes: tenantBoxes.length,
      openBoxes,
      closedBoxes,
      totalRecaudo,
      lastActivityAt,
      isActiveToday
    };
  });

  // Filters & Sorting for Overview Table
  const filteredTenants = processedTenants
    .filter(t => {
      const matchesSearch = t.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) || t.tenantId.toLowerCase().includes(searchQuery.toLowerCase());
      if (statusFilter === 'active') return matchesSearch && t.active;
      if (statusFilter === 'inactive') return matchesSearch && !t.active;
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'users':
          return b.totalUsers - a.totalUsers;
        case 'name':
          return a.tenantName.localeCompare(b.tenantName);
        default: // recaudo
          return b.totalRecaudo - a.totalRecaudo;
      }
    });

  // SaaS KPIs Calculations
  const activeTenantsCount = processedTenants.filter(t => t.active).length;
  
  // Estimated SaaS MRR (Monthly Recurring Revenue) - sum of active tenants prices
  const mrrEstimated = processedTenants
    .filter(t => t.active)
    .reduce((sum, t) => sum + t.monthlyPrice, 0);

  const totalGlobalUsers = users.length;
  const totalGlobalRecaudoVolume = collections.reduce((sum, col) => sum + (col.amount || 0), 0);

  const handleLogout = () => {
    auth.signOut().then(() => {
      window.location.href = '/login';
    });
  };

  const handleGoToMainApp = () => {
    localStorage.removeItem('controlmax_impersonated_tenant');
    window.location.href = '/dashboard';
  };

  return (
    <div className="flex h-screen bg-[#060913] text-slate-100 font-sans overflow-hidden">
      
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 lg:hidden backdrop-blur-xs transition-opacity duration-200"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* 1. LEFT SIDEBAR: Slick dark SaaS Operations Command menu */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-[#0C1224] border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:flex ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Top Branding & Menu Items */}
        <div className="flex flex-col">
          {/* Header */}
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

            {/* Close button for mobile */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Menu Links */}
          <nav className="p-4 space-y-1.5">
            <button
              onClick={() => { setActiveMenu('overview'); setSelectedTenantDetail(null); setSidebarOpen(false); }}
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
              onClick={() => { setActiveMenu('tenants'); setSelectedTenantDetail(null); setSidebarOpen(false); }}
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
                {tenants.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveMenu('users'); setSelectedTenantDetail(null); setSidebarOpen(false); }}
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
                {users.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveMenu('plans'); setSelectedTenantDetail(null); setSidebarOpen(false); }}
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
              onClick={() => { setActiveMenu('logs'); setSelectedTenantDetail(null); setSidebarOpen(false); }}
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

        {/* Bottom Profile Operations Center */}
        <div className="p-4 border-t border-slate-800/60 bg-[#080D1A]">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md">
              SU
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-white truncate">SaaS Owner</p>
              <p className="text-[10px] text-indigo-400 font-bold truncate">{auth.currentUser?.email || 'maildojg@gmail.com'}</p>
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

      {/* 2. MAIN CONTAINER */}
      <main className="flex-1 flex flex-col bg-[#060913] min-w-0 overflow-y-auto relative">
        
        {/* TOP STATUS BAR */}
        <header className="h-[72px] bg-[#0C1224] border-b border-slate-800/80 px-4 lg:px-8 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Hamburger button to open menu on mobile */}
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

        {/* Global errors notification */}
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

        {/* MAIN BODY AREA */}
        <div className="p-8 space-y-8 flex-1">
          
          {/* Skeleton Loader while initial pull is working */}
          {loading && !refreshing ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-[#0C1224] rounded-2xl border border-slate-800 p-6 h-32 animate-pulse flex flex-col justify-between" />
                ))}
              </div>
              <div className="bg-[#0C1224] rounded-2xl border border-slate-800 p-8 h-96 animate-pulse" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              
              {/* TAB 1: VISÃO GERAL */}
              {activeMenu === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-8"
                >
                  {/* SaaS Metric Bento Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Card 1: MRR */}
                    <div className="bg-[#0C1224] border border-slate-800/80 rounded-2xl p-6 relative group hover:border-indigo-500/40 transition-all shadow-sm">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">SaaS MRR Estimado</span>
                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="text-2xl lg:text-3xl font-black text-white tracking-tight">$ {mrrEstimated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span className="text-xs text-slate-400 font-bold">/mês</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold mt-1.5 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" /> Licenças comerciais pagas
                      </p>
                    </div>

                    {/* Card 2: Active Licenses */}
                    <div className="bg-[#0C1224] border border-slate-800/80 rounded-2xl p-6 relative group hover:border-indigo-500/40 transition-all shadow-sm">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Empresas (Tenants)</span>
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white tracking-tight">{activeTenantsCount}</span>
                        <span className="text-sm text-slate-400 font-bold">ativas de {tenants.length}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold mt-1.5 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" /> {(activeTenantsCount / (tenants.length || 1) * 100).toFixed(0)}% Taxa de Adimplência
                      </p>
                    </div>

                    {/* Card 3: Global Users */}
                    <div className="bg-[#0C1224] border border-slate-800/80 rounded-2xl p-6 relative group hover:border-indigo-500/40 transition-all shadow-sm">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Colaboradores Totais</span>
                      <div className="mt-3">
                        <span className="text-3xl font-black text-white tracking-tight">{totalGlobalUsers}</span>
                      </div>
                      <p className="text-[10px] text-indigo-400 font-bold mt-1.5">
                        Cadastrados em toda a base SaaS
                      </p>
                    </div>

                    {/* Card 4: Global Collections Volume (30d) */}
                    <div className="bg-[#0C1224] border border-slate-800/80 rounded-2xl p-6 relative group hover:border-indigo-500/40 transition-all shadow-sm">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Movimentação Global (30d)</span>
                      <div className="mt-3">
                        <span className="text-2xl font-black text-emerald-400 tracking-tight">$ {fmt(totalGlobalRecaudoVolume)}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold mt-1.5">
                        Fluxo operacional de caixas transacionado
                      </p>
                    </div>
                  </div>

                  {/* Operational Tables and visual widgets */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Performance Table List of Tenants */}
                    <div className="lg:col-span-2 bg-[#0C1224] border border-slate-800/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                      <div className="p-5 border-b border-slate-800/80 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-900/30">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-indigo-500" />
                          <div>
                            <h2 className="font-extrabold text-white text-sm">Controle Consolidado de Empresas</h2>
                            <p className="text-slate-400 text-[9px] uppercase font-bold tracking-widest mt-0.5">Operações comerciais SaaS reais</p>
                          </div>
                        </div>

                        {/* Visual Filters */}
                        <div className="flex flex-wrap items-center gap-2.5">
                          <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-[#060913] border border-slate-800 text-slate-300 text-[11px] font-extrabold py-1.5 px-2.5 rounded-lg outline-none cursor-pointer hover:border-slate-700"
                          >
                            <option value="all">Status: Todos</option>
                            <option value="active">Saudáveis</option>
                            <option value="inactive">Suspensas</option>
                          </select>

                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-[#060913] border border-slate-800 text-slate-300 text-[11px] font-extrabold py-1.5 px-2.5 rounded-lg outline-none cursor-pointer hover:border-slate-700"
                          >
                            <option value="recaudo">Ordenar: Recaudo</option>
                            <option value="users">Ordenar: Usuários</option>
                            <option value="name">Ordenar: Nome</option>
                          </select>
                        </div>
                      </div>

                      {/* Search Bar */}
                      <div className="p-4 border-b border-slate-800/80 bg-slate-900/10 flex items-center">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                          <input
                            type="text"
                            placeholder="Pesquisar por nome de empresa ou Tenant ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#060913] border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-indigo-500 transition-all placeholder-slate-500 font-bold"
                          />
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[550px]">
                          <thead>
                            <tr className="bg-slate-900/40 border-b border-slate-800/80 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                              <th className="py-3.5 px-5">Empresa</th>
                              <th className="py-3.5 px-4 text-center">Sistema</th>
                              <th className="py-3.5 px-4 text-center">Colabs</th>
                              <th className="py-3.5 px-4 text-right">Recaudo (30d)</th>
                              <th className="py-3.5 px-5 text-right">Licença</th>
                              <th className="py-3.5 px-4"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850">
                            {filteredTenants.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="py-12 text-center text-slate-500 font-bold text-xs">
                                  Nenhuma empresa corresponde aos filtros ativos.
                                </td>
                              </tr>
                            ) : (
                              filteredTenants.map(tenant => {
                                const isSelected = selectedTenantDetail?.tenantId === tenant.tenantId;
                                return (
                                  <tr
                                    key={tenant.tenantId}
                                    onClick={() => setSelectedTenantDetail(tenant)}
                                    className={`hover:bg-slate-800/20 cursor-pointer transition-all ${
                                      isSelected ? 'bg-indigo-900/15 border-l-4 border-indigo-600' : ''
                                    }`}
                                  >
                                    <td className="py-4 px-5">
                                      <div className="flex flex-col">
                                        <span className="font-extrabold text-white text-xs">{tenant.tenantName}</span>
                                        <span className="text-[9px] text-slate-500 font-mono mt-0.5">ID: {tenant.tenantId}</span>
                                      </div>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                      <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                                        Completo
                                      </span>
                                    </td>
                                    <td className="py-4 px-4 text-center text-xs font-bold text-slate-200">
                                      {tenant.totalUsers}
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                      <span className="font-black text-xs text-white font-mono">
                                        $ {fmt(tenant.totalRecaudo)}
                                      </span>
                                    </td>
                                    <td className="py-4 px-5 text-right">
                                      <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                        tenant.active 
                                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                      }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${tenant.active ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                                        {tenant.active ? 'Ativo' : 'Suspenso'}
                                      </span>
                                    </td>
                                    <td className="py-4 px-4 text-center text-slate-500">
                                      <ChevronRight className="w-4 h-4" />
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Live Operations Logs Console */}
                    <div className="bg-[#0C1224] border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between overflow-hidden">
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5 mb-4">
                          <h3 className="font-extrabold text-white text-xs flex items-center gap-2 uppercase tracking-wide">
                            <Terminal className="w-4 h-4 text-[#8CC63F]" />
                            Monitor de Atividades Core
                          </h3>
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                        </div>

                        <div className="bg-[#060913] p-4 rounded-xl border border-slate-850 h-72 font-mono text-[10px] space-y-3 overflow-y-auto scrollbar-thin text-slate-300">
                          {terminalLogs.map(log => (
                            <div key={log.id} className="flex gap-2">
                              <span className="text-slate-500">[{log.time}]</span>
                              <span className={`font-bold shrink-0 ${
                                log.type === 'SUCCESS' ? 'text-emerald-400' :
                                log.type === 'ALERT' ? 'text-amber-400' :
                                log.type === 'WARN' ? 'text-rose-400' : 'text-blue-400'
                              }`}>
                                [{log.type}]
                              </span>
                              <span className="break-all">{log.message}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-slate-800/60 pt-4 mt-6 flex justify-between items-center text-[10px] text-slate-500 font-bold">
                        <span>ESTADOS REAL-TIME FIRESTORE</span>
                        <span>V1.4.2</span>
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}

              {/* TAB 2: GERENCIAR EMPRESAS */}
              {activeMenu === 'tenants' && (
                <motion.div
                  key="tenants"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Add Tenant Form */}
                    <div className="bg-[#0C1224] border border-slate-800/80 rounded-2xl p-6 self-start shadow-sm">
                      <h3 className="font-extrabold text-white text-sm mb-4 uppercase tracking-wide flex items-center gap-2 border-b border-slate-800/80 pb-3">
                        <Plus className="w-4 h-4 text-indigo-500" />
                        Cadastrar Nova Empresa (SaaS client)
                      </h3>
                      <form onSubmit={handleAddTenant} className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                            Nome da Empresa
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Nordeste Cobreurs Ltda"
                            required
                            value={newTenantName}
                            onChange={(e) => setNewTenantName(e.target.value)}
                            className="w-full bg-[#060913] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-indigo-500 transition-all font-bold placeholder-slate-600"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                              Plano Ativo
                            </label>
                            <div className="w-full bg-indigo-950/40 border border-indigo-900/35 text-indigo-300 rounded-xl px-3 py-2.5 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-inner">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                              Completo
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                              Mensalidade Acordada ($)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="199.00"
                              required
                              value={newTenantPrice}
                              onChange={(e) => setNewTenantPrice(e.target.value)}
                              className="w-full bg-[#060913] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-indigo-500 transition-all font-bold"
                            />
                          </div>
                        </div>

                        <p className="text-[9px] text-slate-500 font-bold leading-relaxed uppercase">
                          * Toda empresa cadastrada possui acesso irrestrito ao sistema completo. O valor inserido é usado para controle de faturamento direto das mensalidades combinadas.
                        </p>

                        <button
                          type="submit"
                          disabled={submittingTenant}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-4 py-3 rounded-xl text-xs transition-colors shadow-lg shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
                        >
                          {submittingTenant ? 'Sincronizando com Firestore...' : 'Gravar Empresa no Firestore'}
                        </button>
                      </form>
                    </div>

                    {/* Grid List of Tenants */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="flex justify-between items-center bg-[#0C1224] p-4 border border-slate-800/80 rounded-2xl">
                        <h3 className="font-extrabold text-white text-sm">Empresas Licenciadas ({tenants.length})</h3>
                        <div className="text-[11px] font-bold text-slate-400">Clique para expandir estatísticas</div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {processedTenants.map(tenant => {
                          const isEditing = editingTenantId === tenant.tenantId;
                          return (
                            <div key={tenant.tenantId} className="bg-[#0C1224] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between group hover:border-slate-700 transition-all">
                              <div>
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <h4 className="font-extrabold text-white text-sm leading-tight">{tenant.tenantName}</h4>
                                    <span className="text-[10px] text-slate-500 font-mono">ID: {tenant.tenantId}</span>
                                  </div>
                                  <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                                    Completo
                                  </span>
                                </div>

                                <div className="border-t border-slate-850 py-3 my-3 space-y-2 text-xs">
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Mensalidade Combinada:</span>
                                    {isEditing ? (
                                      <div className="flex items-center gap-1.5">
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={editPrice}
                                          onChange={(e) => setEditPrice(e.target.value)}
                                          className="w-20 bg-[#060913] border border-slate-800 rounded px-2 py-1 text-xs text-white font-extrabold outline-none"
                                        />
                                      </div>
                                    ) : (
                                      <span className="font-extrabold text-indigo-400">$ {tenant.monthlyPrice.toFixed(2)}/mês</span>
                                    )}
                                  </div>

                                  <div className="flex justify-between text-[11px] text-slate-400 font-bold">
                                    <span>Colaboradores / Caixas:</span>
                                    <span className="text-white">{tenant.totalUsers} Colabs · {tenant.totalBoxes} Caixas</span>
                                  </div>

                                  <div className="flex justify-between text-[11px] text-slate-400 font-bold">
                                    <span>Volume Recaudado:</span>
                                    <span className="text-emerald-400">$ {fmt(tenant.totalRecaudo)}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 border-t border-slate-850 pt-3 mt-3">
                                {isEditing ? (
                                  <>
                                    <button
                                      onClick={() => handleSavePlanEdit(tenant.tenantId)}
                                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] uppercase tracking-wide py-2 rounded-lg cursor-pointer transition-colors"
                                    >
                                      Salvar
                                    </button>
                                    <button
                                      onClick={() => setEditingTenantId(null)}
                                      className="bg-slate-800 hover:bg-slate-700 text-slate-400 px-3 py-2 rounded-lg cursor-pointer text-[10px] font-bold"
                                    >
                                      Cancelar
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleImpersonate(tenant.tenantId, tenant.tenantName)}
                                      className="flex-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-600/30 font-extrabold text-[10px] uppercase tracking-wide py-2 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1"
                                      title="Entrar como esta empresa para visualizar o app sob a ótica deles"
                                    >
                                      <Play className="w-3 h-3 fill-current" /> Acessar Sistema
                                    </button>

                                    <button
                                      onClick={() => {
                                        setEditingTenantId(tenant.tenantId);
                                        setEditPlan(tenant.plan);
                                        setEditPrice(tenant.monthlyPrice.toString());
                                      }}
                                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-2 rounded-lg cursor-pointer text-[10px] font-bold border border-slate-700/50"
                                      title="Editar Plano SaaS"
                                    >
                                      <Sliders className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      onClick={() => handleToggleTenantActive(tenant.tenantId, tenant.active)}
                                      className={`px-2.5 py-2 rounded-lg cursor-pointer border text-[10px] font-bold transition-all ${
                                        tenant.active 
                                          ? 'bg-rose-950/20 text-rose-400 border-rose-900/30 hover:bg-rose-900 hover:text-white' 
                                          : 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30 hover:bg-emerald-900 hover:text-white'
                                      }`}
                                      title={tenant.active ? 'Suspender Licença' : 'Ativar Licença'}
                                    >
                                      {tenant.active ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}

              {/* TAB 3: GERENCIAR COLABORADORES */}
              {activeMenu === 'users' && (
                <motion.div
                  key="users"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                >
                  
                  {/* Create User Form */}
                  <div className="bg-[#0C1224] border border-slate-800/80 rounded-2xl p-6 self-start shadow-sm">
                    <h3 className="font-extrabold text-white text-sm mb-4 uppercase tracking-wide flex items-center gap-2 border-b border-slate-800/80 pb-3">
                      <Plus className="w-4 h-4 text-indigo-500" />
                      Novo Colaborador Comercial
                    </h3>
                    <form onSubmit={handleAddUser} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                          Nome Completo
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: João da Silva"
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          className="w-full bg-[#060913] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-indigo-500 transition-all font-bold placeholder-slate-600"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                          Email de Acesso
                        </label>
                        <input
                          type="email"
                          placeholder="joao@empresa.com"
                          required
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          className="w-full bg-[#060913] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-indigo-500 transition-all font-bold placeholder-slate-600"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                            Empresa Associada
                          </label>
                          <select
                            required
                            value={newUserTenant}
                            onChange={(e) => setNewUserTenant(e.target.value)}
                            className="w-full bg-[#060913] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none font-bold cursor-pointer"
                          >
                            <option value="">Selecione...</option>
                            {tenants.map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                            Função (Role)
                          </label>
                          <select
                            value={newUserRole}
                            onChange={(e) => setNewUserRole(e.target.value)}
                            className="w-full bg-[#060913] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none font-bold cursor-pointer"
                          >
                            <option value="admin">Administrador</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="vendedor">Vendedor</option>
                            <option value="cobrador">Cobrador</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={submittingUser}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-4 py-3 rounded-xl text-xs transition-colors shadow-lg shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
                      >
                        {submittingUser ? 'Sincronizando...' : 'Gravar no Firestore'}
                      </button>
                    </form>
                  </div>

                  {/* List of Users */}
                  <div className="lg:col-span-2 bg-[#0C1224] border border-slate-800/80 rounded-2xl overflow-hidden flex flex-col shadow-sm">
                    <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/30">
                      <h3 className="font-extrabold text-white text-sm">Colaboradores de Clientes</h3>
                      <span className="bg-slate-800 text-slate-400 text-xs px-3 py-1 rounded-full font-bold">Total: {users.length}</span>
                    </div>

                    <div className="overflow-y-auto max-h-[500px]">
                      <ul className="divide-y divide-slate-850">
                        {users.map(u => {
                          const associatedCompany = tenants.find(t => t.id === u.tenantId)?.name || 'Empresa Desconhecida';
                          return (
                            <li key={u.id} className="p-4 hover:bg-slate-800/10 flex items-center justify-between transition-colors">
                              <div className="min-w-0 flex-1 pr-4">
                                <div className="flex items-center gap-2.5">
                                  <span className="font-extrabold text-white text-xs truncate">{u.name || u.userName || 'Sem Nome'}</span>
                                  <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider ${
                                    u.role === 'admin' ? 'bg-purple-950 text-purple-300 border border-purple-900/30' :
                                    u.role === 'supervisor' ? 'bg-amber-950 text-amber-300 border border-amber-900/30' :
                                    'bg-slate-900 text-slate-400 border border-slate-800/30'
                                  }`}>
                                    {u.role}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-bold">
                                  <span className="font-mono">{u.email}</span>
                                  <span>·</span>
                                  <span className="text-indigo-400">Tenant: {associatedCompany}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2.5 shrink-0">
                                <button
                                  onClick={() => handleToggleUserActive(u.id, u.active)}
                                  className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wide cursor-pointer transition-all ${
                                    u.active
                                      ? 'bg-rose-950/20 text-rose-400 border-rose-900/20 hover:bg-rose-900 hover:text-white'
                                      : 'bg-emerald-950/20 text-emerald-400 border-emerald-900/20 hover:bg-emerald-900 hover:text-white'
                                  }`}
                                >
                                  {u.active ? 'Bloquear' : 'Desbloquear'}
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>

                </motion.div>
              )}

              {/* TAB 4: FINANÇAS & PROJEÇÕES */}
              {activeMenu === 'plans' && (
                <motion.div
                  key="plans"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* SaaS MRR Calculator Estimator */}
                    <div className="bg-[#0C1224] border border-slate-800/80 rounded-2xl p-6 shadow-sm">
                      <h3 className="font-extrabold text-white text-sm mb-4 uppercase tracking-wide flex items-center gap-2 border-b border-slate-800/80 pb-3">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        Simulador de Faturamento Direto (Projeção)
                      </h3>

                      <div className="space-y-6 mt-6">
                        <div>
                          <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                            <span>Quantidade de Empresas Clientes:</span>
                            <span className="text-white font-extrabold">{clientCountSim} empresas</span>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="250"
                            step="5"
                            value={clientCountSim}
                            onChange={(e) => setClientCountSim(parseInt(e.target.value))}
                            className="w-full accent-indigo-600 h-1.5 bg-[#060913] rounded-lg cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                            <span>Mensalidade Média por Empresa:</span>
                            <span className="text-white font-extrabold">$ {avgTicketSim} / mês</span>
                          </div>
                          <input
                            type="range"
                            min="49"
                            max="999"
                            step="25"
                            value={avgTicketSim}
                            onChange={(e) => setAvgTicketSim(parseInt(e.target.value))}
                            className="w-full accent-indigo-600 h-1.5 bg-[#060913] rounded-lg cursor-pointer"
                          />
                        </div>

                        <div className="bg-[#060913] p-5 rounded-xl border border-slate-850 space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-400 font-bold">Faturamento Mensal Estimado:</span>
                            <span className="text-xl font-black text-emerald-400 font-mono">$ {(clientCountSim * avgTicketSim).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between items-center border-t border-slate-850 pt-3">
                            <span className="text-xs text-slate-400 font-bold">Faturamento Anual Estimado:</span>
                            <span className="text-2xl font-black text-white font-mono">$ {(clientCountSim * avgTicketSim * 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Direct Payment Info */}
                    <div className="bg-[#0C1224] border border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                      <div>
                        <h3 className="font-extrabold text-white text-sm mb-4 uppercase tracking-wide flex items-center gap-2 border-b border-slate-800/80 pb-3">
                          <Layers className="w-4 h-4 text-indigo-500" />
                          Modelo de Negócio Unificado
                        </h3>

                        <div className="space-y-4 mt-6 text-xs text-slate-300">
                          <p className="leading-relaxed">
                            O sistema não utiliza cobrança automática por planos ou mensalidades integradas.
                            <strong> Toda empresa cadastrada tem acesso automático ao sistema em sua versão mais completa e robusta</strong>, sem restrições ou limitações artificiais de recursos.
                          </p>

                          <div className="bg-indigo-950/20 border border-indigo-900/35 p-4 rounded-xl space-y-2">
                            <span className="font-black text-indigo-300 text-xs block uppercase tracking-wide">💼 Faturamento Direto</span>
                            <span className="text-slate-400 text-[11px] font-bold block leading-relaxed">
                              O recebimento é feito de forma independente e direta (PIX, boleto ou contrato físico acordado diretamente com o cliente), permitindo flexibilidade total para negociar os valores individualmente para cada empresa.
                            </span>
                          </div>

                          <div className="bg-emerald-950/10 border border-emerald-900/20 p-4 rounded-xl space-y-2">
                            <span className="font-black text-emerald-400 text-xs block uppercase tracking-wide">🚀 Vantagens deste Modelo</span>
                            <ul className="list-disc pl-4 space-y-1.5 text-[11px] text-slate-400 font-bold">
                              <li>Autonomia absoluta na precificação por cliente</li>
                              <li>Retenção de 100% dos lucros sem intermediários de pagamento</li>
                              <li>Acesso irrestrito a caixas, rotas e colaboradores</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-500 font-bold border-t border-slate-850 pt-4 mt-6 text-center uppercase tracking-wide">
                        Insira os valores negociados no cadastro para acompanhar seu fluxo mensal consolidado
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 5: LIVE TERMINAL & AUDITORIA */}
              {activeMenu === 'logs' && (
                <motion.div
                  key="logs"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-8"
                >
                  <div className="bg-[#0C1224] border border-slate-800/80 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
                      <div className="flex items-center gap-3">
                        <Terminal className="w-5 h-5 text-indigo-500" />
                        <div>
                          <h3 className="font-extrabold text-white text-sm">Visualizador de Logs e Transações de Auditoria</h3>
                          <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-0.5">Simulação de telemetria operacional em tempo real</p>
                        </div>
                      </div>
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2.5 py-1 rounded-full font-black flex items-center gap-1.5 shadow-sm">
                        STREAM OPERACIONAL ATIVO
                      </span>
                    </div>

                    <div className="bg-[#060913] p-5 rounded-xl border border-slate-850 font-mono text-[11px] space-y-4 max-h-[500px] overflow-y-auto text-slate-300 shadow-inner">
                      {terminalLogs.map(log => (
                        <div key={log.id} className="flex gap-3 leading-relaxed border-b border-slate-850/50 pb-2">
                          <span className="text-slate-500 shrink-0">[{log.time}]</span>
                          <span className={`font-black shrink-0 ${
                            log.type === 'SUCCESS' ? 'text-emerald-400' :
                            log.type === 'ALERT' ? 'text-amber-400' :
                            log.type === 'WARN' ? 'text-rose-400' : 'text-blue-400'
                          }`}>
                            [{log.type}]
                          </span>
                          <span className="break-all">{log.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          )}

        </div>

        {/* INTERACTIVE SIDE PANEL (Selected Tenant Details Drawer) */}
        <AnimatePresence>
          {selectedTenantDetail && (
            <div className="fixed inset-0 z-50 flex justify-end">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedTenantDetail(null)}
                className="absolute inset-0 bg-[#060913]/90 cursor-pointer"
              />

              {/* Drawer Content */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                className="relative w-full max-w-xl bg-[#0C1224] h-full shadow-2xl border-l border-slate-800/80 flex flex-col z-10"
              >
                {/* Header */}
                <div className="p-6 bg-[#0E162C] border-b border-slate-800 text-white flex justify-between items-center shrink-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base tracking-tight text-white">{selectedTenantDetail.tenantName}</h3>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${
                        selectedTenantDetail.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {selectedTenantDetail.active ? 'Ativo' : 'Suspenso'}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[10px] mt-1 font-mono">Tenant ID: {selectedTenantDetail.tenantId}</p>
                  </div>
                  <button
                    onClick={() => setSelectedTenantDetail(null)}
                    className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Scrollable details */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  
                  {/* KPI Boxes inside tenant */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#060913] border border-slate-800 p-4 rounded-xl">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Recaudo Unificado (30d)</span>
                      <p className="text-lg font-black text-emerald-400 mt-1.5 font-mono">$ {fmt(selectedTenantDetail.totalRecaudo)}</p>
                    </div>

                    <div className="bg-[#060913] border border-slate-800 p-4 rounded-xl">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Status Operacional</span>
                      <p className="text-base font-black text-white mt-1.5">{selectedTenantDetail.totalBoxes} Caixas Totais</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 font-bold">
                        <span className="text-emerald-400">{selectedTenantDetail.openBoxes} caixas abertas</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing and License status */}
                  <div className="bg-[#060913] border border-slate-800 p-5 rounded-xl space-y-3.5">
                    <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-indigo-400" /> Detalhes da Licença SaaS
                    </h4>
                    
                    <div className="divide-y divide-slate-850 text-xs">
                      <div className="flex justify-between py-2">
                        <span className="text-slate-400">Plano Escolhido:</span>
                        <span className="font-extrabold text-white">{selectedTenantDetail.plan}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-slate-400">Preço Mensal Acordado:</span>
                        <span className="font-extrabold text-indigo-400">$ {selectedTenantDetail.monthlyPrice.toFixed(2)}/mês</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-slate-400">Dia de Cadastro:</span>
                        <span className="font-extrabold text-white">{selectedTenantDetail.createdAt ? selectedTenantDetail.createdAt.toDate().toLocaleDateString('pt-BR') : 'Demo'}</span>
                      </div>
                    </div>
                  </div>

                  {/* List of collaborators bound to this tenant */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-indigo-400" /> Colaboradores Vinculados ({selectedTenantDetail.totalUsers})
                    </h4>

                    <div className="border border-slate-800 rounded-xl divide-y divide-slate-850 overflow-hidden bg-[#060913] max-h-52 overflow-y-auto">
                      {users.filter(u => u.tenantId === selectedTenantDetail.tenantId).map(colab => (
                        <div key={colab.id} className="p-3 flex items-center justify-between hover:bg-slate-800/10 transition-colors">
                          <div className="min-w-0 flex-1 pr-3">
                            <p className="font-extrabold text-white text-xs truncate">{colab.name || colab.userName || 'Sem Nome'}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{colab.email}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider shrink-0 ${
                            colab.role === 'admin' ? 'bg-purple-950 text-purple-300' : 'bg-slate-900 text-slate-400'
                          }`}>
                            {colab.role}
                          </span>
                        </div>
                      ))}
                      {users.filter(u => u.tenantId === selectedTenantDetail.tenantId).length === 0 && (
                        <p className="p-4 text-center text-xs text-slate-500 italic">Nenhum colaborador registrado para esta empresa.</p>
                      )}
                    </div>
                  </div>

                  {/* Impersonate Toggle */}
                  <div className="border-t border-slate-800 pt-5 space-y-3 shrink-0">
                    <button
                      onClick={() => handleImpersonate(selectedTenantDetail.tenantId, selectedTenantDetail.tenantName)}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider py-3 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/10"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Entrar como Empresa (Impersonar)
                    </button>
                    <button
                      onClick={() => handleToggleTenantActive(selectedTenantDetail.tenantId, selectedTenantDetail.active)}
                      className={`w-full py-3 rounded-xl cursor-pointer text-xs font-extrabold transition-all border ${
                        selectedTenantDetail.active
                          ? 'bg-rose-950/20 text-rose-400 border-rose-900/30 hover:bg-rose-900 hover:text-white'
                          : 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30 hover:bg-emerald-900 hover:text-white'
                      }`}
                    >
                      {selectedTenantDetail.active ? 'Bloquear Licença / Suspender' : 'Desbloquear Licença / Ativar'}
                    </button>
                  </div>

                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* AI Voice Assistant for Super Admin */}
        <AIVoiceAssistant language="pt" />

      </main>
    </div>
  );
}
