import { useCallback, useState, useEffect } from 'react';
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

export function CompanyList({ params, onNavigate }: CompanyListProps) {
  const { tenantId } = useTenant();
  const [activeTab, setActiveTab] = useState<'list' | 'create'>(() => 
    params?.initialTab === 'create' ? 'create' : 'list'
  );

  useEffect(() => {
    if (params?.initialTab === 'create') {
      setActiveTab('create');
    } else if (params?.initialTab === 'list') {
      setActiveTab('list');
    }
  }, [params]);

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
        ) : listData.listError ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <p className="text-sm font-semibold text-red-700">{listData.listError}</p>
            <button
              type="button"
              onClick={listData.retryLoad}
              className="px-4 py-2 text-xs font-bold text-white bg-[#6A008A] hover:bg-[#52006A] rounded-lg"
            >
              Tentar Novamente
            </button>
          </div>
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
          onSaveSuccess={(cust) => {
            listData.setSelectedCustomerForModal(null);
            if (onNavigate) {
              const fullName = `${cust.name || ''} ${cust.apellidos || ''}`.trim() || cust.apodo || 'Cliente';
              onNavigate('vendedor-mobile', { activeView: 'new-sale', clientId: cust.id, clientName: fullName });
            }
          }}
        />
      )}
    </div>
  );
}
