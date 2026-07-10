import {
  AlertCircle,
  Calendar,
  Check,
  Clock,
  DollarSign,
  Search,
  TrendingDown,
  X,
} from 'lucide-react';
import { approvalStatusLabel, approvalStatusBadgeClasses } from '../../../utils/statusLabels';
import { toJsDate } from '../../../utils/firestoreTimestamp';
import { listViewBody } from '../../../utils/listViewBody';
import { fmtCents } from '../../../utils/fmtCents';
import {
  filterBCExpenses,
  computeBCExpenseStats,
} from '../../../utils/bcExpenseFilters';
import {
  BC_EXPENSE_CATEGORY_MAP,
  type BCExpense,
  type BCExpenseCategoryFilter,
  type BCExpenseStatusFilter,
} from '../../../types/bcExpense';

interface BCExpenseListSectionProps {
  expenses: BCExpense[];
  loading: boolean;
  error: string | null;
  selectedDate: string;
  statusFilter: BCExpenseStatusFilter;
  categoryFilter: BCExpenseCategoryFilter;
  searchQuery: string;
  canWrite: boolean;
  onSelectedDateChange: (date: string) => void;
  onStatusFilterChange: (filter: BCExpenseStatusFilter) => void;
  onCategoryFilterChange: (filter: BCExpenseCategoryFilter) => void;
  onSearchQueryChange: (query: string) => void;
  onSearch: () => void;
  onApprove: (expense: BCExpense) => void;
  onReject: (expense: BCExpense) => void;
}

export function BCExpenseListSection({
  expenses,
  loading,
  error,
  selectedDate,
  statusFilter,
  categoryFilter,
  searchQuery,
  canWrite,
  onSelectedDateChange,
  onStatusFilterChange,
  onCategoryFilterChange,
  onSearchQueryChange,
  onSearch,
  onApprove,
  onReject,
}: BCExpenseListSectionProps) {
  const stats = computeBCExpenseStats(expenses);
  const filteredExpenses = filterBCExpenses(expenses, statusFilter, categoryFilter, searchQuery);

  return (
    <div className="space-y-5">
      <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-2">
        Consulta de Egresos / Despesas
      </h2>

      <div className="bg-gray-50 p-3.5 border border-gray-200 rounded-md grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
        <div className="flex flex-col">
          <label className="text-[11px] font-bold text-gray-600 uppercase mb-1 flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1 text-purple-600" />
            Data
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onSelectedDateChange(e.target.value)}
            className="border border-gray-300 rounded p-2 text-xs bg-white text-[#333333] outline-none focus:border-[#6B21A8]"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-[11px] font-bold text-gray-600 uppercase mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as BCExpenseStatusFilter)}
            className="border border-gray-300 rounded p-2 text-xs bg-white text-[#333333] outline-none focus:border-[#6B21A8]"
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendentes</option>
            <option value="approved">Aprovados</option>
            <option value="rejected">Rejeitados</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-[11px] font-bold text-gray-600 uppercase mb-1">Categoria</label>
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value as BCExpenseCategoryFilter)}
            className="border border-gray-300 rounded p-2 text-xs bg-white text-[#333333] outline-none focus:border-[#6B21A8]"
          >
            <option value="all">Todas as Categorias</option>
            <option value="salary">Salário</option>
            <option value="rent">Aluguel</option>
            <option value="supplies">Suprimentos</option>
            <option value="transport">Transporte</option>
            <option value="other">Outro</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-[11px] font-bold text-gray-600 uppercase mb-1">Centro de Negócios (CN)</label>
          <select
            disabled
            className="border border-gray-300 rounded p-2 text-xs bg-gray-100 text-gray-400 cursor-not-allowed outline-none"
          >
            <option value="all">Todos os CNs (Mock)</option>
          </select>
        </div>

        <div>
          <button
            onClick={onSearch}
            className="w-full bg-[#16A34A] hover:bg-[#15803d] text-white font-bold py-2 px-4 rounded text-xs shadow-sm flex items-center justify-center cursor-pointer transition-colors"
          >
            <Search className="w-3.5 h-3.5 mr-1" />
            Buscar
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 rounded p-3 text-red-800 text-xs flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-red-50 border border-red-300 p-3.5 rounded flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-red-700 tracking-wider">Total Saídas Aprovadas</span>
            <h3 className="text-lg font-extrabold text-[#DC2626] mt-0.5">$ {fmtCents(stats.approvedTotal)}</h3>
          </div>
          <TrendingDown className="w-6 h-6 text-red-600 opacity-60" />
        </div>

        <div className="bg-yellow-50 border border-yellow-300 p-3.5 rounded flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-yellow-700 tracking-wider">Aguardando Aprovação</span>
            <h3 className="text-lg font-bold text-yellow-800 mt-0.5">
              {stats.pendingCount} reg. ($ {fmtCents(stats.pendingTotal)})
            </h3>
          </div>
          <Clock className="w-6 h-6 text-yellow-600 opacity-60" />
        </div>

        <div className="bg-gray-50 border border-gray-300 p-3.5 rounded flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-gray-700 tracking-wider">Rejeitados</span>
            <h3 className="text-lg font-bold text-gray-600 mt-0.5">
              {stats.rejectedCount} reg. ($ {fmtCents(stats.rejectedTotal)})
            </h3>
          </div>
          <X className="w-6 h-6 text-gray-500 opacity-60" />
        </div>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Pesquisar por descrição, usuário, categoria ou valor..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          className="w-full border border-gray-300 rounded p-2 pl-9 text-xs text-[#333333] outline-none focus:border-[#6B21A8]"
        />
        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
      </div>

      {listViewBody(
        loading,
        filteredExpenses.length,
        (
          <div className="space-y-2">
            <div className="animate-pulse h-16 bg-gray-100 rounded mb-2" />
            <div className="animate-pulse h-16 bg-gray-100 rounded mb-2" />
            <div className="animate-pulse h-16 bg-gray-100 rounded mb-2" />
          </div>
        ),
        (
          <div className="text-center py-10 bg-gray-50 border border-dashed border-gray-200 rounded-md">
            <DollarSign className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-gray-400">Nenhum egreso encontrado para esta data</p>
          </div>
        ),
        (
          <div className="space-y-3">
            {filteredExpenses.map((expense) => {
              const createdAtDate = toJsDate(expense.createdAt);

              return (
                <div
                  key={expense.id}
                  className="bg-white border border-gray-300 rounded p-3 mb-2 flex flex-col justify-between hover:border-gray-400 transition-colors"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold text-sm text-gray-800 break-words flex-1">{expense.description}</span>
                    <span className="text-[#DC2626] font-extrabold text-sm whitespace-nowrap">
                      -$ {fmtCents(expense.amount)}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 mt-1 space-y-0.5 sm:space-y-0 sm:flex sm:items-center sm:gap-x-4 flex-wrap">
                    <div>
                      Categoria:{' '}
                      <strong className="text-gray-700">
                        {BC_EXPENSE_CATEGORY_MAP[expense.category] || expense.category}
                      </strong>
                    </div>
                    <span className="hidden sm:inline text-gray-300">|</span>
                    <div>
                      CN: <strong className="text-gray-700">{expense.cnName || 'CN Padrão'}</strong>
                    </div>
                    <span className="hidden sm:inline text-gray-300">|</span>
                    <div>
                      Registrado por:{' '}
                      <strong className="text-gray-700">{expense.userName || 'Desconhecido'}</strong>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center text-[11px] text-gray-400">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      <span>{createdAtDate.toLocaleString('pt-BR')}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded ${approvalStatusBadgeClasses(expense.status)}`}
                      >
                        {approvalStatusLabel(expense.status)}
                      </span>
                    </div>
                  </div>

                  {canWrite && expense.status === 'pending' && (
                    <div className="flex gap-2 mt-3 pt-2.5 border-t border-gray-100">
                      <button
                        onClick={() => onApprove(expense)}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold py-1.5 px-3 rounded flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        ✓ Aprovar
                      </button>
                      <button
                        onClick={() => onReject(expense)}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold py-1.5 px-3 rounded flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        ✗ Rejeitar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
