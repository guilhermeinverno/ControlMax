import { DollarSign, History, Loader2, PlusCircle } from 'lucide-react';
import { Screen } from '../types';
import { useTenant } from '../hooks/useTenant';
import { useBox } from '../hooks/useBox';
import { useBCIncomesData } from '../hooks/useBCIncomesData';
import { fmtCents } from '../utils/fmtCents';
import { ConfirmModal } from './components/ConfirmModal';
import { BCIncomeFormTab } from './components/bcIncomes/BCIncomeFormTab';
import { BCIncomeHistoryTab } from './components/bcIncomes/BCIncomeHistoryTab';

interface BCIncomesProps {
  onNavigate?: (screen: Screen) => void;
}

export function BCIncomes({ onNavigate: _onNavigate }: BCIncomesProps) {
  const { tenantId, role, userName, isSuperAdmin, loading: tenantLoading } = useTenant();
  const { activeBox } = useBox();
  const data = useBCIncomesData(tenantId, userName);

  const isAdminOrSupervisor = role === 'admin' || role === 'supervisor' || isSuperAdmin;

  if (tenantLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 space-y-2 min-h-screen bg-[#F3F4F6]">
        <Loader2 className="w-8 h-8 animate-spin text-[#84CC16]" />
        <p className="text-xs font-medium">Carregando dados do inquilino...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#F3F4F6] min-h-screen text-[#333333] -m-4">
      <div className="bg-[#6B21A8] text-white py-4 px-5 shadow-sm">
        <h1 className="text-lg font-bold uppercase tracking-wider flex items-center">
          <DollarSign className="w-5 h-5 mr-1.5 text-[#84CC16] bg-white rounded-full p-0.5" strokeWidth={3} />
          Ingressos de Centro de Negócios (CN)
        </h1>
        <p className="text-xs text-purple-200 mt-1">
          Registre e autorize depósitos, transferências e aportes realizados diretamente no CN.
        </p>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex space-x-1 border-b border-gray-200">
          <button
            onClick={() => data.setActiveTab('nuevo')}
            className={`flex items-center text-xs font-bold py-2.5 px-4 rounded-t-lg transition-all border-b-2 ${
              data.activeTab === 'nuevo'
                ? 'border-[#84CC16] bg-white text-[#6B21A8] shadow-sm'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <PlusCircle className="w-4 h-4 mr-1.5 text-[#84CC16]" />
            Novo Ingresso
          </button>

          <button
            onClick={() => data.setActiveTab('historico')}
            className={`flex items-center text-xs font-bold py-2.5 px-4 rounded-t-lg transition-all border-b-2 ${
              data.activeTab === 'historico'
                ? 'border-[#84CC16] bg-white text-[#6B21A8] shadow-sm'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <History className="w-4 h-4 mr-1.5 text-purple-600" />
            Histórico de Ingressos
          </button>
        </div>

        <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-5">
          {data.activeTab === 'nuevo' && (
            <BCIncomeFormTab
              activeBox={activeBox}
              formError={data.formError}
              formSuccess={data.formSuccess}
              formCnId={data.formCnId}
              formCnName={data.formCnName}
              category={data.category}
              amountInput={data.amountInput}
              description={data.description}
              submitting={data.submitting}
              onSubmit={data.handleCreateIncome}
              onViewHistory={() => data.setActiveTab('historico')}
              onFormCnChange={(cnId, cnName) => {
                data.setFormCnId(cnId);
                data.setFormCnName(cnName);
              }}
              onCategoryChange={data.setCategory}
              onAmountChange={data.handleAmountChange}
              onDescriptionChange={data.setDescription}
            />
          )}

          {data.activeTab === 'historico' && (
            <BCIncomeHistoryTab
              incomes={data.incomes}
              loading={data.loading}
              error={data.error}
              selectedDate={data.selectedDate}
              statusFilter={data.statusFilter}
              searchQuery={data.searchQuery}
              isAdminOrSupervisor={isAdminOrSupervisor}
              onSelectedDateChange={data.setSelectedDate}
              onStatusFilterChange={data.setStatusFilter}
              onSearchQueryChange={data.setSearchQuery}
              onSearch={() => data.setSelectedDate(data.selectedDate)}
              onApprove={data.setIncomeToApprove}
              onReject={data.setIncomeToReject}
            />
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!data.incomeToApprove}
        onClose={() => data.setIncomeToApprove(null)}
        onConfirm={data.handleApproveConfirm}
        title="Aprovar Ingresso?"
        subtitle={`Deseja realmente aprovar este ingresso no valor de $ ${data.incomeToApprove ? fmtCents(data.incomeToApprove.amount) : '0,00'}? Esta ação atualizará o saldo do CN.`}
        confirmText={data.actionInProgress ? 'Aprovando...' : 'Sim, aprovar'}
        cancelText="Cancelar"
      />

      <ConfirmModal
        isOpen={!!data.incomeToReject}
        onClose={() => data.setIncomeToReject(null)}
        onConfirm={data.handleRejectConfirm}
        title="Rejeitar Ingresso?"
        subtitle={`Tem certeza que deseja rejeitar o ingresso no valor de $ ${data.incomeToReject ? fmtCents(data.incomeToReject.amount) : '0,00'}?`}
        confirmText={data.actionInProgress ? 'Rejeitando...' : 'Sim, rejeitar'}
        cancelText="Cancelar"
      />
    </div>
  );
}
