import {
  AlertCircle,
  Calendar,
  Check,
  Clock,
  DollarSign,
  Loader2,
  Search,
  TrendingUp,
  User,
  Building2,
  X,
} from 'lucide-react';
import { approvalStatusLabel, approvalStatusBadgeClasses } from '../../../utils/statusLabels';
import { toJsDate } from '../../../utils/firestoreTimestamp';
import { listViewBody } from '../../../utils/listViewBody';
import { fmtCents } from '../../../utils/fmtCents';
import { filterBCIncomes, computeBCIncomeStats } from '../../../utils/bcIncomeFilters';
import { BC_INCOME_CATEGORY_MAP, type BCIncome, type BCIncomeStatusFilter } from '../../../types/bcIncome';

interface BCIncomeHistoryTabProps {
  incomes: BCIncome[];
  loading: boolean;
  error: string | null;
  selectedDate: string;
  statusFilter: BCIncomeStatusFilter;
  searchQuery: string;
  isAdminOrSupervisor: boolean;
  onSelectedDateChange: (date: string) => void;
  onStatusFilterChange: (filter: BCIncomeStatusFilter) => void;
  onSearchQueryChange: (query: string) => void;
  onSearch: () => void;
  onApprove: (income: BCIncome) => void;
  onReject: (income: BCIncome) => void;
}

export function BCIncomeHistoryTab({
  incomes,
  loading,
  error,
  selectedDate,
  statusFilter,
  searchQuery,
  isAdminOrSupervisor,
  onSelectedDateChange,
  onStatusFilterChange,
  onSearchQueryChange,
  onSearch,
  onApprove,
  onReject,
}: BCIncomeHistoryTabProps) {
  const stats = computeBCIncomeStats(incomes);
  const filteredIncomes = filterBCIncomes(incomes, statusFilter, searchQuery);

  return (
    <div className="space-y-5">
      <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-2">
        Consulta de Ingressos por Dia
      </h2>

      <div className="bg-gray-50 p-3 border border-gray-200 rounded-md grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
        <div className="flex flex-col">
          <label className="text-[11px] font-bold text-gray-600 uppercase mb-1 flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1 text-purple-600" />
            Data Selecionada
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onSelectedDateChange(e.target.value)}
            className="border border-gray-300 rounded p-2 text-xs bg-white text-[#333333]"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-[11px] font-bold text-gray-600 uppercase mb-1">Status do Ingresso</label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as BCIncomeStatusFilter)}
            className="border border-gray-300 rounded p-2 text-xs bg-white text-[#333333]"
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendentes</option>
            <option value="approved">Aprovados</option>
            <option value="rejected">Rejeitados</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-[11px] font-bold text-gray-600 uppercase mb-1">Centro de Negócios (CN)</label>
          <select
            disabled
            className="border border-gray-300 rounded p-2 text-xs bg-gray-100 text-gray-500 cursor-not-allowed"
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
        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded text-xs flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-green-50 border border-green-300 p-3 rounded shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-green-700 tracking-wider">Total Entradas</span>
            <h3 className="text-lg font-bold text-[#16A34A] mt-0.5">$ {fmtCents(stats.totalApproved)}</h3>
          </div>
          <TrendingUp className="w-6 h-6 text-green-600 opacity-60" />
        </div>

        <div className="bg-yellow-50 border border-yellow-300 p-3 rounded shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-yellow-700 tracking-wider">Pendentes</span>
            <h3 className="text-lg font-bold text-yellow-800 mt-0.5">{stats.pendingCount} registros</h3>
          </div>
          <Clock className="w-6 h-6 text-yellow-600 opacity-60" />
        </div>

        <div className="bg-red-50 border border-red-300 p-3 rounded shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-red-700 tracking-wider">Rejeitados</span>
            <h3 className="text-lg font-bold text-red-800 mt-0.5">{stats.rejectedCount} registros</h3>
          </div>
          <X className="w-6 h-6 text-red-600 opacity-60" />
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
        filteredIncomes.length,
        (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            <p className="text-[11px] font-medium">Carregando ingressos...</p>
          </div>
        ),
        (
          <div className="text-center py-10 bg-gray-50 border border-dashed border-gray-200 rounded-md">
            <DollarSign className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-gray-600">Nenhum ingresso encontrado para esta data</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Cadastre uma nova entrada ou tente outra data.</p>
          </div>
        ),
        (
          <div className="space-y-3">
            {filteredIncomes.map((income) => {
              const createdAtDate = income.createdAt ? toJsDate(income.createdAt) : null;

              return (
                <div
                  key={income.id}
                  className="bg-white border border-gray-300 rounded-md p-3.5 shadow-xs flex flex-col justify-between hover:border-gray-400 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                        <span className="text-xs font-bold text-gray-800">
                          {BC_INCOME_CATEGORY_MAP[income.category] || 'Ingresso'}
                        </span>
                        <span className="text-[9px] text-gray-400 font-mono">#{income.id.substring(0, 6)}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${approvalStatusBadgeClasses(income.status)}`}
                        >
                          {approvalStatusLabel(income.status)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{income.description}</p>
                    </div>

                    <div className="text-right flex flex-row sm:flex-col items-baseline sm:items-end justify-between sm:justify-start gap-1">
                      <span className="text-sm font-bold text-green-600">$ {fmtCents(income.amount)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-gray-100 text-[11px] text-gray-500">
                    <div className="flex items-center">
                      <Building2 className="w-3.5 h-3.5 text-gray-400 mr-1.5 flex-shrink-0" />
                      <span>
                        CN: <strong className="text-gray-700">{income.cnName || 'CN Padrão'}</strong>
                      </span>
                    </div>

                    <div className="flex items-center">
                      <User className="w-3.5 h-3.5 text-gray-400 mr-1.5 flex-shrink-0" />
                      <span>
                        Por: <strong className="text-gray-700">{income.userName || 'Desconhecido'}</strong>
                      </span>
                    </div>

                    <div className="flex items-center">
                      <Clock className="w-3.5 h-3.5 text-gray-400 mr-1.5 flex-shrink-0" />
                      <span>{createdAtDate ? createdAtDate.toLocaleString('pt-BR') : 'Data não registrada'}</span>
                    </div>
                  </div>

                  {isAdminOrSupervisor && income.status === 'pending' && (
                    <div className="flex space-x-2 mt-4 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => onApprove(income)}
                        className="flex-1 bg-[#16A34A] hover:bg-[#15803d] text-white text-[11px] font-bold py-2 px-3 rounded flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Aprovar
                      </button>
                      <button
                        onClick={() => onReject(income)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold py-2 px-3 rounded flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        Rejeitar
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
