import { Building2, ChevronDown } from 'lucide-react';
import { BusinessCenter } from '../../../types/company';

interface CompanyListHeaderProps {
  centers: BusinessCenter[];
  selectedCnId: string;
  selectedUnitId: string;
  viewAllUnits: boolean;
  activeUnitsList: Array<{ id: string; name: string }>;
  onCnChange: (cnId: string) => void;
  onUnitChange: (unitId: string) => void;
  onViewAllUnitsChange: (value: boolean) => void;
}

export function CompanyListHeader({
  centers,
  selectedCnId,
  selectedUnitId,
  viewAllUnits,
  activeUnitsList,
  onCnChange,
  onUnitChange,
  onViewAllUnitsChange,
}: CompanyListHeaderProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
        <div className="flex flex-col">
          <label className="text-[10px] uppercase font-extrabold text-gray-400 mb-1">Centro de Negocio</label>
          <div className="relative">
            <select
              value={selectedCnId}
              onChange={(e) => onCnChange(e.target.value)}
              className="w-full sm:w-64 bg-[#F3F4F6] border border-gray-300 rounded px-3 py-2 text-xs font-bold appearance-none pr-8 cursor-pointer outline-none focus:border-[#6B21A8]"
            >
              {centers.map((center) => (
                <option key={center.id} value={center.id}>
                  {center.code ? `/${center.code}/ - ` : ''}
                  {center.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-[10px] uppercase font-extrabold text-gray-400 mb-1">Unidades</label>
          <div className="relative">
            <select
              value={selectedUnitId}
              onChange={(e) => onUnitChange(e.target.value)}
              disabled={viewAllUnits}
              className="w-full sm:w-64 bg-[#F3F4F6] border border-gray-300 rounded px-3 py-2 text-xs font-bold appearance-none pr-8 cursor-pointer outline-none focus:border-[#6B21A8] disabled:opacity-50"
            >
              <option value="all">Todas las unidades ({activeUnitsList.length})</option>
              {activeUnitsList.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 sm:mt-5">
          <input
            type="checkbox"
            id="viewAllUnits"
            checked={viewAllUnits}
            onChange={(e) => onViewAllUnitsChange(e.target.checked)}
            className="w-4.5 h-4.5 rounded border-gray-300 text-[#8CC63F] focus:ring-[#8CC63F] cursor-pointer"
          />
          <label htmlFor="viewAllUnits" className="text-xs font-bold text-gray-600 cursor-pointer select-none">
            Ver todas las unidades
          </label>
        </div>
      </div>

      <div className="text-right flex flex-col items-end">
        <div className="text-xs text-purple-700 font-extrabold flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-[#8CC63F]" />
          <span>Gestión de Clientes</span>
        </div>
        <p className="text-[10px] text-gray-400 mt-0.5 font-mono">Canal de auditoría e inscripción</p>
      </div>
    </div>
  );
}
