import { useEffect, useMemo, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { AlertCircle, Loader2, RefreshCw, Shield } from 'lucide-react';
import { db } from '../lib/firebase';
import { useTenant } from '../hooks/useTenant';
import { Screen } from '../types';
import { parseUnknownTimestamp } from '../utils/timestampParsing';

interface AuditLogsProps {
  onNavigate?: (screen: Screen) => void;
}

type LogSource = 'security_logs' | 'audit_logs' | 'all';

interface UnifiedLogRow {
  id: string;
  source: 'security_logs' | 'audit_logs';
  tenantId: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  status: string;
  entity: string;
  entityId: string;
  detail: string;
  changesCount: number;
  at: Date | null;
}

function formatTs(d: Date | null): string {
  if (!d) return '—';
  return d.toLocaleString('pt-BR');
}

/**
 * AUD-01 — Log de ações reais (security_logs + audit_logs).
 */
export function AuditLogs({ onNavigate }: AuditLogsProps) {
  const { tenantId, role, isSuperAdmin, loading: tenantLoading } = useTenant();
  const [source, setSource] = useState<LogSource>('all');
  const [securityRows, setSecurityRows] = useState<UnifiedLogRow[]>([]);
  const [auditRows, setAuditRows] = useState<UnifiedLogRow[]>([]);
  const [loadingSec, setLoadingSec] = useState(true);
  const [loadingAud, setLoadingAud] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canView = isSuperAdmin || ['admin', 'supervisor', 'gerente', 'director', 'coordinador'].includes(String(role || '').toLowerCase());

  useEffect(() => {
    if (!tenantId || !canView) return;

    setLoadingSec(true);
    setError(null);
    const q = query(
      collection(db, 'security_logs'),
      where('tenantId', '==', tenantId),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: UnifiedLogRow[] = snap.docs.map((docSnap) => {
          const d = docSnap.data();
          const at =
            parseUnknownTimestamp(d.timestamp) ||
            parseUnknownTimestamp(d.createdAt) ||
            null;
          return {
            id: docSnap.id,
            source: 'security_logs',
            tenantId: String(d.tenantId || ''),
            userId: String(d.usuario_id || d.userId || ''),
            userName: String(d.userName || d.operador_role || ''),
            userEmail: String(d.userEmail || ''),
            action: String(d.acao || d.action || 'SECURITY'),
            status: String(d.status || '—'),
            entity: 'security',
            entityId: String(d.unidad_id || d.boxId || d.entityId || '—'),
            detail: String(d.message || d.ip_origem || ''),
            changesCount: 0,
            at,
          };
        });
        setSecurityRows(rows);
        setLoadingSec(false);
      },
      (err) => {
        console.error('security_logs query failed:', err);
        setError('Não foi possível carregar security_logs (índice ou permissão).');
        setLoadingSec(false);
      }
    );

    return () => unsub();
  }, [tenantId, canView]);

  useEffect(() => {
    if (!tenantId || !canView) return;

    setLoadingAud(true);
    const q = query(
      collection(db, 'audit_logs'),
      where('tenantId', '==', tenantId),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: UnifiedLogRow[] = snap.docs.map((docSnap) => {
          const d = docSnap.data();
          const at = parseUnknownTimestamp(d.timestamp) || parseUnknownTimestamp(d.createdAt) || null;
          return {
            id: docSnap.id,
            source: 'audit_logs',
            tenantId: String(d.tenantId || ''),
            userId: String(d.userId || ''),
            userName: String(d.userName || d.userEmail || ''),
            userEmail: String(d.userEmail || ''),
            action: String(d.action || 'AUDIT'),
            status: 'RECORDED',
            entity: String(d.entity || '—'),
            entityId: String(d.entityId || d.boxId || d.originalTransactionId || '—'),
            detail: String(d.reason || ''),
            changesCount: Array.isArray(d.changes) ? d.changes.length : 0,
            at,
          };
        });
        setAuditRows(rows);
        setLoadingAud(false);
      },
      (err) => {
        console.error('audit_logs query failed:', err);
        setError((prev) => prev || 'Não foi possível carregar audit_logs (índice ou permissão).');
        setLoadingAud(false);
      }
    );

    return () => unsub();
  }, [tenantId, canView]);

  const rows = useMemo(() => {
    const merged =
      source === 'security_logs'
        ? securityRows
        : source === 'audit_logs'
          ? auditRows
          : [...securityRows, ...auditRows];
    return merged.sort((a, b) => (b.at?.getTime() || 0) - (a.at?.getTime() || 0));
  }, [source, securityRows, auditRows]);

  if (tenantLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#6A008A]" />
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="font-bold text-amber-900 text-sm">Acesso restrito</p>
            <p className="text-amber-800 text-xs mt-1">Apenas gestores podem visualizar o log de ações.</p>
            <button
              type="button"
              onClick={() => onNavigate?.('dashboard')}
              className="mt-3 text-xs font-bold text-[#6A008A] underline cursor-pointer"
            >
              Voltar ao dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const loading = loadingSec || loadingAud;

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto p-4 pb-12 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-[#6A008A]" />
          <div>
            <h1 className="text-lg font-black text-gray-900 uppercase tracking-tight">Log de Acciones</h1>
            <p className="text-xs text-gray-500">Registros reais de `security_logs` e `audit_logs` (AUD-01)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as LogSource)}
            className="border border-[#6A008A] rounded-lg text-xs font-bold px-2 py-2 bg-white cursor-pointer"
          >
            <option value="all">Todos</option>
            <option value="security_logs">Security</option>
            <option value="audit_logs">Audit</option>
          </select>
          <button
            type="button"
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
            title="Atualização via listener em tempo real"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className={`w-4 h-4 text-[#6A008A] ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg px-3 py-2 flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#6A008A] text-white">
              <tr>
                <th className="px-3 py-2.5 font-bold">Data</th>
                <th className="px-3 py-2.5 font-bold">Fonte</th>
                <th className="px-3 py-2.5 font-bold">Usuário</th>
                <th className="px-3 py-2.5 font-bold">Ação</th>
                <th className="px-3 py-2.5 font-bold">Resultado</th>
                <th className="px-3 py-2.5 font-bold">Entidade</th>
                <th className="px-3 py-2.5 font-bold">ID</th>
                <th className="px-3 py-2.5 font-bold">Motivo / detalhe</th>
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                    Carregando logs…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                    Nenhum log encontrado para este tenant. Confirme um caixa ou faça um ajuste para gerar registros.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={`${row.source}-${row.id}`} className="border-t border-gray-100 hover:bg-purple-50/40">
                    <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-700">{formatTs(row.at)}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
                          row.source === 'security_logs' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {row.source === 'security_logs' ? 'SEC' : 'AUD'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-semibold text-gray-800">{row.userEmail || row.userName || '—'}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{row.userId || '—'}</div>
                    </td>
                    <td className="px-3 py-2 font-bold text-[#6A008A]">{row.action}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`font-bold ${
                          row.status === 'DENIED' || row.status === 'FAIL'
                            ? 'text-red-600'
                            : row.status === 'SUCCESS' || row.status === 'RECORDED'
                              ? 'text-emerald-600'
                              : 'text-gray-600'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-semibold text-gray-700">{row.entity}</td>
                    <td className="px-3 py-2 font-mono text-[11px] text-gray-500 max-w-[8rem] truncate" title={row.entityId}>
                      {row.entityId}
                      {row.changesCount > 0 ? (
                        <span className="block text-[10px] text-purple-600 font-bold">{row.changesCount} campo(s)</span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-gray-600 max-w-[14rem] truncate" title={row.detail}>
                      {row.detail || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
