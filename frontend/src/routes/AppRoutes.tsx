import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useTenant } from '../hooks/useTenant';
import { useNavigation } from '../context/NavigationContext';
import { Layout } from '../screens/components/Layout';
import { Login } from '../screens/Login';
import { SuperAdmin } from '../screens/SuperAdmin';
import { Dashboard } from '../screens/Dashboard';

// Lazy loading all screen components for optimized code-splitting and performance
// Dashboard is imported statically above to ensure correct React context and hook resolution
const Statistics = React.lazy(() => import('../screens/Statistics').then(m => ({ default: m.Statistics })));
const Forms = React.lazy(() => import('../screens/Forms').then(m => ({ default: m.Forms })));
const SalesList = React.lazy(() => import('../screens/SalesList').then(m => ({ default: m.SalesList })));
const Summary = React.lazy(() => import('../screens/Summary').then(m => ({ default: m.Summary })));
const Holidays = React.lazy(() => import('../screens/Holidays').then(m => ({ default: m.Holidays })));
const EditRoute = React.lazy(() => import('../screens/EditRoute').then(m => ({ default: m.EditRoute })));
const RouteList = React.lazy(() => import('../screens/RouteList').then(m => ({ default: m.RouteList })));
const UserList = React.lazy(() => import('../screens/UserList').then(m => ({ default: m.UserList })));
const DeviceList = React.lazy(() => import('../screens/DeviceList').then(m => ({ default: m.DeviceList })));
const EditDevice = React.lazy(() => import('../screens/EditDevice').then(m => ({ default: m.EditDevice })));
const CompanyList = React.lazy(() => import('../screens/CompanyList').then(m => ({ default: m.CompanyList })));
const SaleDetail = React.lazy(() => import('../screens/SaleDetail').then(m => ({ default: m.SaleDetail })));
const RegisterPayment = React.lazy(() => import('../screens/RegisterPayment').then(m => ({ default: m.RegisterPayment })));
const PaymentHistory = React.lazy(() => import('../screens/PaymentHistory').then(m => ({ default: m.PaymentHistory })));
const OpenBox = React.lazy(() => import('../screens/OpenBox').then(m => ({ default: m.OpenBox })));
const CloseBox = React.lazy(() => import('../screens/CloseBox').then(m => ({ default: m.CloseBox })));
const NewIncome = React.lazy(() => import('../screens/NewIncome').then(m => ({ default: m.NewIncome })));
const NewExpense = React.lazy(() => import('../screens/NewExpense').then(m => ({ default: m.NewExpense })));
const Performance = React.lazy(() => import('../screens/Performance').then(m => ({ default: m.Performance })));
const BoxSummary = React.lazy(() => import('../screens/BoxSummary').then(m => ({ default: m.BoxSummary })));
const TransferSales = React.lazy(() => import('../screens/TransferSales').then(m => ({ default: m.TransferSales })));
const MassBoxOpening = React.lazy(() => import('../screens/MassBoxOpening').then(m => ({ default: m.MassBoxOpening })));
const AutoKeys = React.lazy(() => import('../screens/AutoKeys').then(m => ({ default: m.AutoKeys })));
const CreditRequests = React.lazy(() => import('../screens/CreditRequests').then(m => ({ default: m.CreditRequests })));
const BusinessCenters = React.lazy(() => import('../screens/BusinessCenters').then(m => ({ default: m.BusinessCenters })));
const CollectionCleaning = React.lazy(() => import('../screens/CollectionCleaning').then(m => ({ default: m.CollectionCleaning })));
const PeriodSummary = React.lazy(() => import('../screens/PeriodSummary').then(m => ({ default: m.PeriodSummary })));
const PlatformManagement = React.lazy(() => import('../screens/PlatformManagement').then(m => ({ default: m.PlatformManagement })));
const AIAssistant = React.lazy(() => import('../screens/AIAssistant').then(m => ({ default: m.AIAssistant })));
const CollectorMap = React.lazy(() => import('../screens/CollectorMap').then(m => ({ default: m.CollectorMap })));

const BCIncomes = React.lazy(() => import('../screens/BCIncomes').then(m => ({ default: m.BCIncomes })));
const BCExpenses = React.lazy(() => import('../screens/BCExpenses').then(m => ({ default: m.BCExpenses })));
const BCTransfers = React.lazy(() => import('../screens/BCTransfers').then(m => ({ default: m.BCTransfers })));
const BCApprovals = React.lazy(() => import('../screens/BCApprovals').then(m => ({ default: m.BCApprovals })));
const BCMap = React.lazy(() => import('../screens/BCMap').then(m => ({ default: m.BCMap })));
const Insurance = React.lazy(() => import('../screens/Insurance').then(m => ({ default: m.Insurance })));
const Finance = React.lazy(() => import('../screens/Finance').then(m => ({ default: m.Finance })));

/**
 * ScreenWrapper provides backward-compatibility for legacy screens.
 * It automatically injects the `onNavigate` and `params` props.
 */
function ScreenWrapper({ Component }: { Component: React.ComponentType<Record<string, unknown>> }) {
  const { navigate, navState } = useNavigation();
  return <Component onNavigate={navigate} params={navState.params} />;
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

  const { isSuperAdmin, loading: tenantLoading } = useTenant();
  const { navState, navigate } = useNavigation();

  if (authLoading || (fbUser && tenantLoading)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[#6A008A] border-t-transparent rounded-full animate-spin mb-4" />
          <div className="text-[#6A008A] font-medium">Cargando aplicación...</div>
        </div>
      </div>
    );
  }

  if (!fbUser) {
    return <Navigate to="/login" replace />;
  }

  const isSuperByEmail = fbUser?.email?.toLowerCase() === 'maildojg@gmail.com';

  return (
    <Layout currentScreen={navState.screen} onNavigate={navigate} isSuperAdmin={isSuperAdmin || isSuperByEmail}>
      <React.Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="text-[#6A008A] text-sm font-medium">Cargando...</div>
        </div>
      }>
        <Outlet />
      </React.Suspense>
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

  const { isSuperAdmin, loading: tenantLoading } = useTenant();

  if (authLoading || (fbUser && tenantLoading)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[#6A008A] border-t-transparent rounded-full animate-spin mb-4" />
          <div className="text-[#6A008A] font-medium">Cargando aplicación...</div>
        </div>
      </div>
    );
  }

  if (fbUser) {
    const isSuperByEmail = fbUser?.email?.toLowerCase() === 'maildojg@gmail.com';
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

  const { isSuperAdmin, loading: tenantLoading } = useTenant();

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

  if (!fbUser) {
    return <Navigate to="/login" replace />;
  }

  const isSuperByEmail = fbUser?.email?.toLowerCase() === 'maildojg@gmail.com';

  return (isSuperAdmin || isSuperByEmail) ? (
    <React.Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F19]">
        <div className="text-slate-400 text-sm font-medium">Carregando painel corporativo...</div>
      </div>
    }>
      <SuperAdmin />
    </React.Suspense>
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
