import { DollarSign, Loader2, PlusCircle, X } from 'lucide-react';
import { Screen } from '../types';
import { useTenant } from '../hooks/useTenant';
import { useBCExpensesData } from '../hooks/useBCExpensesData';
import { fmtCents } from '../utils/fmtCents';
import { ConfirmModal } from './components/ConfirmModal';
import { BCExpenseNewModal } from './components/bcExpenses/BCExpenseNewModal';
import { BCExpenseListSection } from './components/bcExpenses/BCExpenseListSection';

interface BCExpensesProps {
  onNavigate?: (screen: Screen) => void;
}

export function BCExpenses({ onNavigate }: BCExpensesProps) {
  const { tenantId, role, userName, loading: tenantLoading } = useTenant();

  const isAdmin = role === 'admin';
  const isSupervisor = role === 'supervisor';
  const canWrite = isAdmin || isSupervisor;
  const isCollector = role === 'collector';

  const data = useBCExpensesData(tenantId, userName, isAdmin);

  if (tenantLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 space-y-2 min-h-screen bg-[#F3F4F6]">
        <Loader2 className="w-8 h-8 animate-spin text-[#6B21A8]" />
        <p className="text-xs font-medium">Carregando dados do inquilino...</p>
      </div>
    );
  }

  if (isCollector) {
    return (
      <div className="flex flex-col bg-[#F3F4F6] min-h-screen text-[#333333] -m-4 p-6">
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm p-6 max-w-md mx-auto mt-12 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
            Acesso restrito a administradores
          </h2>
          <p className="text-xs text-gray-500 mt-2">
            Seu perfil atual de Cobrador (Collector) não possui permissões para visualizar ou registrar saídas
            financeiras do Centro de Negócios.
          </p>
          <button
            onClick={() => onNavigate && onNavigate('dashboard')}
            className="mt-5 inline-flex items-center text-xs font-bold text-white bg-[#6B21A8] hover:bg-purple-800 px-4 py-2 rounded-full transition-colors cursor-pointer"
          >
            Voltar ao Painel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#F3F4F6] min-h-screen text-[#333333] -m-4">
      <div className="bg-[#6B21A8] text-white py-4 px-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold uppercase tracking-wider flex items-center">
            <DollarSign className="w-5 h-5 mr-1.5 text-red-400 bg-white rounded-full p-0.5" strokeWidth={3} />
            Egresos de Centro de Negócios (CN)
          </h1>
          <p className="text-xs text-purple-200 mt-1">
            Controle de saídas operacionais e despesas associadas diretamente aos Centros de Negócios.
          </p>
        </div>
        {canWrite && (
          <button
            onClick={() => data.setIsNewExpenseOpen(true)}
            className="self-start sm:self-auto bg-white text-[#6B21A8] hover:bg-purple-50 font-bold py-2 px-4 rounded-full text-xs transition-colors cursor-pointer flex items-center shadow-sm"
          >
            <PlusCircle className="w-4 h-4 mr-1.5 text-[#6B21A8]" />
            Novo Egreso
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-5 space-y-5">
          <BCExpenseListSection
            expenses={data.expenses}
            loading={data.loading}
            error={data.error}
            selectedDate={data.selectedDate}
            statusFilter={data.statusFilter}
            categoryFilter={data.categoryFilter}
            searchQuery={data.searchQuery}
            canWrite={canWrite}
            onSelectedDateChange={data.setSelectedDate}
            onStatusFilterChange={data.setStatusFilter}
            onCategoryFilterChange={data.setCategoryFilter}
            onSearchQueryChange={data.setSearchQuery}
            onSearch={() => data.setSelectedDate(data.selectedDate)}
            onApprove={data.setExpenseToApprove}
            onReject={data.setExpenseToReject}
          />
        </div>
      </div>

      <BCExpenseNewModal
        isOpen={data.isNewExpenseOpen}
        isAdmin={isAdmin}
        formError={data.formError}
        formSuccess={data.formSuccess}
        formCnId={data.formCnId}
        category={data.category}
        amountInput={data.amountInput}
        description={data.description}
        submitting={data.submitting}
        onClose={() => data.setIsNewExpenseOpen(false)}
        onSubmit={data.handleCreateExpense}
        onFormCnChange={(cnId, cnName) => {
          data.setFormCnId(cnId);
          data.setFormCnName(cnName);
        }}
        onCategoryChange={data.setCategory}
        onAmountChange={data.handleAmountChange}
        onDescriptionChange={data.setDescription}
        onClearError={() => data.setFormError(null)}
      />

      <ConfirmModal
        isOpen={!!data.expenseToApprove}
        onClose={() => data.setExpenseToApprove(null)}
        onConfirm={data.handleApproveConfirm}
        title="Aprovar Egreso?"
        subtitle={`Deseja realmente aprovar este egreso no valor de $ ${data.expenseToApprove ? fmtCents(data.expenseToApprove.amount) : '0,00'}? Esta ação deduzirá o saldo do CN.`}
        confirmText={data.actionInProgress ? 'Aprovando...' : 'Sim, aprovar'}
        cancelText="Cancelar"
      />

      <ConfirmModal
        isOpen={!!data.expenseToReject}
        onClose={() => data.setExpenseToReject(null)}
        onConfirm={data.handleRejectConfirm}
        title="Rejeitar Egreso?"
        subtitle={`Tem certeza que deseja rejeitar o egreso no valor de $ ${data.expenseToReject ? fmtCents(data.expenseToReject.amount) : '0,00'}?`}
        confirmText={data.actionInProgress ? 'Rejeitando...' : 'Sim, rejeitar'}
        cancelText="Cancelar"
      />
    </div>
  );
}
