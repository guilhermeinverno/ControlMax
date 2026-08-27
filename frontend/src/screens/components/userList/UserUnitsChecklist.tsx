import type { TenantUnitOption } from '../../hooks/useTenantUnits';

interface UserUnitsChecklistProps {
  units: TenantUnitOption[];
  selectedIds: string[];
  onChange: (nextIds: string[]) => void;
  loading?: boolean;
  disabled?: boolean;
  emptyHint?: string;
}

export function UserUnitsChecklist({
  units,
  selectedIds,
  onChange,
  loading = false,
  disabled = false,
  emptyHint = 'Nenhuma unidade ativa cadastrada neste tenant.',
}: UserUnitsChecklistProps) {
  const selected = new Set(selectedIds);

  const toggle = (unitId: string) => {
    if (disabled) return;
    const next = new Set(selected);
    if (next.has(unitId)) next.delete(unitId);
    else next.add(unitId);
    onChange(Array.from(next));
  };

  const selectAll = () => {
    if (disabled) return;
    onChange(units.map((u) => u.id));
  };

  const clearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  if (loading) {
    return (
      <p className="text-[11px] font-semibold text-gray-500 py-2">Carregando unidades…</p>
    );
  }

  if (units.length === 0) {
    return <p className="text-[11px] font-semibold text-amber-700 py-2">{emptyHint}</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase font-bold text-gray-500">
          Unidades atribuídas ({selectedIds.length}/{units.length})
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            disabled={disabled}
            className="text-[10px] font-bold text-[#6B21A8] hover:underline disabled:opacity-50 cursor-pointer"
          >
            Todas
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={disabled}
            className="text-[10px] font-bold text-gray-500 hover:underline disabled:opacity-50 cursor-pointer"
          >
            Limpar
          </button>
        </div>
      </div>
      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-white divide-y divide-gray-100">
        {units.map((unit) => {
          const checked = selected.has(unit.id);
          return (
            <label
              key={unit.id}
              className={`flex items-start gap-2 px-3 py-2 text-xs cursor-pointer hover:bg-purple-50/50 ${
                disabled ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => toggle(unit.id)}
                className="mt-0.5 w-3.5 h-3.5 rounded border-gray-300 text-[#6B21A8] focus:ring-[#6B21A8]"
              />
              <span className="min-w-0">
                <span className="font-bold text-gray-800 block truncate">{unit.name}</span>
                {unit.cnName ? (
                  <span className="text-[10px] text-gray-400 font-medium">{unit.cnName}</span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
      <p className="text-[10px] text-gray-400 font-medium">
        Lista vazia = acesso amplo no piloto (gestores). Collectors devem ter ao menos uma unidade.
      </p>
    </div>
  );
}
