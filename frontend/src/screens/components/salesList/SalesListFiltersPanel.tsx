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
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
      {/* Banner Verde Limão "Lista de ventas" */}
      <div className="inline-flex items-center bg-[#8CC63F] text-gray-900 font-extrabold text-sm px-6 py-2.5 rounded-br-xl shadow-xs space-x-2">
        <ListFilter size={16} className="stroke-[2.5]" />
        <span>Lista de ventas</span>
      </div>

      <div className="p-6 space-y-5">
        {/* Radio options in horizontal row */}
        <div>
          <span className="block text-sm font-semibold text-gray-700 mb-2">Consultar por</span>
          <div className="flex flex-wrap items-center gap-6">
            {(
              [
                ['active', 'Ventas activas'],
                ['inactive', 'Ventas inactivas'],
                ['castigadas', 'Ventas castigadas'],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-gray-700 hover:text-gray-900">
                <input
                  type="radio"
                  name="consultarPor"
                  checked={consultarPor === value}
                  onChange={() => onConsultarPorChange(value)}
                  className="w-4 h-4 accent-[#8CC63F] cursor-pointer"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Date Row */}
        <div className="flex flex-wrap items-end gap-6 pt-1">
          <div>
            <span className="block text-xs font-medium text-gray-600 mb-1">Fecha inicio</span>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => onFechaInicioChange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-xs text-gray-700 outline-none focus:border-[#8CC63F] w-48"
            />
          </div>
          <div>
            <span className="block text-xs font-medium text-gray-600 mb-1">Fecha fin</span>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => onFechaFinChange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-xs text-gray-700 outline-none focus:border-[#8CC63F] w-48"
            />
          </div>
          <div className="flex items-center space-x-2 pb-2">
            <input
              type="checkbox"
              id="incluir-fecha-check"
              checked={incluirFecha}
              onChange={(e) => onIncluirFechaChange(e.target.checked)}
              className="w-4 h-4 accent-[#8CC63F] rounded cursor-pointer"
            />
            <label htmlFor="incluir-fecha-check" className="text-xs font-medium text-gray-700 cursor-pointer">
              Incluir fecha:
            </label>
          </div>
        </div>

        {/* Search Input with Green Button */}
        <div className="max-w-2xl pt-2">
          <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white shadow-2xs focus-within:border-[#8CC63F]">
            <input
              type="text"
              placeholder="Ejem: id Cliente, id venta, Nombre, apellido, Nºdocumento del cliente o Nº U"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="flex-1 px-4 py-2.5 text-xs text-gray-700 outline-none placeholder-gray-400"
            />
            {search && (
              <button
                type="button"
                onClick={onClearSearch}
                className="px-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            )}
            <button
              type="button"
              className="bg-[#8CC63F] hover:bg-[#7cb332] text-white px-5 py-2.5 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Search size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
