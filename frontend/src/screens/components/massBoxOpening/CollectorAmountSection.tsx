interface CollectorAmountSectionProps {
  hasOpenBox: boolean;
  useIndividualAmounts: boolean;
  collectorId: string;
  amount: string;
  onAmountChange: (id: string, value: string) => void;
  onAmountBlur: (id: string) => void;
}

export function CollectorAmountSection({
  hasOpenBox,
  useIndividualAmounts,
  collectorId,
  amount,
  onAmountChange,
  onAmountBlur,
}: CollectorAmountSectionProps) {
  if (hasOpenBox) {
    return (
      <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-1 rounded border border-yellow-200 whitespace-nowrap uppercase tracking-wider">
        Já aberta hoje
      </span>
    );
  }

  if (!useIndividualAmounts) return null;

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-400 font-bold">$</span>
      <input
        type="text"
        value={amount}
        placeholder="0,00"
        onChange={(e) => onAmountChange(collectorId, e.target.value)}
        onBlur={() => onAmountBlur(collectorId)}
        className="w-28 text-right border border-gray-300 rounded text-xs p-1.5 focus:ring-1 focus:ring-[#6B21A8] outline-none font-bold text-gray-800 shadow-sm bg-white"
      />
    </div>
  );
}
