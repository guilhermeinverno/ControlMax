import { useCallback, useEffect, useState } from 'react';
import { Screen } from '../types';
import { useNavigation } from '../context/NavigationContext';
import { auth } from '../lib/firebase';
import {
  Calculator,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Loader2,
  MapPin,
  RefreshCw,
  Shield,
} from 'lucide-react';

interface ReportsHubProps {
  onNavigate?: (screen: Screen) => void;
}

type AsyncReportType = 'period_summary' | 'finance_snapshot' | 'box_day';

interface ReportJobListItem {
  id: string;
  type: string;
  status: string;
  error?: string;
  result?: {
    format?: string;
    fileName?: string;
    rowCount?: number;
    summary?: Record<string, unknown>;
  };
  createdAt?: { _seconds?: number } | string;
}

const REPORTS: Array<{
  screen: Screen;
  title: string;
  description: string;
  icon: typeof FileSpreadsheet;
}> = [
  {
    screen: 'period-summary',
    title: 'Resumen por periodo',
    description: 'Exportación XLSX de período operacional.',
    icon: FileSpreadsheet,
  },
  {
    screen: 'finance',
    title: 'Relatório financeiro',
    description: 'Métricas e exportação financeira.',
    icon: Calculator,
  },
  {
    screen: 'box-summary',
    title: 'Extracto de caja',
    description: 'Resumen / export de caja.',
    icon: FileSpreadsheet,
  },
  {
    screen: 'dashboard',
    title: 'Dashboard',
    description: 'Indicadores del día y export de caja.',
    icon: FileSpreadsheet,
  },
  {
    screen: 'audit-logs',
    title: 'Log de acciones',
    description: 'Auditoría real (security_logs / audit_logs).',
    icon: Shield,
  },
  {
    screen: 'collector-map',
    title: 'Ubicar trabajadores',
    description: 'Mapa operativo de cobradores.',
    icon: MapPin,
  },
  {
    screen: 'performance',
    title: 'Performance',
    description: 'Desempeño de equipos.',
    icon: Calculator,
  },
  {
    screen: 'statistics',
    title: 'Estadísticas',
    description: 'Indicadores consolidados.',
    icon: Calculator,
  },
];

const ASYNC_TYPES: Array<{ type: AsyncReportType; label: string }> = [
  { type: 'period_summary', label: 'Resumo do período (7 dias)' },
  { type: 'finance_snapshot', label: 'Snapshot financeiro' },
  { type: 'box_day', label: 'Caixas do dia' },
];

async function authHeaders(): Promise<HeadersInit> {
  const token = auth?.currentUser ? await auth.currentUser.getIdToken() : '';
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

/** P1-05 catálogo + P2 fila assíncrona via BFF `/api/reports/jobs`. */
export function ReportsHub({ onNavigate }: ReportsHubProps) {
  const nav = useNavigation();
  const go = (screen: Screen) => {
    if (onNavigate) onNavigate(screen);
    else nav.navigate(screen);
  };

  const [jobs, setJobs] = useState<ReportJobListItem[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [enqueueing, setEnqueueing] = useState<AsyncReportType | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    setJobsLoading(true);
    setJobsError(null);
    try {
      const res = await fetch('/api/reports/jobs?limit=15', { headers: await authHeaders() });
      const data = await res.json().catch(() => ({} as { error?: string; jobs?: ReportJobListItem[] }));
      if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
      setJobs(Array.isArray(data.jobs) ? data.jobs : []);
    } catch (err) {
      setJobsError(err instanceof Error ? err.message : 'Falha ao listar jobs.');
    } finally {
      setJobsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  const enqueue = async (type: AsyncReportType) => {
    setEnqueueing(type);
    setJobsError(null);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      const params =
        type === 'box_day'
          ? { date: today }
          : { startDate: weekAgo, endDate: today };

      const res = await fetch('/api/reports/jobs', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ type, params }),
      });
      const data = await res.json().catch(() => ({} as { error?: string }));
      if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
      await loadJobs();
      // Poll leve enquanto processa
      setTimeout(() => void loadJobs(), 1500);
      setTimeout(() => void loadJobs(), 4000);
    } catch (err) {
      setJobsError(err instanceof Error ? err.message : 'Falha ao enfileirar.');
    } finally {
      setEnqueueing(null);
    }
  };

  const downloadJob = async (jobId: string) => {
    setDownloadingId(jobId);
    setJobsError(null);
    try {
      const res = await fetch(`/api/reports/jobs/${encodeURIComponent(jobId)}`, {
        headers: await authHeaders(),
      });
      const data = await res.json().catch(() => ({} as { error?: string; result?: { contentBase64?: string; fileName?: string } }));
      if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
      const b64 = data.result?.contentBase64;
      const fileName = data.result?.fileName || `report_${jobId}.csv`;
      if (!b64) throw new Error('Job ainda sem arquivo (aguarde completed).');
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setJobsError(err instanceof Error ? err.message : 'Falha no download.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-black text-[#6A008A]">Catálogo de Reportes</h1>
        <p className="text-sm text-gray-600">
          Exportações síncronas nas telas abaixo e fila assíncrona via BFF (`report_jobs`).
        </p>
      </header>

      <section className="border border-gray-200 rounded-lg bg-white p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-extrabold text-gray-800 uppercase tracking-wide">
            Fila assíncrona
          </h2>
          <button
            type="button"
            onClick={() => void loadJobs()}
            disabled={jobsLoading}
            className="text-xs font-bold text-[#6A008A] flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${jobsLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {ASYNC_TYPES.map((item) => (
            <button
              key={item.type}
              type="button"
              disabled={enqueueing !== null}
              onClick={() => void enqueue(item.type)}
              className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide rounded-lg bg-[#6A008A] text-white hover:bg-[#52006A] disabled:opacity-50 cursor-pointer"
            >
              {enqueueing === item.type ? 'Enfileirando…' : item.label}
            </button>
          ))}
        </div>

        {jobsError && (
          <p className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded p-2">
            {jobsError}
          </p>
        )}

        {jobsLoading && jobs.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando jobs…
          </div>
        ) : jobs.length === 0 ? (
          <p className="text-xs text-gray-500 py-1">Nenhum job ainda. Gere um relatório acima.</p>
        ) : (
          <ul className="divide-y divide-gray-100 border border-gray-100 rounded-md overflow-hidden">
            {jobs.map((job) => (
              <li key={job.id} className="flex items-center gap-3 px-3 py-2.5 text-xs bg-gray-50/50">
                <span className="font-mono text-[10px] text-gray-400 shrink-0 w-16 truncate" title={job.id}>
                  {job.id.slice(0, 8)}
                </span>
                <span className="font-bold text-gray-700 flex-1 min-w-0 truncate">{job.type}</span>
                <span
                  className={`uppercase font-black text-[9px] px-1.5 py-0.5 rounded ${
                    job.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : job.status === 'failed'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {job.status}
                </span>
                {job.status === 'completed' ? (
                  <button
                    type="button"
                    onClick={() => void downloadJob(job.id)}
                    disabled={downloadingId === job.id}
                    className="text-[#6A008A] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    title="Baixar CSV"
                  >
                    {downloadingId === job.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    CSV
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg bg-white overflow-hidden">
        {REPORTS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.screen}>
              <button
                type="button"
                onClick={() => go(item.screen)}
                className="w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-purple-50/60 transition-colors"
              >
                <span className="w-10 h-10 rounded-lg bg-[#6A008A]/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-[#6A008A]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-gray-800">{item.title}</span>
                  <span className="block text-xs text-gray-500 mt-0.5">{item.description}</span>
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
