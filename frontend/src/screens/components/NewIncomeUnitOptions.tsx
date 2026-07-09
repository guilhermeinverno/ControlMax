import { BusinessCenter } from '../../types/company';

interface NewIncomeUnitOptionsProps {
  centers: BusinessCenter[];
  selectedCnId: string;
}

export function NewIncomeUnitOptions({ centers, selectedCnId }: NewIncomeUnitOptionsProps) {
  if (centers.length === 0) {
    return <option value="">Todas las unidades (1)</option>;
  }

  const cn = centers.find((center) => center.id === selectedCnId);
  if (!cn?.linkedUnits?.length) {
    return <option value="">Todas las unidades (0)</option>;
  }

  return (
    <>
      <option value="">Todas las unidades ({cn.linkedUnits.length})</option>
      {cn.linkedUnits.map((unit) => (
        <option key={unit.id} value={unit.id}>
          {unit.name}
        </option>
      ))}
    </>
  );
}
