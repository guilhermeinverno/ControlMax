import {
  Calculator,
  Calendar,
  MapPin,
  Phone as PhoneIcon,
  RefreshCw,
  Smartphone,
  Target,
} from 'lucide-react';
import { DEFAULT_DEVICE_APP_VERSION } from '../../../constants/device';
import { fmtCents } from '../../../utils/fmtCents';
import { pickJsDate } from '../../../utils/firestoreTimestamp';
import { dashboardBoxListStatusLabel } from '../../../utils/statusLabels';
import type { DashboardBoxRecord } from '../../../types/dashboardBox';

interface DashboardBoxCardProps {
  record: DashboardBoxRecord;
}

export function DashboardBoxCard({ record }: DashboardBoxCardProps) {
  const openedDate = record.openedAt ? record.openedAt.toDate() : new Date();
  const dateBoxStr = openedDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const syncDate = pickJsDate(record.closedAt, record.openedAt);
  const syncStr = syncDate.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const statusLabel = dashboardBoxListStatusLabel(record.status);

  return (
    <div className="bg-white border border-gray-200 shadow-xs rounded-xl p-3 flex flex-col space-y-3 hover:border-purple-300 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-[#6B21A8]">
            <Smartphone className="w-7 h-7 stroke-[1.8]" />
          </div>
          <div>
            <span className="block text-[11px] text-gray-400 font-bold leading-none mb-1">Unidad</span>
            <span className="block text-base font-black text-gray-800 tracking-tight">
              {record.unitName || '3 - RT 03'}
            </span>
          </div>
        </div>
        <div className="bg-gray-500/80 rounded px-2.5 py-1.5 text-center flex flex-col items-center justify-center min-w-[50px] shadow-3xs">
          <span className="text-[9px] uppercase font-bold text-white/90 tracking-wider">Score</span>
          <span className="text-sm font-black text-white leading-none mt-0.5">N</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="flex items-center space-x-2.5">
          <div className="text-[#6B21A8]">
            <Calculator className="w-5.5 h-5.5 stroke-[1.8]" />
          </div>
          <div>
            <div className="flex items-center space-x-1">
              <span className="text-[10px] text-gray-400 font-bold leading-none">Caja</span>
              <span className="w-2.5 h-2.5 bg-[#8CC63F] rounded-xs inline-block" />
            </div>
            <span className="text-xs font-extrabold text-gray-700 mt-1 block">
              {record.id.slice(0, 8) || '1006671'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <div className="text-[#6B21A8]">
            <Target className="w-5.5 h-5.5 stroke-[1.8]" />
          </div>
          <div>
            <span className="block text-[10px] text-gray-400 font-bold leading-none">Centro de negocios</span>
            <span className="text-xs font-extrabold text-gray-700 mt-1 block">
              {record.cnName ? record.cnName.split(' ')[0] : '/1/'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-2.5">
        <div>
          <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
            Caja Inicial
          </span>
          <span className="block text-sm font-extrabold text-gray-800">${fmtCents(record.initialAmount || 0)}</span>
        </div>
        <div>
          <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Caja Final</span>
          <span className="block text-sm font-extrabold text-gray-800">${fmtCents(record.finalAmount || 0)}</span>
        </div>
      </div>

      <div className="w-full bg-[#BEF264]/90 rounded-full py-1 text-center font-extrabold text-[11px] text-emerald-950 shadow-3xs tracking-wide">
        Progreso: 100%
      </div>

      <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 border-t border-gray-100 pt-3 text-xs">
        <div className="flex items-start space-x-2">
          <Calendar className="w-5.5 h-5.5 text-[#6B21A8] shrink-0 stroke-[1.8] mt-0.5" />
          <div>
            <span className="block text-[10px] text-gray-400 font-bold leading-none mb-1">Fecha de la caja</span>
            <span className="block text-xs font-extrabold text-gray-700">
              {statusLabel} {dateBoxStr}
            </span>
          </div>
        </div>

        <div className="flex items-start space-x-2">
          <MapPin className="w-5.5 h-5.5 text-[#6B21A8] shrink-0 stroke-[1.8] mt-0.5" />
          <div>
            <span className="block text-[10px] text-gray-400 font-bold leading-none mb-1">Ubicación</span>
            <span className="block text-xs font-extrabold text-gray-700 leading-tight">
              Distrito Federal , Brazil
            </span>
          </div>
        </div>

        <div className="flex items-start space-x-2">
          <RefreshCw className="w-5.5 h-5.5 text-[#6B21A8] shrink-0 stroke-[1.8] mt-0.5" />
          <div>
            <span className="block text-[10px] text-gray-400 font-bold leading-none mb-1">Sync</span>
            <span className="block text-xs font-extrabold text-gray-700 leading-tight">{syncStr}</span>
          </div>
        </div>

        <div className="flex items-start space-x-2">
          <PhoneIcon className="w-5.5 h-5.5 text-[#6B21A8] shrink-0 stroke-[1.8] mt-0.5" />
          <div>
            <span className="block text-[10px] text-gray-400 font-bold leading-none mb-1">PIN/Versión App</span>
            <span className="block text-xs font-extrabold text-gray-700">- / {DEFAULT_DEVICE_APP_VERSION}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
