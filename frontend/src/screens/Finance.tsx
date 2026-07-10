import {
  AlertTriangle,
  FileSpreadsheet,
  Landmark,
  Loader2,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { useTenant } from '../hooks/useTenant';
import { useFinanceData } from '../hooks/useFinanceData';
import { loadingErrorContent } from '../utils/listViewBody';
import {
  computeDistributionByCenter,
  computeFinanceKpis,
  exportFinanceExcel,
  filterMovementsByDate,
  filterMovementsByTabAndCn,
  FINANCE_MONTHS,
} from '../utils/financeMetrics';
import { FinanceKpiGrid } from './components/finance/FinanceKpiGrid';
import { FinanceMovementsTable } from './components/finance/FinanceMovementsTable';
import { FinanceDistributionCard } from './components/finance/FinanceDistributionCard';

export function Finance() {
  const { tenantId, role, loading: tenantLoading } = useTenant();
  const isCollector = role === 'collector';
  const data = useFinanceData(tenantId, isCollector);

  const yearsList = [data.selectedYear - 1, data.selectedYear, data.selectedYear + 1];
  const filteredByDate = filterMovementsByDate(data.movements, data.selectedMonth, data.selectedYear);
  const filteredMovements = filterMovementsByTabAndCn(
    filteredByDate,
    data.activeTabFilter,
    data.selectedCnFilter
  );
  const kpis = computeFinanceKpis(filteredByDate);
  const distributionData = computeDistributionByCenter(filteredByDate);

  if (tenantLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="w-10 h-10 animate-spin text-purple-700 mb-2" />
        <p className="text-sm text-gray-500 font-medium">Cargando perfil...</p>
      </div>
    );
  }

  if (isCollector) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white border border-gray-200 rounded-lg p-8 shadow-sm text-center max-w-md mx-auto mt-12 animate-fadeIn">
        <Lock className="w-16 h-16 text-purple-600 mb-4" />
        <h2 className="text-lg font-black text-gray-800">Acceso Restringido</h2>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          Lo sentimos, el módulo de finanzas y tesorería central solo está disponible para administradores y supervisores de la plataforma.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 w-full max-w-[1550px] mx-auto animate-fadeIn px-2 sm:px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Landmark className="w-6 h-6 text-purple-700" />
            <span>Finanzas y Contabilidad Central</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Control de tesorería, balances contables consolidados y aportes de capital social de los Centros de Negocios.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-white border border-gray-300 rounded shadow-sm px-2 py-1.5 gap-1.5">
            <select
              value={data.selectedMonth}
              onChange={(e) => data.setSelectedMonth(Number(e.target.value))}
              className="text-xs font-bold text-gray-700 bg-transparent outline-none cursor-pointer"
            >
              {FINANCE_MONTHS.map((m, idx) => (
                <option key={m} value={idx}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={data.selectedYear}
              onChange={(e) => data.setSelectedYear(Number(e.target.value))}
              className="text-xs font-bold text-gray-700 bg-transparent border-l border-gray-200 pl-1.5 outline-none cursor-pointer"
            >
              {yearsList.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={data.loadFinancialData}
            title="Recargar datos"
            className="p-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-600 rounded transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => exportFinanceExcel(filteredMovements, data.selectedMonth, data.selectedYear)}
            className="flex items-center justify-center gap-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-bold py-2 px-3.5 rounded text-xs transition-colors shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      {loadingErrorContent(
        data.loadingData,
        Boolean(data.errorMsg),
        (
          <div className="flex flex-col items-center justify-center py-24 bg-white border border-gray-200 rounded-lg shadow-sm">
            <Loader2 className="w-12 h-12 animate-spin text-purple-700 mb-3" />
            <p className="text-xs font-medium text-gray-500">Cargando flujos financieros del mes seleccionado...</p>
          </div>
        ),
        (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Error al cargar datos</h4>
              <p className="text-xs mt-1">{data.errorMsg}</p>
              <button onClick={data.loadFinancialData} className="mt-2 text-xs font-bold underline text-red-900">
                Reintentar
              </button>
            </div>
          </div>
        ),
        (
          <>
            <FinanceKpiGrid kpis={kpis} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <FinanceMovementsTable
                movements={filteredMovements}
                activeTabFilter={data.activeTabFilter}
                selectedCnFilter={data.selectedCnFilter}
                availableCns={data.availableCns}
                onTabChange={data.setActiveTabFilter}
                onCnChange={data.setSelectedCnFilter}
              />
              <FinanceDistributionCard distributionData={distributionData} />
            </div>
          </>
        )
      )}
    </div>
  );
}
