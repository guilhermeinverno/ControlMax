import { lazy, Suspense, useState, useEffect, type ComponentType } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { User } from 'firebase/auth';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { auth, onAuthStateChanged } from '../lib/firebase';
import { useTenant } from '../hooks/useTenant';
import { useNavigation } from '../context/NavigationContext';
import { Layout } from '../screens/components/Layout';
import { Login } from '../screens/Login';
import { SuperAdmin } from '../screens/SuperAdmin';
import { Dashboard } from '../screens/Dashboard';

// Lazy loading all screen components for optimized code-splitting and performance
// Dashboard is imported statically above to ensure correct React context and hook resolution
const Statistics = lazy(() => import('../screens/Statistics').then(m => ({ default: m.Statistics })));
const Forms = lazy(() => import('../screens/Forms').then(m => ({ default: m.Forms })));
const SalesList = lazy(() => import('../screens/SalesList').then(m => ({ default: m.SalesList })));
const Summary = lazy(() => import('../screens/Summary').then(m => ({ default: m.Summary })));
const Holidays = lazy(() => import('../screens/Holidays').then(m => ({ default: m.Holidays })));
const EditRoute = lazy(() => import('../screens/EditRoute').then(m => ({ default: m.EditRoute })));
const RouteList = lazy(() => import('../screens/RouteList').then(m => ({ default: m.RouteList })));
const UserList = lazy(() => import('../screens/UserList').then(m => ({ default: m.UserList })));
const DeviceList = lazy(() => import('../screens/DeviceList').then(m => ({ default: m.DeviceList })));
const EditDevice = lazy(() => import('../screens/EditDevice').then(m => ({ default: m.EditDevice })));
const CompanyList = lazy(() => import('../screens/CompanyList').then(m => ({ default: m.CompanyList })));
const SaleDetail = lazy(() => import('../screens/SaleDetail').then(m => ({ default: m.SaleDetail })));
const RegisterPayment = lazy(() => import('../screens/RegisterPayment').then(m => ({ default: m.RegisterPayment })));
const PaymentHistory = lazy(() => import('../screens/PaymentHistory').then(m => ({ default: m.PaymentHistory })));
const OpenBox = lazy(() => import('../screens/OpenBox').then(m => ({ default: m.OpenBox })));
const CloseBox = lazy(() => import('../screens/CloseBox').then(m => ({ default: m.CloseBox })));
const NewIncome = lazy(() => import('../screens/NewIncome').then(m => ({ default: m.NewIncome })));
const NewExpense = lazy(() => import('../screens/NewExpense').then(m => ({ default: m.NewExpense })));
const Performance = lazy(() => import('../screens/Performance').then(m => ({ default: m.Performance })));
const BoxSummary = lazy(() => import('../screens/BoxSummary').then(m => ({ default: m.BoxSummary })));
const TransferSales = lazy(() => import('../screens/TransferSales').then(m => ({ default: m.TransferSales })));
const MassBoxOpening = lazy(() => import('../screens/MassBoxOpening').then(m => ({ default: m.MassBoxOpening })));
const AutoKeys = lazy(() => import('../screens/AutoKeys').then(m => ({ default: m.AutoKeys })));
const CreditRequests = lazy(() => import('../screens/CreditRequests').then(m => ({ default: m.CreditRequests })));
const BusinessCenters = lazy(() => import('../screens/BusinessCenters').then(m => ({ default: m.BusinessCenters })));
const CollectionCleaning = lazy(() => import('../screens/CollectionCleaning').then(m => ({ default: m.CollectionCleaning })));
const PeriodSummary = lazy(() => import('../screens/PeriodSummary').then(m => ({ default: m.PeriodSummary })));
const PlatformManagement = lazy(() => import('../screens/PlatformManagement').then(m => ({ default: m.PlatformManagement })));
const AIAssistant = lazy(() => import('../screens/AIAssistant').then(m => ({ default: m.AIAssistant })));
const CollectorMap = lazy(() => import('../screens/CollectorMap').then(m => ({ default: m.CollectorMap })));
const WorkerProfile = lazy(() => import('../screens/WorkerProfile').then(m => ({ default: m.WorkerProfile })));

const BCIncomes = lazy(() => import('../screens/BCIncomes').then(m => ({ default: m.BCIncomes })));
const BCExpenses = lazy(() => import('../screens/BCExpenses').then(m => ({ default: m.BCExpenses })));
const BCTransfers = lazy(() => import('../screens/BCTransfers').then(m => ({ default: m.BCTransfers })));
const BCApprovals = lazy(() => import('../screens/BCApprovals').then(m => ({ default: m.BCApprovals })));
const BCMap = lazy(() => import('../screens/BCMap').then(m => ({ default: m.BCMap })));
const Insurance = lazy(() => import('../screens/Insurance').then(m => ({ default: m.Insurance })));
const Finance = lazy(() => import('../screens/Finance').then(m => ({ default: m.Finance })));

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

  const { isSuperAdmin, loading: tenantLoading, error: tenantError, retry } = useTenant();
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

  const isSuperByEmail = fbUser?.email?.toLowerCase() === 'gringoeletronica@gmail.com' || fbUser?.email?.toLowerCase() === 'controlmaxia@gmail.com';

  return (
    <Layout currentScreen={navState.screen} onNavigate={navigate} isSuperAdmin={isSuperAdmin || isSuperByEmail}>
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
    const isSuperByEmail = fbUser?.email?.toLowerCase() === 'gringoeletronica@gmail.com' || fbUser?.email?.toLowerCase() === 'controlmaxia@gmail.com';
    return <Navigate to={(isSuperAdmin || isSuperByEmail) ? "/superadmin" : "/dashboard"} replace />;
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

  const isSuperByEmail = fbUser?.email?.toLowerCase() === 'gringoeletronica@gmail.com' || fbUser?.email?.toLowerCase() === 'controlmaxia@gmail.com';

  return (isSuperAdmin || isSuperByEmail) ? (
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
        <Route path="/forms" element={<ScreenWrapper Component={Forms} />} />
        <Route path="/sales" element={<ScreenWrapper Component={SalesList} />} />
        <Route path="/summary" element={<ScreenWrapper Component={Summary} />} />
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
        <Route path="/box-summary" element={<ScreenWrapper Component={BoxSummary} />} />
        <Route path="/transfer-sales" element={<ScreenWrapper Component={TransferSales} />} />
        <Route path="/mass-box-opening" element={<ScreenWrapper Component={MassBoxOpening} />} />
        <Route path="/auto-keys" element={<ScreenWrapper Component={AutoKeys} />} />
        <Route path="/credit-requests" element={<ScreenWrapper Component={CreditRequests} />} />
        <Route path="/business-centers" element={<ScreenWrapper Component={BusinessCenters} />} />
        <Route path="/collection-cleaning" element={<ScreenWrapper Component={CollectionCleaning} />} />
        <Route path="/period-summary" element={<ScreenWrapper Component={PeriodSummary} />} />
        <Route path="/platform-management" element={<ScreenWrapper Component={PlatformManagement} />} />
        <Route path="/ai-assistant" element={<ScreenWrapper Component={AIAssistant} />} />
        <Route path="/worker-profile" element={<ScreenWrapper Component={WorkerProfile} />} />

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
