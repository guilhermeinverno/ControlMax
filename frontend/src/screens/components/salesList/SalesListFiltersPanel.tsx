import { ListFilter, Search, X } from 'lucide-react';

type ConsultarPor = 'active' | 'inactive' | 'castigadas';

interface SalesListFiltersPanelProps {
  consultarPor: ConsultarPor;
  fechaInicio: string;
  fechaFin: string;
  incluirFecha: boolean;
  search: string;
  onConsultarPorChange: (value: ConsultarPor) => void;
  onFechaInicioChange: (value: string) => void;
  onFechaFinChange: (value: string) => void;
  onIncluirFechaChange: (value: boolean) => void;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
}

export function SalesListFiltersPanel({
  consultarPor,
  fechaInicio,
  fechaFin,
  incluirFecha,
  search,
  onConsultarPorChange,
  onFechaInicioChange,
  onFechaFinChange,
  onIncluirFechaChange,
  onSearchChange,
  onClearSearch,
}: SalesListFiltersPanelProps) {
  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl shadow-lg overflow-hidden">
      <div className="inline-flex items-center bg-[#BEF264] text-gray-900 font-extrabold text-[13px] px-5 py-2.5 rounded-br-2xl shadow-xs space-x-2 border-r border-b border-gray-100">
        <ListFilter size={15} className="stroke-[2.5]" />
        <span>Lista de ventas</span>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <span className="block text-xs font-extrabold text-gray-500 mb-2">Consultar por</span>
          <div className="flex flex-col space-y-1.5 pl-1">
            {(
              [
                ['active', 'Ventas activas'],
                ['inactive', 'Ventas inactivas'],
                ['castigadas', 'Ventas castigadas'],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="flex items-center space-x-2.5 cursor-pointer text-xs font-bold text-gray-700">
                <input
                  type="radio"
                  name="consultarPor"
                  checked={consultarPor === value}
                  onChange={() => onConsultarPorChange(value)}
                  className="w-4.5 h-4.5 border-purple-300 text-[#6B21A8] focus:ring-[#6B21A8]"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5 pt-1">
          <div>
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Fecha inicio</span>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => onFechaInicioChange(e.target.value)}
              className="w-full border border-purple-300 rounded-md p-2.5 text-xs font-bold text-gray-700 outline-none focus:ring-1 focus:ring-[#6B21A8]"
            />
          </div>
          <div>
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Fecha fin</span>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => onFechaFinChange(e.target.value)}
              className="w-full border border-purple-300 rounded-md p-2.5 text-xs font-bold text-gray-700 outline-none focus:ring-1 focus:ring-[#6B21A8]"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 pl-0.5">
          <input
            type="checkbox"
            id="incluir-fecha-check"
            checked={incluirFecha}
            onChange={(e) => onIncluirFechaChange(e.target.checked)}
            className="w-4 h-4 border-purple-300 text-[#6B21A8] rounded-xs focus:ring-[#6B21A8] cursor-pointer"
          />
          <label htmlFor="incluir-fecha-check" className="text-xs font-bold text-gray-600 cursor-pointer">
            Incluir fecha:
          </label>
        </div>

        <div className="flex items-center border border-purple-300 rounded-md overflow-hidden shadow-2xs">
          <input
            type="text"
            placeholder="Ejem: id Cliente, id ver"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 bg-white px-3 py-3 text-xs text-gray-700 outline-none placeholder-gray-400"
          />
          {search ? (
            <button onClick={onClearSearch} className="px-2 text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          ) : null}
          <div className="bg-[#8CC63F] p-3 text-white flex items-center justify-center cursor-pointer hover:bg-[#7cb235] transition-colors">
            <Search size={16} className="stroke-[3]" />
          </div>
        </div>
      </div>
    </div>
  );
}
