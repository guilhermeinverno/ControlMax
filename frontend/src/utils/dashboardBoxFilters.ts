import type { DashboardBoxRecord } from '../types/dashboardBox';

export function filterDashboardBoxes(
  boxes: DashboardBoxRecord[],
  options: {
    role: string | undefined;
    currentUserId: string | undefined;
    verTodas: boolean;
    selectedCnId: string;
    selectedUnitId: string;
  }
): DashboardBoxRecord[] {
  return boxes.filter((record) => {
    if (options.role === 'collector' && !options.verTodas) {
      if (record.userId !== options.currentUserId) return false;
    }
    if (options.selectedCnId !== '' && record.cnId !== options.selectedCnId) return false;
    if (options.selectedUnitId !== '' && record.unitId !== options.selectedUnitId) return false;
    return true;
  });
}
