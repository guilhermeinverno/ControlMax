import { BusinessCenter, BusinessCenterUnit } from '../types/company';

export interface CnUnitSelection {
  cnId: string;
  unitId: string;
  unitName: string;
}

export interface ActiveBoxRef {
  cnId?: string;
  unitId?: string;
  unitName?: string;
}

export function mapBusinessCenterDoc(id: string, data: Record<string, unknown>): BusinessCenter | null {
  const status = (data.status as string) || 'Activo';
  if (status !== 'Activo') return null;

  return {
    id,
    name: (data.name as string) || '',
    code: (data.code as string) || '',
    linkedUnits: (data.linkedUnits as BusinessCenterUnit[]) || [],
  };
}

export function pickUnitInCenter(
  cn: BusinessCenter,
  preferredUnitId?: string,
  preferredUnitName?: string,
): CnUnitSelection {
  const units = cn.linkedUnits ?? [];
  if (units.length === 0) {
    return { cnId: cn.id, unitId: '', unitName: '' };
  }

  const matched = units.find(
    (unit) => unit.id === preferredUnitId || unit.name === preferredUnitName,
  );
  const unit = matched ?? units[0];
  return { cnId: cn.id, unitId: unit.id, unitName: unit.name };
}

export function resolveDefaultCnUnitSelection(
  centers: BusinessCenter[],
  activeBox?: ActiveBoxRef | null,
): CnUnitSelection | null {
  if (centers.length === 0) return null;

  if (activeBox?.cnId) {
    const matchingCn = centers.find((center) => center.id === activeBox.cnId);
    if (matchingCn) {
      return pickUnitInCenter(matchingCn, activeBox.unitId, activeBox.unitName);
    }
  }

  return pickUnitInCenter(centers[0]);
}

export function findUnitInCenter(
  centers: BusinessCenter[],
  cnId: string,
  unitId: string,
): CnUnitSelection | null {
  const cn = centers.find((center) => center.id === cnId);
  if (!cn) return null;

  const unit = cn.linkedUnits.find((item) => item.id === unitId);
  if (!unit) return null;

  return { cnId: cn.id, unitId: unit.id, unitName: unit.name };
}
