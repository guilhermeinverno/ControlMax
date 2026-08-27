import { useCallback, useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { useTenant } from './useTenant';
import type { PermissionMatrix, TenantRole } from '../types/rbac';
import { emptyPermissionMatrix } from '../types/rbac';

async function authHeaders(): Promise<Record<string, string>> {
  if (!auth?.currentUser) throw new Error('Usuario no autenticado.');
  const token = await auth.currentUser.getIdToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export function useTenantRoles() {
  const { tenantId } = useTenant();
  const [roles, setRoles] = useState<TenantRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/admin/roles', { headers });
      const data = await res.json().catch(() => ({} as { error?: string; roles?: TenantRole[] }));
      if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
      setRoles(Array.isArray(data.roles) ? data.roles : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar perfis.');
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createRole = useCallback(
    async (input: { name: string; description?: string; permissions?: PermissionMatrix }) => {
      setSaving(true);
      try {
        const headers = await authHeaders();
        const res = await fetch('/api/admin/roles', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: input.name,
            description: input.description || '',
            permissions: input.permissions || emptyPermissionMatrix(),
          }),
        });
        const data = await res.json().catch(() => ({} as { error?: string; role?: TenantRole }));
        if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
        await refresh();
        return data.role as TenantRole;
      } finally {
        setSaving(false);
      }
    },
    [refresh]
  );

  const updateRole = useCallback(
    async (
      id: string,
      input: { name?: string; description?: string; permissions?: PermissionMatrix }
    ) => {
      setSaving(true);
      try {
        const headers = await authHeaders();
        const res = await fetch(`/api/admin/roles/${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(input),
        });
        const data = await res.json().catch(() => ({} as { error?: string; role?: TenantRole }));
        if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
        await refresh();
        return data.role as TenantRole;
      } finally {
        setSaving(false);
      }
    },
    [refresh]
  );

  const deleteRole = useCallback(
    async (id: string) => {
      setSaving(true);
      try {
        const headers = await authHeaders();
        const res = await fetch(`/api/admin/roles/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers,
        });
        const data = await res.json().catch(() => ({} as { error?: string }));
        if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
        await refresh();
      } finally {
        setSaving(false);
      }
    },
    [refresh]
  );

  const cloneRole = useCallback(
    async (source: TenantRole, newName: string) => {
      return createRole({
        name: newName,
        description: source.description ? `Cópia de: ${source.description}` : `Cópia de ${source.name}`,
        permissions: source.permissions,
      });
    },
    [createRole]
  );

  return {
    roles,
    loading,
    error,
    saving,
    refresh,
    createRole,
    updateRole,
    deleteRole,
    cloneRole,
  };
}
