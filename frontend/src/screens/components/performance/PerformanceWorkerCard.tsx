import { Box } from '../../../types';
import { PerformanceMetrics } from '../../../utils/performanceMetrics';
import { fmtCents } from '../../../utils/fmtCents';

interface PerformanceWorkerCardProps {
  box: Box;
  metrics: PerformanceMetrics;
}

export function PerformanceWorkerCard({ box, metrics }: PerformanceWorkerCardProps) {
  return (
    <div className="bg-[#6B21A8] text-white rounded-sm p-4 flex flex-col justify-between shadow-sm border border-[#581c87] min-h-[480px]">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-purple-200 tracking-widest">
            Desempeño de Trabajador
          </span>
          <span className="bg-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/10 uppercase">
            {box.status === 'open' ? 'Abierta' : 'Cerrada'}
          </span>
        </div>

        <div className="mt-3">
          <span className="text-xs text-purple-200 uppercase font-medium">Caja Final</span>
          <h2 className="text-3xl font-black text-white leading-tight">$ {fmtCents(box.finalAmount ?? 0)}</h2>
        </div>

        <div className="mt-2.5">
          <span className="inline-block bg-white text-[#6B21A8] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase shadow-sm">
            Apertura: {metrics.formattedOpenDate} às {metrics.formattedOpenTime}
          </span>
        </div>

        <div className="mt-6 space-y-2 text-xs">
          {[
            ['Caja Inicial', box.initialAmount ?? 0, 'text-[#86efac]', '+'],
            ['Nuevas Ventas', box.totalSales ?? 0, 'text-[#fca5a5]', '-'],
            ['Ventas Renovadas', 0, 'text-[#fca5a5]', '-'],
            ['Total Ventas', box.totalSales ?? 0, 'text-[#fca5a5]', '-'],
            ['Recaudo', box.totalCollections ?? 0, 'text-[#86efac]', '+'],
            ['Ingresos', box.totalIncomes ?? 0, 'text-[#86efac]', '+'],
            ['Gastos', box.totalExpenses ?? 0, 'text-[#fca5a5]', '-'],
            ['Retiros y Transf.', box.totalTransfers ?? 0, 'text-white', '-'],
          ].map(([label, amount, color, sign]) => (
            <div
              key={String(label)}
              className="flex justify-between items-center border-b border-purple-500/20 pb-1.5 last:border-b-0"
            >
              <span className="text-purple-200 font-medium">{label}</span>
              <span className={`${color} font-black font-mono`}>
                {sign}$ {fmtCents(Number(amount))}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-purple-500/30 pt-3 mt-4 text-center">
        <p className="text-[10px] text-purple-200 font-bold uppercase tracking-wider">
          Unidade: {box.unitName || '---'} | CN: {box.cnName || '---'}
        </p>
      </div>
    </div>
  );
}
