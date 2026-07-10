import { useState, useEffect, useCallback } from 'react';
import { UserRole } from '../types';
import { createTenantSubscription } from './useTenantSubscription';

export function useTenant() {
  const [tenantId, setTenantId] = useState<string>('');
  const [role, setRole] = useState<UserRole>('collector');
  const [userName, setUserName] = useState<string>('');
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const retry = useCallback(() => {
    setError(null);
    setLoading(true);
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    return createTenantSubscription({
      setTenantId,
      setRole,
      setUserName,
      setIsSuperAdmin,
      setLoading,
      setError,
    });
  }, [refreshKey]);

  return { tenantId, role, userName, isSuperAdmin, loading, error, retry };
}
