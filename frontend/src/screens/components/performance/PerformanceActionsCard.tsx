import { FileText, MapPin, Smartphone, Users } from 'lucide-react';
import { Box, Screen } from '../../../types';
import { PerformanceMetrics } from '../../../utils/performanceMetrics';

interface PerformanceActionsCardProps {
  box: Box;
  userName: string;
  metrics: PerformanceMetrics;
  onNavigate?: (screen: Screen) => void;
}

export function PerformanceActionsCard({
  box,
  userName,
  metrics,
  onNavigate,
}: PerformanceActionsCardProps) {
  const navButtons = [
    { id: 'btn-perf-unidade', screen: 'route-list' as Screen, icon: MapPin, label: 'Unidad', iconClass: 'text-amber-300' },
    { id: 'btn-perf-dispositivo', screen: 'device-list' as Screen, icon: Smartphone, label: 'Dispositivo', iconClass: 'text-green-300' },
    { id: 'btn-perf-usuarios', screen: 'user-list' as Screen, icon: Users, label: 'Usuarios', iconClass: 'text-cyan-200' },
    { id: 'btn-perf-resumen', screen: 'box-summary' as Screen, icon: FileText, label: 'Resumen', iconClass: 'text-yellow-300' },
  ];

  return (
    <div className="bg-[#2563EB] text-white rounded-sm p-4 flex flex-col justify-between shadow-sm border border-[#1d4ed8] min-h-[480px]">
      <div>
        <div className="grid grid-cols-2 gap-2">
          {navButtons.map(({ id, screen, icon: Icon, label, iconClass }) => (
            <button
              key={id}
              id={id}
              onClick={() => onNavigate?.(screen)}
              className="bg-white/10 hover:bg-white/20 border border-white/20 rounded p-2 text-center font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all uppercase"
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${iconClass}`} />
              {label}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-1.5 text-xs bg-black/10 border border-white/10 p-3 rounded-sm">
          <p className="font-bold border-b border-white/15 pb-1 uppercase text-[10px] tracking-wider text-blue-200">
            Informações da Caixa
          </p>
          <div className="flex justify-between pt-1">
            <span className="text-blue-100 font-medium">Caja de CN:</span>
            <span className="font-bold text-white">{box.cnName || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-100 font-medium">Caja UGI:</span>
            <span className="font-bold text-white">{box.unitName || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-100 font-medium">Trabajador:</span>
            <span className="font-bold text-white">{box.userName || userName || '---'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-100 font-medium">Fecha Apertura:</span>
            <span className="font-mono text-[11px] text-white">
              {box.openedAt ? box.openedAt.toDate().toLocaleString('pt-BR') : '---'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-100 font-medium">Inicio Móvil:</span>
            <span className="font-mono text-[11px] text-white">
              {box.openedAt ? box.openedAt.toDate().toLocaleString('pt-BR') : '---'}
            </span>
          </div>
          <div className="flex justify-between items-center pt-0.5">
            <span className="text-blue-100 font-medium">Fecha Cierre:</span>
            {box.closedAt ? (
              <span className="bg-red-500/30 text-red-200 font-bold px-1.5 py-0.5 rounded text-[10px] uppercase font-mono">
                {box.closedAt.toDate().toLocaleString('pt-BR')}
              </span>
            ) : (
              <span className="bg-green-500/30 text-green-200 font-bold px-1.5 py-0.5 rounded text-[10px] uppercase">
                Em Aberto
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-1.5 text-xs">
          <p className="font-bold border-b border-white/10 pb-1 uppercase text-[10px] tracking-wider text-blue-200">
            Créditos
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="flex justify-between"><span className="text-blue-100">A Recaudar:</span><span className="font-bold font-mono">{metrics.pendingCreditRequests}</span></div>
            <div className="flex justify-between"><span className="text-blue-100">No Prog:</span><span className="font-bold font-mono">0</span></div>
            <div className="flex justify-between"><span className="text-blue-100">Nuevos:</span><span className="font-bold font-mono">{metrics.pendingCreditRequests}</span></div>
            <div className="flex justify-between"><span className="text-blue-100">Cancelados:</span><span className="font-bold font-mono">{metrics.rejectedCreditRequests}</span></div>
            <div className="flex justify-between col-span-2 border-t border-white/5 pt-1.5">
              <span className="text-blue-100">Activos:</span>
              <span className="font-bold font-mono text-white">{metrics.approvedCreditRequests}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-1.5 text-xs">
          <p className="font-bold border-b border-white/10 pb-1 uppercase text-[10px] tracking-wider text-blue-200">
            Movimiento de Créditos
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="flex justify-between"><span className="text-blue-100">Pagos:</span><span className="font-bold font-mono">{metrics.paymentsCount}</span></div>
            <div className="flex justify-between"><span className="text-blue-100">No Pago:</span><span className="font-bold font-mono">{metrics.nonPaymentsCount}</span></div>
            <div className="flex justify-between"><span className="text-blue-100">Sincronizados:</span><span className="font-bold font-mono">{metrics.synchronizedCount}</span></div>
            <div className="flex justify-between"><span className="text-blue-100">Eficiencia:</span><span className="font-black font-mono text-yellow-300">{metrics.efficiencyPercent}</span></div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 pt-2.5 mt-4 text-center">
        <span className="text-[9px] uppercase font-bold tracking-widest text-blue-200">
          ControlMax — Desempeño y Sincronización
        </span>
      </div>
    </div>
  );
}
