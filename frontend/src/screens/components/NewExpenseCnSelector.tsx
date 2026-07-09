import { BusinessCenter } from '../../types/company';

interface NewExpenseCnSelectorProps {
  centers: BusinessCenter[];
  selectedCnId: string;
  onCnChange: (cnId: string) => void;
}

export function NewExpenseCnSelector({ centers, selectedCnId, onCnChange }: NewExpenseCnSelectorProps) {
  return (
    <div className="px-4 pt-4 pb-3 max-w-md mx-auto w-full">
      <div className="relative">
        <select
          value={selectedCnId}
          onChange={(e) => onCnChange(e.target.value)}
          className="w-full border border-gray-300 rounded-xl bg-white text-gray-800 text-sm p-3 outline-none shadow-xs appearance-none focus:ring-1 focus:ring-[#6A008A] font-medium"
        >
          {centers.length === 0 ? (
            <option value="">/1/ - CN de la sociedad 6501</option>
          ) : (
            centers.map((center) => (
              <option key={center.id} value={center.id}>
                {center.code ? `/${center.code}/ - ` : ''}
                {center.name}
              </option>
            ))
          )}
        </select>
        <div className="absolute right-4 top-4.5 pointer-events-none text-gray-400">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
