function ChevronDownIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-chevron-down"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

interface SalesListUnitFiltersProps {
  selectedCn: string;
  selectedUnit: string;
  verTodasUnidades: boolean;
  filteredSalesCount: number;
  cnOptions: string[];
  unitOptions: string[];
  onCnChange: (value: string) => void;
  onUnitChange: (value: string) => void;
  onVerTodasChange: (value: boolean) => void;
}

export function SalesListUnitFilters({
  selectedCn,
  selectedUnit,
  verTodasUnidades,
  filteredSalesCount,
  cnOptions,
  unitOptions,
  onCnChange,
  onUnitChange,
  onVerTodasChange,
}: SalesListUnitFiltersProps) {
  return (
    <div className="space-y-2">
      <div className="relative">
        <select
          value={selectedCn}
          onChange={(e) => onCnChange(e.target.value)}
          className="w-full border border-purple-300 rounded-md bg-white text-gray-700 text-xs font-bold py-3 pl-3 pr-10 outline-none appearance-none shadow-xs cursor-pointer"
        >
          <option value="all">/1/ - CN de la sociedad 6501</option>
          {cnOptions.map((cn) => (
            <option key={cn} value={cn}>
              {cn}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-purple-800">
          <ChevronDownIcon />
        </div>
      </div>

      <div className="relative">
        <select
          value={selectedUnit}
          onChange={(e) => onUnitChange(e.target.value)}
          className="w-full border border-purple-300 rounded-md bg-white text-gray-700 text-xs font-bold py-3 pl-3 pr-10 outline-none appearance-none shadow-xs cursor-pointer"
        >
          <option value="all">Todas las unidades ({filteredSalesCount})</option>
          {unitOptions.map((unit) => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-purple-800">
          <ChevronDownIcon />
        </div>
      </div>

      <div className="flex items-center space-x-2.5 pt-0.5 px-0.5">
        <input
          type="checkbox"
          id="ver-todas-sales"
          checked={verTodasUnidades}
          onChange={(e) => onVerTodasChange(e.target.checked)}
          className="w-4.5 h-4.5 border-purple-300 text-[#6B21A8] rounded-sm focus:ring-[#6B21A8] cursor-pointer"
        />
        <label htmlFor="ver-todas-sales" className="text-xs font-bold text-gray-700 cursor-pointer">
          Ver todas las unidades
        </label>
      </div>
    </div>
  );
}
