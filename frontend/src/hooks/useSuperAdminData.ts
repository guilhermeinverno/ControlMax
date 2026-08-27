import { useState, useEffect, useMemo, useCallback } from 'react';
import type { HtmlFormSubmitEvent } from '../types/reactEvents';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import type {
  TenantDoc,
  UserDoc,
  BoxDoc,
  SaleDoc,
  CollectionDoc,
  TenantMetrics,
  TerminalLog,
  TenantStatusFilter,
  TenantSortBy,
} from '../types/superAdmin';
import { loadSuperAdminData } from '../utils/superAdminDataLoader';
import {
  buildTenantMetrics,
  filterAndSortTenants,
  computeSuperAdminKpis,
} from '../utils/superAdminMetrics';
import {
  createInitialTerminalLogs,
  createSimulatedTerminalLog,
  prependTerminalLog,
  createActionTerminalLog,
} from '../utils/superAdminTerminalLogs';
import type { SaasBillingSummary, SaasInvoice } from '../types/superAdmin';
import {
  createSaasInvoice,
  fetchSaasBillingSummary,
  fetchSaasInvoices,
  markSaasInvoicePaid,
  updateTenantBilling,
} from '../utils/saasBillingApi';

export function useSuperAdminData() {
  const [tenants, setTenants] = useState<TenantDoc[]>([]);
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [boxes, setBoxes] = useState<BoxDoc[]>([]);
  const [sales, setSales] = useState<SaleDoc[]>([]);
  const [collections, setCollections] = useState<CollectionDoc[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedTenantDetail, setSelectedTenantDetail] = useState<TenantMetrics | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TenantStatusFilter>('all');
  const [sortBy, setSortBy] = useState<TenantSortBy>('recaudo');

  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantPrice, setNewTenantPrice] = useState('199.00');
  const [newTenantAdminName, setNewTenantAdminName] = useState('');
  const [newTenantAdminEmail, setNewTenantAdminEmail] = useState('');
  const [submittingTenant, setSubmittingTenant] = useState(false);

  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('admin');
  const [newUserTenant, setNewUserTenant] = useState('');
  const [submittingUser, setSubmittingUser] = useState(false);

  const [editingTenantId, setEditingTenantId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('199.00');

  const [clientCountSim, setClientCountSim] = useState(25);
  const [avgTicketSim, setAvgTicketSim] = useState(199);
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([]);
  const [billingSummary, setBillingSummary] = useState<SaasBillingSummary | null>(null);
  const [tenantInvoices, setTenantInvoices] = useState<SaasInvoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, summary] = await Promise.all([
        loadSuperAdminData(),
        fetchSaasBillingSummary().catch(() => null),
      ]);
      setTenants(data.tenants);
      setUsers(data.users);
      setBoxes(data.boxes);
      setSales(data.sales);
      setCollections(data.collections);
      if (summary) setBillingSummary(summary);
    } catch (err: unknown) {
      console.error('Error loading SuperAdmin data:', err);
      toast.error('Falha de sincronização. Verifique sua conexão com a internet.');
      setError('Falha na conexão com o Firestore. Verifique o console ou as regras de segurança.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    setTerminalLogs(createInitialTerminalLogs());
  }, [loadData]);

  useEffect(() => {
    const timer = setInterval(() => {
      const newLog = createSimulatedTerminalLog(tenants, terminalLogs.length);
      if (newLog) setTerminalLogs((prev) => prependTerminalLog(prev, newLog));
    }, 15000);
    return () => clearInterval(timer);
  }, [tenants, terminalLogs.length]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAddTenant = async (e: HtmlFormSubmitEvent) => {
    e.preventDefault();
    if (!newTenantName.trim()) return;
    setSubmittingTenant(true);
    setError(null);
    try {
      const token = auth?.currentUser ? await auth.currentUser.getIdToken() : '';
      const cleanTenantId = newTenantName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');

      const res = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          tenantId: cleanTenantId,
          name: newTenantName.trim(),
          active: true,
          plan: 'Completo',
          monthlyPrice: Math.round(parseFloat(newTenantPrice) * 100) || 19900,
          billingStatus: 'active',
          billingMethod: 'pix',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Falha ao criar empresa via servidor.');
      }

      // Create primary administrator account if email is provided
      if (newTenantAdminEmail.trim()) {
        await fetch('/api/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: newTenantAdminEmail.trim().toLowerCase(),
            name: newTenantAdminName.trim() || 'Administrador',
            role: 'admin',
            tenantId: cleanTenantId,
            active: true,
          }),
        });
      }

      setTerminalLogs((prev) =>
        prependTerminalLog(
          prev,
          createActionTerminalLog(
            'log_tenant',
            'SUCCESS',
            `Nova empresa criada: '${newTenantName.trim()}'${
              newTenantAdminEmail.trim() ? ` com administrador '${newTenantAdminEmail.trim().toLowerCase()}'` : ''
            }`
          )
        )
      );
      setNewTenantName('');
      setNewTenantPrice('199.00');
      setNewTenantAdminName('');
      setNewTenantAdminEmail('');
      await loadData();
    } catch (err: any) {
      console.error('Error adding tenant:', err);
      toast.error(err.message || 'Falha de sincronização. Verifique sua conexão com a internet.');
      setError(err.message || 'Erro ao salvar tenant. Verifique sua conexão.');
    } finally {
      setSubmittingTenant(false);
    }
  };

  const handleAddUser = async (e: HtmlFormSubmitEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim() || !newUserTenant) return;
    setSubmittingUser(true);
    setError(null);
    try {
      const token = auth?.currentUser ? await auth.currentUser.getIdToken() : '';
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: newUserEmail.trim().toLowerCase(),
          name: newUserName.trim() || 'Colaborador',
          role: newUserRole,
          tenantId: newUserTenant,
          active: true,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Falha ao criar colaborador via servidor.');
      }

      setTerminalLogs((prev) =>
        prependTerminalLog(
          prev,
          createActionTerminalLog('log_user', 'SUCCESS', `Novo colaborador cadastrado: '${newUserEmail.trim().toLowerCase()}'`)
        )
      );
      setNewUserEmail('');
      setNewUserName('');
      await loadData();
    } catch (err: any) {
      console.error('Error adding user:', err);

      setError('Erro ao salvar usuário no Firestore.');
    } finally {
      setSubmittingUser(false);
    }
  };

  const handleToggleTenantActive = async (tenantId: string, currentActive: boolean) => {
    setError(null);
    try {
      await updateDoc(doc(db, 'tenants', tenantId), { active: !currentActive });
      setTerminalLogs((prev) =>
        prependTerminalLog(
          prev,
          createActionTerminalLog(
            'log_toggle_tenant',
            'WARN',
            `Licença do Tenant ID '${tenantId}' alterada para ${!currentActive ? 'ATIVA' : 'SUSPENSA'}`
          )
        )
      );
      await loadData();
      if (selectedTenantDetail?.tenantId === tenantId) {
        setSelectedTenantDetail((prev) => (prev ? { ...prev, active: !currentActive } : null));
      }
    } catch (err: unknown) {
      console.error('Error toggling active status:', err);
      setError('Erro ao alterar status da empresa.');
    }
  };

  const handleToggleUserActive = async (userId: string, currentActive: boolean) => {
    setError(null);
    try {
      await updateDoc(doc(db, 'users', userId), { active: !currentActive });
      setTerminalLogs((prev) =>
        prependTerminalLog(
          prev,
          createActionTerminalLog(
            'log_toggle_user',
            'INFO',
            `Status do Colaborador ID '${userId}' alterado para ${!currentActive ? 'ATIVO' : 'BLOQUEADO'}`
          )
        )
      );
      await loadData();
    } catch (err: unknown) {
      console.error('Error toggling user status:', err);
      setError('Erro ao alterar status do colaborador.');
    }
  };

  const handleSavePlanEdit = async (tenantId: string) => {
    try {
      const priceInCents = Math.round(parseFloat(editPrice) * 100) || 0;
      await updateTenantBilling(tenantId, {
        plan: 'Completo',
        monthlyPriceCents: priceInCents,
      });
      setTerminalLogs((prev) =>
        prependTerminalLog(
          prev,
          createActionTerminalLog(
            'log_edit_plan',
            'SUCCESS',
            `Valor acordado do Tenant ID '${tenantId}' atualizado para $ ${editPrice}/mês`
          )
        )
      );
      setEditingTenantId(null);
      await loadData();
    } catch (err: unknown) {
      console.error('Error editing plan:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar dados do plano.');
    }
  };

  const loadTenantInvoices = useCallback(async (tenantId: string) => {
    setInvoicesLoading(true);
    try {
      const list = await fetchSaasInvoices(tenantId);
      setTenantInvoices(list);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Falha ao carregar faturas.');
      setTenantInvoices([]);
    } finally {
      setInvoicesLoading(false);
    }
  }, []);

  const handleCreateInvoice = async (tenantId: string) => {
    try {
      await createSaasInvoice({ tenantId, markPastDue: false });
      toast.success('Fatura criada (aberta).');
      await loadTenantInvoices(tenantId);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar fatura.');
    }
  };

  const handleMarkInvoicePaid = async (invoiceId: string, tenantId: string) => {
    try {
      await markSaasInvoicePaid(invoiceId);
      toast.success('Fatura marcada como paga.');
      await loadTenantInvoices(tenantId);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao marcar pago.');
    }
  };

  const handleSetBillingStatus = async (
    tenantId: string,
    billingStatus: 'active' | 'past_due' | 'suspended'
  ) => {
    try {
      await updateTenantBilling(tenantId, {
        billingStatus,
        reactivate: billingStatus === 'active',
        active: billingStatus !== 'suspended',
      });
      await loadData();
      if (selectedTenantDetail?.tenantId === tenantId) {
        setSelectedTenantDetail((prev) =>
          prev
            ? {
                ...prev,
                billingStatus,
                active: billingStatus !== 'suspended',
              }
            : null
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar billing.');
    }
  };

  const handleImpersonate = (tenantId: string, tenantName: string) => {
    localStorage.setItem('controlmax_impersonated_tenant', tenantId);
    setTerminalLogs((prev) =>
      prependTerminalLog(
        prev,
        createActionTerminalLog(
          'log_impersonate',
          'ALERT',
          `SuperAdmin iniciou sessão de impersonação na empresa '${tenantName}'`
        )
      )
    );
    window.location.href = '/#/dashboard';
  };

  const processedTenants = useMemo(
    () => buildTenantMetrics(tenants, users, boxes, sales, collections),
    [tenants, users, boxes, sales, collections]
  );

  const filteredTenants = useMemo(
    () => filterAndSortTenants(processedTenants, searchQuery, statusFilter, sortBy),
    [processedTenants, searchQuery, statusFilter, sortBy]
  );

  const kpis = useMemo(
    () => computeSuperAdminKpis(processedTenants, users, collections),
    [processedTenants, users, collections]
  );

  const handleLogout = () => {
    auth.signOut().then(() => {
      window.location.href = '/#/login';
    });
  };

  const handleGoToMainApp = () => {
    localStorage.removeItem('controlmax_impersonated_tenant');
    window.location.href = '/#/dashboard';
  };

  return {
    tenants,
    users,
    loading,
    refreshing,
    error,
    setError,
    selectedTenantDetail,
    setSelectedTenantDetail,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    newTenantName,
    setNewTenantName,
    newTenantPrice,
    setNewTenantPrice,
    newTenantAdminName,
    setNewTenantAdminName,
    newTenantAdminEmail,
    setNewTenantAdminEmail,
    submittingTenant,
    newUserName,
    setNewUserName,
    newUserEmail,
    setNewUserEmail,
    newUserRole,
    setNewUserRole,
    newUserTenant,
    setNewUserTenant,
    submittingUser,
    editingTenantId,
    setEditingTenantId,
    editPrice,
    setEditPrice,
    clientCountSim,
    setClientCountSim,
    avgTicketSim,
    setAvgTicketSim,
    terminalLogs,
    billingSummary,
    tenantInvoices,
    invoicesLoading,
    loadTenantInvoices,
    handleCreateInvoice,
    handleMarkInvoicePaid,
    handleSetBillingStatus,
    processedTenants,
    filteredTenants,
    ...kpis,
    handleRefresh,
    handleAddTenant,
    handleAddUser,
    handleToggleTenantActive,
    handleToggleUserActive,
    handleSavePlanEdit,
    handleImpersonate,
    handleLogout,
    handleGoToMainApp,
  };
}
