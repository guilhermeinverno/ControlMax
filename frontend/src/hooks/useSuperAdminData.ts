import { useState, useEffect, useMemo, useCallback } from 'react';
import type { HtmlFormSubmitEvent } from '../types/reactEvents';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
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

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadSuperAdminData();
      setTenants(data.tenants);
      setUsers(data.users);
      setBoxes(data.boxes);
      setSales(data.sales);
      setCollections(data.collections);
    } catch (err: unknown) {
      console.error('Error loading SuperAdmin data:', err);
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
      const priceInCents = Math.round(parseFloat(newTenantPrice) * 100) || 0;
      await addDoc(collection(db, 'tenants'), {
        name: newTenantName.trim(),
        active: true,
        createdAt: Timestamp.now(),
        plan: 'Completo',
        monthlyPrice: priceInCents,
      });
      setTerminalLogs((prev) =>
        prependTerminalLog(
          prev,
          createActionTerminalLog('log_tenant', 'SUCCESS', `Nova empresa criada: '${newTenantName.trim()}' (Acesso Completo)`)
        )
      );
      setNewTenantName('');
      setNewTenantPrice('199.00');
      await loadData();
    } catch (err: unknown) {
      console.error('Error adding tenant:', err);
      setError('Erro ao salvar tenant. Verifique sua conexão.');
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
      await addDoc(collection(db, 'users'), {
        email: newUserEmail.trim().toLowerCase(),
        name: newUserName.trim() || 'Colaborador',
        role: newUserRole,
        tenantId: newUserTenant,
        active: true,
      });
      setTerminalLogs((prev) =>
        prependTerminalLog(
          prev,
          createActionTerminalLog('log_user', 'SUCCESS', `Novo colaborador cadastrado: '${newUserEmail.trim().toLowerCase()}'`)
        )
      );
      setNewUserEmail('');
      setNewUserName('');
      await loadData();
    } catch (err: unknown) {
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
      await updateDoc(doc(db, 'tenants', tenantId), {
        plan: 'Completo',
        monthlyPrice: priceInCents,
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
      setError('Erro ao atualizar dados do plano.');
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
    window.location.href = '/dashboard';
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
      window.location.href = '/login';
    });
  };

  const handleGoToMainApp = () => {
    localStorage.removeItem('controlmax_impersonated_tenant');
    window.location.href = '/dashboard';
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
