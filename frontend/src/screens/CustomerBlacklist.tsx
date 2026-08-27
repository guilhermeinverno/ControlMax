import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { AlertCircle, Ban, Loader2, Plus, ShieldAlert, Trash2 } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { useTenant } from '../hooks/useTenant';
import { Screen } from '../types';
import { parseUnknownTimestamp } from '../utils/timestampParsing';
import { ListEmptyState, ListErrorBanner } from '../components/ListFeedback';

interface CustomerBlacklistProps {
  onNavigate?: (screen: Screen) => void;
}

interface BlacklistRow {
  id: string;
  clientId: string;
  clientName: string;
  docNumber: string;
  reason: string;
  createdByName: string;
  at: Date | null;
}

interface ClientOption {
  id: string;
  name: string;
  docNumber: string;
}

/** P1-01 — gestión de lista negra (lectura Firestore; escritura via BFF). */
export function CustomerBlacklist({ onNavigate }: CustomerBlacklistProps) {
  const { tenantId, role, isSuperAdmin, loading: tenantLoading } = useTenant();
  const [rows, setRows] = useState<BlacklistRow[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [clientId, setClientId] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  const canManage =
    isSuperAdmin ||
    ['admin', 'supervisor', 'gerente', 'director', 'coordinador'].includes(String(role || '').toLowerCase());

  useEffect(() => {
    if (!tenantId || !canManage) return;
    setLoading(true);
    const q = query(
      collection(db, 'customer_blacklist'),
      where('tenantId', '==', tenantId),
      where('active', '==', true),
      orderBy('createdAt', 'desc'),
      limit(200)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setRows(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              clientId: String(data.clientId || ''),
              clientName: String(data.clientName || ''),
              docNumber: String(data.docNumber || ''),
              reason: String(data.reason || ''),
              createdByName: String(data.createdByName || ''),
              at: parseUnknownTimestamp(data.createdAt),
            };
          })
        );
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(err);
        setError('No se pudo cargar la lista negra (¿índice Firestore?).');
        setLoading(false);
      }
    );
    return () => unsub();
  }, [tenantId, canManage, reloadToken]);

  useEffect(() => {
    if (!tenantId || !canManage) return;
    const q = query(collection(db, 'customers'), where('tenantId', '==', tenantId), limit(300));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setClients(
          snap.docs.map((d) => {
            const data = d.data();
            const name =
              [data.name, data.firstName, data.nombre, data.apellidos].filter(Boolean).join(' ').trim() ||
              String(data.clientName || d.id);
            return {
              id: d.id,
              name,
              docNumber: String(data.docNumber || data.document || data.documento || ''),
            };
          })
        );
      },
      () => {
        /* customers puede estar vacío / sin índice — no bloquear tela */
      }
    );
    return () => unsub();
  }, [tenantId, canManage]);

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients.slice(0, 50);
    return clients
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.docNumber.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q)
      )
      .slice(0, 50);
  }, [clients, search]);

  const selectedClient = clients.find((c) => c.id === clientId);

  const addEntry = async () => {
    if (!auth?.currentUser || !clientId) return;
    setSubmitting(true);
    setError(null);
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/admin/blacklist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientId,
          clientName: selectedClient?.name || '',
          docNumber: selectedClient?.docNumber || '',
          reason,
        }),
      });
      const data = await response.json().catch(() => ({} as { error?: string }));
      if (!response.ok) throw new Error(data.error || `Error ${response.status}`);
      setClientId('');
      setReason('');
      setSearch('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar.');
    } finally {
      setSubmitting(false);
    }
  };

  const removeEntry = async (id: string) => {
    if (!auth?.currentUser) return;
    if (!window.confirm('¿Quitar de la lista negra?')) return;
    setSubmitting(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/admin/blacklist/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });
      const data = await response.json().catch(() => ({} as { error?: string }));
      if (!response.ok) throw new Error(data.error || `Error ${response.status}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al quitar.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!tenantLoading && !canManage) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
        <ShieldAlert className="w-10 h-10 text-red-500" />
        <p className="font-bold text-gray-800">Acceso denegado</p>
        <button type="button" className="text-[#6A008A] text-sm underline" onClick={() => onNavigate?.('dashboard')}>
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-black text-[#6A008A] flex items-center gap-2">
          <Ban className="w-7 h-7" /> Lista negra
        </h1>
        <p className="text-sm text-gray-600">
          Clientes bloqueados no pueden recibir ventas nuevas (BFF responde 403).
        </p>
      </header>

      {error && (
        <ListErrorBanner
          message={error}
          onRetry={() => setReloadToken((n) => n + 1)}
          retryLabel="Reintentar"
        />
      )}

      <section className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <h2 className="text-sm font-bold text-gray-800">Agregar cliente</h2>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o documento…"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="">Seleccione un cliente…</option>
          {filteredClients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.docNumber ? ` · ${c.docNumber}` : ''}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Motivo (opcional)"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        <button
          type="button"
          disabled={!clientId || submitting}
          onClick={addEntry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#6A008A] text-white text-sm font-bold disabled:opacity-40"
        >
          <Plus className="w-4 h-4" /> Agregar
        </button>
      </section>

      <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 text-xs font-bold uppercase text-gray-500">
          Activos ({rows.length})
        </div>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-7 h-7 animate-spin text-gray-400" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-4">
            <ListEmptyState
              title="Lista vacía"
              description="No hay clientes bloqueados en este momento."
            />
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {rows.map((row) => (
              <li key={row.id} className="px-4 py-3 flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-800 truncate">{row.clientName || row.clientId}</p>
                  <p className="text-xs text-gray-500">
                    {row.docNumber ? `Doc ${row.docNumber} · ` : ''}
                    {row.reason || 'Sin motivo'} · {row.createdByName || '—'}
                    {row.at ? ` · ${row.at.toLocaleString('pt-BR')}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => removeEntry(row.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                  title="Quitar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
