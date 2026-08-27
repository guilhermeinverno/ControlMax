import { lazy, Suspense, useState, useEffect, type ComponentType, useRef } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { User } from 'firebase/auth';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { auth, onAuthStateChanged } from '../lib/firebase';
import { useTenant } from '../hooks/useTenant';
import { useNavigation } from '../context/NavigationContext';
import { Layout } from '../screens/components/Layout';
import { Login } from '../screens/Login';
import { SuperAdmin } from '../screens/SuperAdmin';
import { Dashboard } from '../screens/Dashboard';
import { hasPermission } from '../utils/rbac';
import { toast } from 'react-hot-toast';

// Helper to retry loading dynamic imports on deployment or chunk load failures
function lazyRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T } | { [key: string]: any }>
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      const result = await factory();
      if ('default' in result) {
        return result as { default: T };
      }
      const keys = Object.keys(result);
      return { default: result[keys[0]] } as { default: T };
    } catch (error) {
      console.error('Chunk load error, retrying page reload...', error);
      const isRetry = window.sessionStorage.getItem('lazy-retry-done');
      if (!isRetry) {
        window.sessionStorage.setItem('lazy-retry-done', 'true');
        window.location.reload();
      }
      throw error;
    }
  });
}

// Lazy loading all screen components for optimized code-splitting and performance
// Dashboard is imported statically above to ensure correct React context and hook resolution
const Statistics = lazyRetry(() => import('../screens/Statistics').then(m => ({ default: m.Statistics })));
const Forms = lazyRetry(() => import('../screens/Forms').then(m => ({ default: m.Forms })));
const SalesList = lazyRetry(() => import('../screens/SalesList').then(m => ({ default: m.SalesList })));
const Summary = lazyRetry(() => import('../screens/Summary').then(m => ({ default: m.Summary })));
const Holidays = lazyRetry(() => import('../screens/Holidays').then(m => ({ default: m.Holidays })));
const EditRoute = lazyRetry(() => import('../screens/EditRoute').then(m => ({ default: m.EditRoute })));
const RouteList = lazyRetry(() => import('../screens/RouteList').then(m => ({ default: m.RouteList })));
const UserList = lazyRetry(() => import('../screens/UserList').then(m => ({ default: m.UserList })));
const DeviceList = lazyRetry(() => import('../screens/DeviceList').then(m => ({ default: m.DeviceList })));
const EditDevice = lazyRetry(() => import('../screens/EditDevice').then(m => ({ default: m.EditDevice })));
const CompanyList = lazyRetry(() => import('../screens/CompanyList').then(m => ({ default: m.CompanyList })));
const SaleDetail = lazyRetry(() => import('../screens/SaleDetail').then(m => ({ default: m.SaleDetail })));
const RegisterPayment = lazyRetry(() => import('../screens/RegisterPayment').then(m => ({ default: m.RegisterPayment })));
const PaymentHistory = lazyRetry(() => import('../screens/PaymentHistory').then(m => ({ default: m.PaymentHistory })));
const OpenBox = lazyRetry(() => import('../screens/OpenBox').then(m => ({ default: m.OpenBox })));
const CloseBox = lazyRetry(() => import('../screens/CloseBox').then(m => ({ default: m.CloseBox })));
const NewIncome = lazyRetry(() => import('../screens/NewIncome').then(m => ({ default: m.NewIncome })));
const NewExpense = lazyRetry(() => import('../screens/NewExpense').then(m => ({ default: m.NewExpense })));
const Performance = lazyRetry(() => import('../screens/Performance').then(m => ({ default: m.Performance })));
const BoxSummary = lazyRetry(() => import('../screens/BoxSummary').then(m => ({ default: m.BoxSummary })));
const TransferSales = lazyRetry(() => import('../screens/TransferSales').then(m => ({ default: m.TransferSales })));
const MassBoxOpening = lazyRetry(() => import('../screens/MassBoxOpening').then(m => ({ default: m.MassBoxOpening })));
const MassBoxClosing = lazyRetry(() => import('../screens/MassBoxClosing').then(m => ({ default: m.MassBoxClosing })));
const AutoKeys = lazyRetry(() => import('../screens/AutoKeys').then(m => ({ default: m.AutoKeys })));
const CreditRequests = lazyRetry(() => import('../screens/CreditRequests').then(m => ({ default: m.CreditRequests })));
const BusinessCenters = lazyRetry(() => import('../screens/BusinessCenters').then(m => ({ default: m.BusinessCenters })));
const CollectionCleaning = lazyRetry(() => import('../screens/CollectionCleaning').then(m => ({ default: m.CollectionCleaning })));
const PeriodSummary = lazyRetry(() => import('../screens/PeriodSummary').then(m => ({ default: m.PeriodSummary })));
const PlatformManagement = lazyRetry(() => import('../screens/PlatformManagement').then(m => ({ default: m.PlatformManagement })));
const AIAssistant = lazyRetry(() => import('../screens/AIAssistant').then(m => ({ default: m.AIAssistant })));
const CollectorMap = lazyRetry(() => import('../screens/CollectorMap').then(m => ({ default: m.CollectorMap })));
const WorkerProfile = lazyRetry(() => import('../screens/WorkerProfile').then(m => ({ default: m.WorkerProfile })));
const Profiles = lazyRetry(() => import('../screens/Profiles').then(m => ({ default: m.Profiles })));
const RoleManagement = lazyRetry(() => import('../screens/RoleManagement').then(m => ({ default: m.RoleManagement })));
const VendedorMobile = lazyRetry(() => import('../screens/VendedorMobile').then(m => ({ default: m.VendedorMobile })));
const AuditLogs = lazyRetry(() => import('../screens/AuditLogs').then(m => ({ default: m.AuditLogs })));
const ReportsHub = lazyRetry(() => import('../screens/ReportsHub').then(m => ({ default: m.ReportsHub })));
const CustomerBlacklist = lazyRetry(() => import('../screens/CustomerBlacklist').then(m => ({ default: m.CustomerBlacklist })));

const BCIncomes = lazyRetry(() => import('../screens/BCIncomes').then(m => ({ default: m.BCIncomes })));
const BCExpenses = lazyRetry(() => import('../screens/BCExpenses').then(m => ({ default: m.BCExpenses })));
const BCTransfers = lazyRetry(() => import('../screens/BCTransfers').then(m => ({ default: m.BCTransfers })));
const BCApprovals = lazyRetry(() => import('../screens/BCApprovals').then(m => ({ default: m.BCApprovals })));
const BCMap = lazyRetry(() => import('../screens/BCMap').then(m => ({ default: m.BCMap })));
const Insurance = lazyRetry(() => import('../screens/Insurance').then(m => ({ default: m.Insurance })));
const Finance = lazyRetry(() => import('../screens/Finance').then(m => ({ default: m.Finance })));

/**
 * ScreenWrapper provides backward-compatibility for legacy screens.
 * It automatically injects the `onNavigate` and `params` props.
 */
function ScreenWrapper({ Component }: { Component: ComponentType<Record<string, unknown>> }) {
  const { navigate, navState } = useNavigation();
  return <Component onNavigate={navigate} params={navState.params} />;
}

function AppLoadingSpinner({ label }: { label: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-[#6A008A] border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-[#6A008A] font-medium">{label}</div>
      </div>
    </div>
  );
}

function TenantBootstrapError({
  message,
  onRetry,
  variant = 'light',
}: {
  message: string;
  onRetry: () => void;
  variant?: 'light' | 'dark';
}) {
  const isDark = variant === 'dark';

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${isDark ? 'bg-[#0B0F19]' : 'bg-gray-50'}`}>
      <div className={`max-w-md w-full border rounded-lg p-6 shadow-sm ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-red-200'}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className={`w-6 h-6 shrink-0 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
          <div className="space-y-3">
            <div>
              <h2 className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-red-800'}`}>
                Não foi possível carregar sua sessão
              </h2>
              <p className={`text-xs mt-1 break-words ${isDark ? 'text-slate-400' : 'text-red-700'}`}>{message}</p>
            </div>
            <button
              type="button"
              onClick={onRetry}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-sm ${
                isDark
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  : 'bg-[#6A008A] hover:bg-[#581c87] text-white'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProtectedRouteProps {
  permission: string;
  redirectTo?: string;
}

function ProtectedRoute({ permission, redirectTo = '/dashboard' }: ProtectedRouteProps) {
  const { role, permissions, loading } = useTenant();
  const location = useLocation();
  const toastFired = useRef(false);

  useEffect(() => {
    if (!loading) {
      const user = { role: role || '', permissions };
      const allowed = hasPermission(user, permission);
      if (!allowed && !toastFired.current) {
        toastFired.current = true;
        toast.error('Acesso negado: Você não tem permissão para acessar este recurso.');
        setTimeout(() => {
          toastFired.current = false;
        }, 3000);
      }
    }
  }, [loading, role, permissions, permission]);

  if (loading) {
    return null;
  }

  const user = { role: role || '', permissions };
  const allowed = hasPermission(user, permission);

  if (!allowed) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}

/**
 * PrivateLayout handles user authorization verification, displays a loader while
 * states are synchronizing, protects private routes, and mounts the persistent navigation Layout.
 */
function PrivateLayout() {
  const [fbUser, setFbUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFbUser(user);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const { role, isSuperAdmin, loading: tenantLoading, error: tenantError, retry } = useTenant();
  const { navState, navigate } = useNavigation();

  if (authLoading || (fbUser && tenantLoading)) {
    return <AppLoadingSpinner label="Cargando aplicación..." />;
  }

  if (fbUser && tenantError) {
    return <TenantBootstrapError message={tenantError} onRetry={retry} />;
  }

  if (!fbUser) {
    return <Navigate to="/login" replace />;
  }

  // Restrição Corporativa: Vendedores/Cobradores (role: collector) devem acessar exclusivamente pelo App Móvel/PWA
  const isMobileAppOrPwa = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    navigator.userAgent.includes('ControlMaxApp') ||
    navigator.userAgent.includes('Capacitor') ||
    navigator.userAgent.includes('Cordova') ||
    (window as any).Capacitor !== undefined ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  );

  if (role === 'collector' && !isMobileAppOrPwa) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-6 text-center text-white select-none">
        <div className="bg-slate-800 border border-slate-700 rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center space-y-5">
          <div className="w-20 h-20 rounded-full bg-purple-900/50 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-white tracking-wide">Acesso Restrito ao Aplicativo</h2>
          <p className="text-slate-300 text-xs leading-relaxed font-medium">
            Vendedores e Cobradores devem realizar o login exclusivamente através do <strong>Aplicativo Móvel ControlMax</strong> instalado no seu dispositivo Android.
          </p>
          <div className="bg-purple-950/60 border border-purple-800/40 rounded-xl p-3 text-purple-300 text-[11px] font-bold">
            📱 Abra o aplicativo ControlMax no seu celular para continuar.
          </div>
          <button
            onClick={() => auth.signOut()}
            className="w-full bg-red-600/80 hover:bg-red-600 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-colors cursor-pointer"
          >
            Sair da Conta
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout currentScreen={navState.screen} onNavigate={navigate} isSuperAdmin={isSuperAdmin}>
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="text-[#6A008A] text-sm font-medium">Cargando...</div>
        </div>
      }>
        <Outlet />
      </Suspense>
    </Layout>
  );
}

/**
 * PublicRoute ensures that authenticated users are auto-redirected to /dashboard (or /superadmin)
 * instead of displaying the Login form again.
 */
function PublicRoute() {
  const [fbUser, setFbUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFbUser(user);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const { isSuperAdmin, loading: tenantLoading, error: tenantError, retry } = useTenant();

  if (authLoading || (fbUser && tenantLoading)) {
    return <AppLoadingSpinner label="Cargando aplicación..." />;
  }

  if (fbUser && tenantError) {
    return <TenantBootstrapError message={tenantError} onRetry={retry} />;
  }

  if (fbUser) {
    return <Navigate to={isSuperAdmin ? "/superadmin" : "/dashboard"} replace />;
  }

  return <Login onSuccess={() => {}} />;
}

/**
 * SuperAdminRoute restricts access to superadmin pages, redirecting unprivileged users.
 * Runs independently from the tenant PrivateLayout to render a completely dedicated,
 * custom SaaS owner portal.
 */
function SuperAdminRoute() {
  const [fbUser, setFbUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFbUser(user);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const { isSuperAdmin, loading: tenantLoading, error: tenantError, retry } = useTenant();

  if (authLoading || (fbUser && tenantLoading)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0F19]">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
          <div className="text-slate-400 text-sm font-medium">Carregando Painel de Controle SaaS...</div>
        </div>
      </div>
    );
  }

  if (fbUser && tenantError) {
    return <TenantBootstrapError message={tenantError} onRetry={retry} variant="dark" />;
  }

  if (!fbUser) {
    return <Navigate to="/login" replace />;
  }

  return isSuperAdmin ? (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F19]">
        <div className="text-slate-400 text-sm font-medium">Carregando painel corporativo...</div>
      </div>
    }>
      <SuperAdmin />
    </Suspense>
  ) : (
    <Navigate to="/dashboard" replace />
  );
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute />} />

      {/* Private Routes (wrapped with layout & auth guards) */}
      <Route element={<PrivateLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<ScreenWrapper Component={Dashboard} />} />
        <Route path="/statistics" element={<ScreenWrapper Component={Statistics} />} />
        <Route path="/audit-logs" element={<ScreenWrapper Component={AuditLogs} />} />
        <Route path="/forms" element={<ScreenWrapper Component={Forms} />} />
        <Route path="/sales" element={<ScreenWrapper Component={SalesList} />} />
        <Route path="/holidays" element={<ScreenWrapper Component={Holidays} />} />
        <Route path="/edit-route" element={<ScreenWrapper Component={EditRoute} />} />
        <Route path="/route-list" element={<ScreenWrapper Component={RouteList} />} />
        <Route path="/user-list" element={<ScreenWrapper Component={UserList} />} />
        <Route path="/device-list" element={<ScreenWrapper Component={DeviceList} />} />
        <Route path="/edit-device" element={<ScreenWrapper Component={EditDevice} />} />
        <Route path="/company-list" element={<ScreenWrapper Component={CompanyList} />} />
        <Route path="/sale-detail" element={<ScreenWrapper Component={SaleDetail} />} />
        <Route path="/register-payment" element={<ScreenWrapper Component={RegisterPayment} />} />
        <Route path="/payment-history" element={<ScreenWrapper Component={PaymentHistory} />} />
        <Route path="/open-box" element={<ScreenWrapper Component={OpenBox} />} />
        <Route path="/close-box" element={<ScreenWrapper Component={CloseBox} />} />
        <Route path="/new-income" element={<ScreenWrapper Component={NewIncome} />} />
        <Route path="/new-expense" element={<ScreenWrapper Component={NewExpense} />} />
        <Route path="/performance" element={<ScreenWrapper Component={Performance} />} />
        
        {/* Protected Routes (Auditoria, Fechamento Geral, Configurações de Unidades) */}
        <Route element={<ProtectedRoute permission="caja:confirmar" />}>
          <Route path="/dashboard/auditoria" element={<ScreenWrapper Component={PeriodSummary} />} />
          <Route path="/summary" element={<ScreenWrapper Component={Summary} />} />
          <Route path="/period-summary" element={<ScreenWrapper Component={PeriodSummary} />} />
          <Route path="/box-summary" element={<ScreenWrapper Component={BoxSummary} />} />
          <Route path="/business-centers" element={<ScreenWrapper Component={BusinessCenters} />} />
          <Route path="/platform-management" element={<ScreenWrapper Component={PlatformManagement} />} />
          <Route path="/profiles" element={<ScreenWrapper Component={Profiles} />} />
          <Route path="/role-management" element={<ScreenWrapper Component={RoleManagement} />} />
        </Route>

        <Route path="/transfer-sales" element={<ScreenWrapper Component={TransferSales} />} />
        <Route path="/mass-box-opening" element={<ScreenWrapper Component={MassBoxOpening} />} />
        <Route path="/mass-box-closing" element={<ScreenWrapper Component={MassBoxClosing} />} />
        <Route path="/reports-hub" element={<ScreenWrapper Component={ReportsHub} />} />
        <Route path="/customer-blacklist" element={<ScreenWrapper Component={CustomerBlacklist} />} />
        <Route path="/auto-keys" element={<ScreenWrapper Component={AutoKeys} />} />
        <Route path="/credit-requests" element={<ScreenWrapper Component={CreditRequests} />} />
        <Route path="/collection-cleaning" element={<ScreenWrapper Component={CollectionCleaning} />} />
        <Route path="/ai-assistant" element={<ScreenWrapper Component={AIAssistant} />} />
        <Route path="/worker-profile" element={<ScreenWrapper Component={WorkerProfile} />} />
        <Route path="/vendedor-mobile" element={<ScreenWrapper Component={VendedorMobile} />} />

        {/* Business Center Specifics */}
        <Route path="/bc-incomes" element={<ScreenWrapper Component={BCIncomes} />} />
        <Route path="/bc-expenses" element={<ScreenWrapper Component={BCExpenses} />} />
        <Route path="/bc-transfers" element={<ScreenWrapper Component={BCTransfers} />} />
        <Route path="/bc-approvals" element={<ScreenWrapper Component={BCApprovals} />} />
        <Route path="/bc-map" element={<ScreenWrapper Component={BCMap} />} />
        <Route path="/insurance" element={<ScreenWrapper Component={Insurance} />} />
        <Route path="/finance" element={<ScreenWrapper Component={Finance} />} />
        <Route path="/collector-map" element={<ScreenWrapper Component={CollectorMap} />} />
      </Route>

      {/* Super Admin Restricted Route - Self-contained, premium visual workspace */}
      <Route path="/superadmin" element={<SuperAdminRoute />} />

      {/* Fallback Catch-All Route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
