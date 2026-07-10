import { ArrowDownRight, ArrowUpRight, Percent, Scale } from 'lucide-react';
import type { FinanceKpis } from '../../../utils/financeMetrics';
import { fmtFinanceValue } from '../../../utils/financeMetrics';

interface FinanceKpiGridProps {
  kpis: FinanceKpis;
}

export function FinanceKpiGrid({ kpis }: FinanceKpiGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-gradient-to-br from-purple-700 to-purple-900 text-white rounded-lg p-5 shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[10px] font-bold text-purple-200 uppercase tracking-wide">Saldo Disponible</div>
            <div className="text-2xl font-black mt-1.5">{fmtFinanceValue(kpis.currentCapitalBalance)}</div>
          </div>
          <div className="p-2 bg-white/10 rounded-full text-white">
            <Scale className="w-5 h-5" />
          </div>
        </div>
        <div className="text-[10px] text-purple-200 font-semibold mt-4">Entradas netas menos salidas operativas</div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
              Entradas (Ingresos/Recaudos)
            </div>
            <div className="text-xl font-black text-gray-800 mt-1">{fmtFinanceValue(kpis.totalIncomes)}</div>
          </div>
          <div className="p-2 bg-green-50 rounded-full text-green-600">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>
        <div className="text-[10px] text-green-600 font-bold mt-4">
          <span>{kpis.approvedIncomesCount} movimientos aprobados</span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
              Salidas (Egresos/Transf.)
            </div>
            <div className="text-xl font-black text-gray-800 mt-1">{fmtFinanceValue(kpis.totalExpenses)}</div>
          </div>
          <div className="p-2 bg-red-50 rounded-full text-red-600">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>
        <div className="text-[10px] text-red-600 font-bold mt-4">
          <span>{kpis.approvedExpensesCount} egresos contabilizados</span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Margen de Caja</div>
            <div className="text-xl font-black text-blue-600 mt-1">{kpis.marginPercentage.toFixed(2)}%</div>
          </div>
          <div className="p-2 bg-blue-50 rounded-full text-blue-600">
            <Percent className="w-5 h-5" />
          </div>
        </div>
        <div className="text-[10px] text-gray-500 mt-4">Porcentaje retenido del total ingresado</div>
      </div>
    </div>
  );
}
