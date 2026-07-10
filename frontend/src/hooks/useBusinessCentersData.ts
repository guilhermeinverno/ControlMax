import { useEffect, useState } from 'react';
import type { BusinessCenter } from '../types/businessCenter';
import { subscribeBusinessCenters } from '../utils/businessCenterSubscription';

export function useBusinessCentersData(tenantId?: string) {
  const [centers, setCenters] = useState<BusinessCenter[]>([]);
  const [loadingCenters, setLoadingCenters] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    return subscribeBusinessCenters(tenantId, setCenters, setLoadingCenters);
  }, [tenantId]);

  return { centers, loadingCenters, setCenters };
}
