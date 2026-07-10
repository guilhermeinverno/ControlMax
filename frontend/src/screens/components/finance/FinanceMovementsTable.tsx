import type { UnifiedMovement } from '../../../utils/financeMovements';
import { financeMovementStatusBadgeClasses } from '../../../utils/statusLabels';
import type { FinanceTabFilter } from '../../../utils/financeMetrics';
import { fmtFinanceValue } from '../../../utils/financeMetrics';

interface FinanceMovementsTableProps {
  movements: UnifiedMovement[];
  activeTabFilter: FinanceTabFilter;
  selectedCnFilter: string;
  availableCns: string[];
  onTabChange: (tab: FinanceTabFilter) => void;
  onCnChange: (cn: string) => void;
}

const TABS: FinanceTabFilter[] = ['Todos', 'Ingreso', 'Egreso', 'Transferencia', 'Recaudo'];

export function FinanceMovementsTable({
  movements,
  activeTabFilter,
  selectedCnFilter,
  availableCns,
  onTabChange,
  onCnChange,
}: FinanceMovementsTableProps) {
  return (
    <div className="lg:col-span-2 bg-white border border-gray-200 shadow-sm rounded-lg p-4 flex flex-col space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Historial de Movimientos</h3>
        <div className="flex flex-wrap gap-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`px-2.5 py-1 text-[10px] font-bold rounded cursor-pointer transition-all ${
                activeTabFilter === tab ? 'bg-purple-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs bg-gray-50 p-2.5 rounded border border-gray-100">
        <span className="font-bold text-gray-500 text-[10px] uppercase">Centro:</span>
        <select
          value={selectedCnFilter}
          onChange={(e) => onCnChange(e.target.value)}
          className="bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:border-purple-600 cursor-pointer"
        >
          <option value="Todos">Todos los centros</option>
          {availableCns.map((cn) => (
            <option key={cn} value={cn}>
              {cn}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        {movements.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-xs font-medium">
            No se encontraron transacciones para los filtros seleccionados.
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase border-b border-gray-200">
                <th className="p-2.5">ID</th>
                <th className="p-2.5">Tipo</th>
                <th className="p-2.5">Descripción</th>
                <th className="p-2.5 text-right">Monto</th>
                <th className="p-2.5">Centro / Origen</th>
                <th className="p-2.5">Fecha</th>
                <th className="p-2.5 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="text-xs text-gray-700">
              {movements.map((m) => {
                const isIncome = m.type === 'Ingreso' || m.type === 'Recaudo';
                return (
                  <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="p-2.5 font-mono text-[10px] text-gray-400" title={m.id}>
                      {m.id.substring(0, 8)}...
                    </td>
                    <td className="p-2.5">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          isIncome ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {m.type}
                      </span>
                    </td>
                    <td className="p-2.5 font-medium text-gray-800 max-w-xs truncate" title={m.description}>
                      {m.description}
                    </td>
                    <td className={`p-2.5 text-right font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                      {fmtFinanceValue(m.amount)}
                    </td>
                    <td className="p-2.5 font-semibold text-purple-700 text-[11px]">{m.cnName}</td>
                    <td className="p-2.5 text-[11px] text-gray-500 font-mono">{m.dateStr.split(' ')[0]}</td>
                    <td className="p-2.5 text-center">
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${financeMovementStatusBadgeClasses(m.status)}`}
                      >
                        {m.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
