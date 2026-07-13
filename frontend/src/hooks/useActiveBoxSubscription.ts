import { useEffect, useState } from 'react';
import { subscribeAuthActiveBox } from '../utils/activeBoxSubscription';

export function useActiveBoxSubscription(tenantId?: string, refreshKey = 0) {
  const [activeBox, setActiveBox] = useState<import('../types').Box | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return subscribeAuthActiveBox(
      tenantId,
      setActiveBox,
      setLoading,
      (message) => setError(message)
    );
  }, [tenantId, refreshKey]);

  return { activeBox, loading, error, setError, setLoading };
}
