import { Percent, TrendingUp } from 'lucide-react';
import { Box } from '../../../types';
import { PerformanceMetrics } from '../../../utils/performanceMetrics';
import { fmtCents } from '../../../utils/fmtCents';

interface PerformancePortfolioCardProps {
  box: Box;
  metrics: PerformanceMetrics;
}

function MetricRow({ label, value, valueClass = 'text-gray-700 font-bold font-mono' }: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between items-center border-b border-gray-100 pb-1.5 last:border-b-0">
      <span className="text-gray-500 font-medium">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}

export function PerformancePortfolioCard({ box, metrics }: PerformancePortfolioCardProps) {
  return (
    <div className="bg-white border-2 border-[#EA580C] text-[#333333] rounded-sm shadow-sm flex flex-col justify-between overflow-hidden min-h-[480px]">
      <div className="flex-1">
        <div className="bg-[#F3F4F6] px-3.5 py-2 border-b border-gray-300 flex items-center justify-between">
          <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-[#EA580C]" />
            Cartera
          </span>
          <span className="bg-[#EA580C] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase">
            Metas
          </span>
        </div>

        <div className="p-3.5 space-y-2 text-xs">
          <MetricRow label="Final" value={`$ ${fmtCents(metrics.carteraFinal)}`} valueClass="text-[#16A34A] font-extrabold font-mono text-sm" />
          <MetricRow label="Variación" value={metrics.variationPercent} valueClass="text-[#16A34A] font-extrabold font-mono" />
          <MetricRow label="Inicial" value={`$ ${fmtCents(box.totalSales ?? 0)}`} />
          <MetricRow label="Cartera Recaudada" value={metrics.carteraRecaudadaPercent} valueClass="text-gray-700 font-black font-mono" />
        </div>

        <div className="bg-[#F3F4F6] px-3.5 py-2 border-b border-t border-gray-300 flex items-center justify-between">
          <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
            <Percent className="w-3.5 h-3.5 text-[#EA580C]" />
            Recaudo
          </span>
        </div>

        <div className="p-3.5 space-y-2 text-xs">
          <MetricRow label="Pretendido" value={`$ ${fmtCents(box.totalSales ?? 0)}`} />
          <MetricRow label="Clientes a recaudar" value={String(metrics.totalClientCount)} valueClass="text-gray-700 font-extrabold font-mono" />
          <MetricRow label="Recaudo" value={`$ ${fmtCents(box.totalCollections ?? 0)}`} valueClass="text-[#16A34A] font-extrabold font-mono" />
          <MetricRow label="Recaudo Adicional" value={`$ ${fmtCents(box.totalIncomes ?? 0)}`} valueClass="text-[#16A34A] font-extrabold font-mono" />
          <MetricRow label="Cumplimiento" value={metrics.compliancePercent} valueClass="text-[#16A34A] font-extrabold font-mono" />
          <MetricRow label="% Recaudo de Unidad" value={metrics.compliancePercent} valueClass="text-[#16A34A] font-extrabold font-mono" />
          <MetricRow label="Recaudo Extra" value="$ 0,00" valueClass="text-gray-600 font-mono" />
          <MetricRow label="Clientes No Programados" value="0" valueClass="text-gray-600 font-bold font-mono" />
        </div>
      </div>

      <div className="bg-[#EA580C] text-white p-2.5 text-center text-[10px] font-black uppercase tracking-wider">
        Control de Caja y Cartera
      </div>
    </div>
  );
}
