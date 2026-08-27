import { useEffect, useMemo, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { AlertCircle, BarChart3, Download, List, Loader2, RefreshCw, Shield } from 'lucide-react';
import { db } from '../lib/firebase';
import { useTenant } from '../hooks/useTenant';
import { Screen } from '../types';
import { parseUnknownTimestamp } from '../utils/timestampParsing';
import {
  aggregateAuditLogs,
  exportAuditAnalyticsXlsx,
  type AuditAnalyticsRow,
  type AuditAnalyticsWindow,
} from '../utils/auditAnalytics';
import { ListEmptyState, ListErrorBanner } from '../components/ListFeedback';

interface AuditLogsProps {
  onNavigate?: (screen: Screen) => void;
}

type LogSource = 'security_logs' | 'audit_logs' | 'all';
type ViewMode = 'list' | 'analytics';

const QUERY_LIMIT = 300;

function formatTs(d: Date | null): string {
  if (!d) return '—';
  return d.toLocaleString('pt-BR');
}

/**
 * AUD-01 — Log de ações reais (security_logs + audit_logs).
 * ENT-08 — aba Analytics (agregações + export XLSX).
 */
export function AuditLogs({ onNavigate }: AuditLogsProps) {
  const { tenantId, role, isSuperAdmin, loading: tenantLoading } = useTenant();
  const [source, setSource] = useState<LogSource>('all');
  const [view, setView] = useState<ViewMode>('list');
  const [period, setPeriod] = useState<AuditAnalyticsWindow>('30d');
  const [securityRows, setSecurityRows] = useState<AuditAnalyticsRow[]>([]);
  const [auditRows, setAuditRows] = useState<AuditAnalyticsRow[]>([]);
  const [loadingSec, setLoadingSec] = useState(true);
  const [loadingAud, setLoadingAud] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const canView =
    isSuperAdmin ||
    ['admin', 'supervisor', 'gerente', 'director', 'coordinador'].includes(String(role || '').toLowerCase());

  useEffect(() => {
    if (!tenantId || !canView) return;

    setLoadingSec(true);
    setError(null);
    const q = query(
      collection(db, 'security_logs'),
      where('tenantId', '==', tenantId),
      orderBy('timestamp', 'desc'),
      limit(QUERY_LIMIT)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: AuditAnalyticsRow[] = snap.docs.map((docSnap) => {
          const d = docSnap.data();
          const at =
            parseUnknownTimestamp(d.timestamp) || parseUnknownTimestamp(d.createdAt) || null;
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
  }, [tenantId, canView, reloadToken]);

  useEffect(() => {
    if (!tenantId || !canView) return;

    setLoadingAud(true);
    const q = query(
      collection(db, 'audit_logs'),
      where('tenantId', '==', tenantId),
      orderBy('timestamp', 'desc'),
      limit(QUERY_LIMIT)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: AuditAnalyticsRow[] = snap.docs.map((docSnap) => {
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
  }, [tenantId, canView, reloadToken]);

  const mergedSourceRows = useMemo(() => {
    if (source === 'security_logs') return securityRows;
    if (source === 'audit_logs') return auditRows;
    return [...securityRows, ...auditRows];
  }, [source, securityRows, auditRows]);

  const rows = useMemo(
    () => [...mergedSourceRows].sort((a, b) => (b.at?.getTime() || 0) - (a.at?.getTime() || 0)),
    [mergedSourceRows]
  );

  const analytics = useMemo(
    () => aggregateAuditLogs(mergedSourceRows, period, { topN: 15 }),
    [mergedSourceRows, period]
  );

  const handleExport = () => {
    try {
      exportAuditAnalyticsXlsx(analytics);
    } catch (err) {
      console.error('Failed to export audit analytics:', err);
      alert('Erro ao exportar planilha Excel.');
    }
  };

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
            <p className="text-xs text-gray-500">
              `security_logs` + `audit_logs` (AUD-01) · analytics (ENT-08)
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setView('list')}
              className={`px-3 py-2 text-xs font-bold flex items-center gap-1 cursor-pointer ${
                view === 'list' ? 'bg-[#6A008A] text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Lista
            </button>
            <button
              type="button"
              onClick={() => setView('analytics')}
              className={`px-3 py-2 text-xs font-bold flex items-center gap-1 cursor-pointer border-l border-gray-200 ${
                view === 'analytics' ? 'bg-[#6A008A] text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Analytics
            </button>
          </div>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as LogSource)}
            className="border border-[#6A008A] rounded-lg text-xs font-bold px-2 py-2 bg-white cursor-pointer"
          >
            <option value="all">Todos</option>
            <option value="security_logs">Security</option>
            <option value="audit_logs">Audit</option>
          </select>
          {view === 'analytics' && (
            <>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as AuditAnalyticsWindow)}
                className="border border-gray-300 rounded-lg text-xs font-bold px-2 py-2 bg-white cursor-pointer"
              >
                <option value="7d">7 dias</option>
                <option value="30d">30 dias</option>
                <option value="90d">90 dias</option>
              </select>
              <button
                type="button"
                onClick={handleExport}
                disabled={loading || analytics.total === 0}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#6A008A] text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Exportar XLSX
              </button>
            </>
          )}
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
        <ListErrorBanner
          message={error}
          onRetry={() => {
            setError(null);
            setReloadToken((n) => n + 1);
          }}
        />
      )}

      {view === 'analytics' ? (
        <div className="space-y-4">
          <p className="text-[11px] text-gray-500">
            Amostra dos {analytics.sampleSize} eventos mais recentes (teto {QUERY_LIMIT}/coleção); filtro de
            período aplicado no cliente ({period}).
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { label: 'No período', value: analytics.total },
              { label: 'Security', value: analytics.securityCount },
              { label: 'Audit', value: analytics.auditCount },
              { label: 'DENIED/FAIL', value: analytics.deniedCount },
              { label: 'REVERSAL/OVERRIDE', value: analytics.reversalOverrideCount },
              { label: 'Amostra bruta', value: analytics.sampleSize },
            ].map((card) => (
              <div key={card.label} className="bg-white border border-gray-200 rounded-xl px-3 py-3 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{card.label}</p>
                <p className="text-xl font-black text-[#6A008A] mt-1">{card.value}</p>
              </div>
            ))}
          </div>

          {loading && analytics.total === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500 text-xs">
              <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
              Carregando analytics…
            </div>
          ) : analytics.total === 0 ? (
            <ListEmptyState
              title="Nenhum evento no período"
              description="Amplie a janela ou gere ações auditáveis."
              icon={<Shield className="w-10 h-10" />}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <AnalyticsTable title="Por ação" rows={analytics.byAction} />
              <AnalyticsTable title="Por usuário" rows={analytics.byUser} />
              <AnalyticsTable title="Por dia (UTC)" rows={[...analytics.byDay].reverse().slice(0, 15)} />
            </div>
          )}
        </div>
      ) : (
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
                    <td colSpan={8} className="px-3 py-4">
                      <ListEmptyState
                        title="Nenhum log encontrado"
                        description="Confirme um caixa ou faça um ajuste para gerar registros."
                        icon={<Shield className="w-10 h-10" />}
                      />
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={`${row.source}-${row.id}`} className="border-t border-gray-100 hover:bg-purple-50/40">
                      <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-700">{formatTs(row.at)}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
                            row.source === 'security_logs'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
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
                      <td
                        className="px-3 py-2 font-mono text-[11px] text-gray-500 max-w-[8rem] truncate"
                        title={row.entityId}
                      >
                        {row.entityId}
                        {row.changesCount > 0 ? (
                          <span className="block text-[10px] text-purple-600 font-bold">
                            {row.changesCount} campo(s)
                          </span>
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
      )}
    </div>
  );
}

function AnalyticsTable({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ key: string; label: string; count: number }>;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-3 py-2 bg-[#6A008A] text-white text-xs font-black uppercase tracking-wide">{title}</div>
      <div className="overflow-x-auto max-h-72">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-600 sticky top-0">
            <tr>
              <th className="px-3 py-2 font-bold">Item</th>
              <th className="px-3 py-2 font-bold text-right">Qtd</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-3 py-4 text-center text-gray-400">
                  —
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.key} className="border-t border-gray-100">
                  <td className="px-3 py-1.5 font-medium text-gray-800 truncate max-w-[12rem]" title={r.label}>
                    {r.label}
                  </td>
                  <td className="px-3 py-1.5 text-right font-black text-[#6A008A]">{r.count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
