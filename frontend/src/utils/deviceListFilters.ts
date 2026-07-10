import { auth } from '../lib/firebase';
import type { Device } from '../types';

export function filterDevices(
  devices: Device[],
  searchQuery: string,
  isCollector: boolean
): Device[] {
  return devices.filter((d) => {
    if (isCollector && d.assignedUserId !== auth.currentUser?.uid) return false;

    const queryLower = searchQuery.toLowerCase();
    return (
      (d.deviceName || '').toLowerCase().includes(queryLower) ||
      (d.deviceModel || '').toLowerCase().includes(queryLower) ||
      (d.deviceId || '').toLowerCase().includes(queryLower) ||
      (d.assignedUserName || '').toLowerCase().includes(queryLower)
    );
  });
}
