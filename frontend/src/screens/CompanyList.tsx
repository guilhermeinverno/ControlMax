import { useCallback, useState } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { useCompanyListData } from '../hooks/useCompanyListData';
import { useCustomerCreateForm } from '../hooks/useCustomerCreateForm';
import { useTenant } from '../hooks/useTenant';
import { CustomerDetailModal } from './components/CompanyListCustomerModal';
import { CompanyListCreateForm } from './components/companyList/CompanyListCreateForm';
import { CompanyListCustomerGrid } from './components/companyList/CompanyListCustomerGrid';
import { CompanyListHeader } from './components/companyList/CompanyListHeader';
import { CompanyListTabBar } from './components/companyList/CompanyListTabBar';

interface CompanyListProps {
  onNavigate?: (screen: string, params?: Record<string, unknown>) => void;
  params?: Record<string, unknown>;
}

export function CompanyList({ params }: CompanyListProps) {
  const { tenantId } = useTenant();
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');

  const listData = useCompanyListData({
    tenantId,
    clientId: params?.clientId,
  });

  const handleCreated = useCallback(() => {
    setActiveTab('list');
  }, []);

  const createForm = useCustomerCreateForm({
    tenantId,
    selectedCnId: listData.selectedCnId,
    centers: listData.centers,
    onCreated: handleCreated,
  });

  const handleCreateCancel = useCallback(() => {
    setActiveTab('list');
    createForm.resetForm();
  }, [createForm]);

  return (
    <div className="flex flex-col space-y-4 w-full max-w-[1550px] mx-auto animate-fadeIn px-2 sm:px-4 text-[#333333]">
      <CompanyListHeader
        centers={listData.centers}
        selectedCnId={listData.selectedCnId}
        selectedUnitId={listData.selectedUnitId}
        viewAllUnits={listData.viewAllUnits}
        activeUnitsList={listData.activeUnitsList}
        onCnChange={listData.handleCnChange}
        onUnitChange={listData.setSelectedUnitId}
        onViewAllUnitsChange={listData.setViewAllUnits}
      />

      <CompanyListTabBar
        activeTab={activeTab}
        customerCount={listData.filteredCustomers.length}
        onChange={setActiveTab}
      />

      <div className="bg-white border border-gray-200 rounded-b-lg shadow-sm p-4">
        {createForm.notification && (
          <div
            className={`p-3 rounded-lg flex items-start gap-2.5 mb-4 text-xs font-semibold border ${
              createForm.notification.type === 'success'
                ? 'bg-green-50 text-green-800 border-green-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            {createForm.notification.type === 'success' ? (
              <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            )}
            <span>{createForm.notification.message}</span>
          </div>
        )}

        {activeTab === 'create' ? (
          <CompanyListCreateForm
            createForm={createForm}
            activeUnitsList={listData.activeUnitsList}
            onCancel={handleCreateCancel}
          />
        ) : (
          <CompanyListCustomerGrid
            loadingCustomers={listData.loadingCustomers}
            filteredCustomers={listData.filteredCustomers}
            searchQuery={listData.searchQuery}
            onSearchChange={listData.setSearchQuery}
            onSelectCustomer={listData.setSelectedCustomerForModal}
            onToggleStatus={listData.toggleCustomerStatus}
          />
        )}
      </div>

      {listData.selectedCustomerForModal && (
        <CustomerDetailModal
          customer={
            listData.customers.find((customer) => customer.id === listData.selectedCustomerForModal?.id) ||
            listData.selectedCustomerForModal
          }
          onClose={() => listData.setSelectedCustomerForModal(null)}
        />
      )}
    </div>
  );
}
