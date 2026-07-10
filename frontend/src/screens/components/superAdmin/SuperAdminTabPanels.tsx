import { AnimatePresence } from 'motion/react';
import type { SuperAdminMenu } from '../../../types/superAdmin';
import type { useSuperAdminData } from '../../../hooks/useSuperAdminData';
import { SuperAdminOverviewTab } from './tabs/SuperAdminOverviewTab';
import { SuperAdminTenantsTab } from './tabs/SuperAdminTenantsTab';
import { SuperAdminUsersTab } from './tabs/SuperAdminUsersTab';
import { SuperAdminPlansTab } from './tabs/SuperAdminPlansTab';
import { SuperAdminLogsTab } from './tabs/SuperAdminLogsTab';

type SuperAdminData = ReturnType<typeof useSuperAdminData>;

export interface SuperAdminTabPanelsProps extends SuperAdminData {
  activeMenu: SuperAdminMenu;
}

export function SuperAdminTabPanels({
  activeMenu,
  tenants,
  users,
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
  selectedTenantDetail,
  setSelectedTenantDetail,
  activeTenantsCount,
  mrrEstimated,
  totalGlobalUsers,
  totalGlobalRecaudoVolume,
  handleAddTenant,
  handleAddUser,
  handleToggleTenantActive,
  handleToggleUserActive,
  handleSavePlanEdit,
  handleImpersonate,
}: SuperAdminTabPanelsProps) {
  return (
    <AnimatePresence mode="wait">
      {activeMenu === 'overview' && (
        <SuperAdminOverviewTab
          mrrEstimated={mrrEstimated}
          activeTenantsCount={activeTenantsCount}
          tenantsCount={tenants.length}
          totalGlobalUsers={totalGlobalUsers}
          totalGlobalRecaudoVolume={totalGlobalRecaudoVolume}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filteredTenants={filteredTenants}
          selectedTenantDetail={selectedTenantDetail}
          setSelectedTenantDetail={setSelectedTenantDetail}
          terminalLogs={terminalLogs}
        />
      )}

      {activeMenu === 'tenants' && (
        <SuperAdminTenantsTab
          tenants={tenants}
          processedTenants={processedTenants}
          newTenantName={newTenantName}
          setNewTenantName={setNewTenantName}
          newTenantPrice={newTenantPrice}
          setNewTenantPrice={setNewTenantPrice}
          submittingTenant={submittingTenant}
          handleAddTenant={handleAddTenant}
          editingTenantId={editingTenantId}
          setEditingTenantId={setEditingTenantId}
          editPrice={editPrice}
          setEditPrice={setEditPrice}
          handleSavePlanEdit={handleSavePlanEdit}
          handleImpersonate={handleImpersonate}
          handleToggleTenantActive={handleToggleTenantActive}
        />
      )}

      {activeMenu === 'users' && (
        <SuperAdminUsersTab
          tenants={tenants}
          users={users}
          newUserName={newUserName}
          setNewUserName={setNewUserName}
          newUserEmail={newUserEmail}
          setNewUserEmail={setNewUserEmail}
          newUserRole={newUserRole}
          setNewUserRole={setNewUserRole}
          newUserTenant={newUserTenant}
          setNewUserTenant={setNewUserTenant}
          submittingUser={submittingUser}
          handleAddUser={handleAddUser}
          handleToggleUserActive={handleToggleUserActive}
        />
      )}

      {activeMenu === 'plans' && (
        <SuperAdminPlansTab
          clientCountSim={clientCountSim}
          setClientCountSim={setClientCountSim}
          avgTicketSim={avgTicketSim}
          setAvgTicketSim={setAvgTicketSim}
        />
      )}

      {activeMenu === 'logs' && (
        <SuperAdminLogsTab terminalLogs={terminalLogs} />
      )}
    </AnimatePresence>
  );
}
