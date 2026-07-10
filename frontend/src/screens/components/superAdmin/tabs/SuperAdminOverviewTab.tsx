import { motion } from 'motion/react';
import {
  Building2, Check, ChevronRight, Search, Terminal
} from 'lucide-react';
import { terminalLogTextClass } from '../../../../utils/statusLabels';
import type { TenantMetrics, TerminalLog, TenantStatusFilter, TenantSortBy } from '../../../../types/superAdmin';
import { fmt } from '../superAdminFormat';

export interface SuperAdminOverviewTabProps {
  mrrEstimated: number;
  activeTenantsCount: number;
  tenantsCount: number;
  totalGlobalUsers: number;
  totalGlobalRecaudoVolume: number;
  statusFilter: TenantStatusFilter;
  setStatusFilter: (filter: TenantStatusFilter) => void;
  sortBy: TenantSortBy;
  setSortBy: (sort: TenantSortBy) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredTenants: TenantMetrics[];
  selectedTenantDetail: TenantMetrics | null;
  setSelectedTenantDetail: (tenant: TenantMetrics | null) => void;
  terminalLogs: TerminalLog[];
}

export function SuperAdminOverviewTab({
  mrrEstimated,
  activeTenantsCount,
  tenantsCount,
  totalGlobalUsers,
  totalGlobalRecaudoVolume,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  searchQuery,
  setSearchQuery,
  filteredTenants,
  selectedTenantDetail,
  setSelectedTenantDetail,
  terminalLogs,
}: SuperAdminOverviewTabProps) {
  return (
    <motion.div
      key="overview"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#0C1224] border border-slate-800/80 rounded-2xl p-6 relative group hover:border-indigo-500/40 transition-all shadow-sm">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">SaaS MRR Estimado</span>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl lg:text-3xl font-black text-white tracking-tight">$ {mrrEstimated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            <span className="text-xs text-slate-400 font-bold">/mês</span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold mt-1.5 flex items-center gap-1">
            <Check className="w-3 h-3 text-emerald-400" /> Licenças comerciais pagas
          </p>
        </div>

        <div className="bg-[#0C1224] border border-slate-800/80 rounded-2xl p-6 relative group hover:border-indigo-500/40 transition-all shadow-sm">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Empresas (Tenants)</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white tracking-tight">{activeTenantsCount}</span>
            <span className="text-sm text-slate-400 font-bold">ativas de {tenantsCount}</span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold mt-1.5 flex items-center gap-1">
            <Check className="w-3 h-3 text-emerald-400" /> {(activeTenantsCount / (tenantsCount || 1) * 100).toFixed(0)}% Taxa de Adimplência
          </p>
        </div>

        <div className="bg-[#0C1224] border border-slate-800/80 rounded-2xl p-6 relative group hover:border-indigo-500/40 transition-all shadow-sm">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Colaboradores Totais</span>
          <div className="mt-3">
            <span className="text-3xl font-black text-white tracking-tight">{totalGlobalUsers}</span>
          </div>
          <p className="text-[10px] text-indigo-400 font-bold mt-1.5">
            Cadastrados em toda a base SaaS
          </p>
        </div>

        <div className="bg-[#0C1224] border border-slate-800/80 rounded-2xl p-6 relative group hover:border-indigo-500/40 transition-all shadow-sm">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Movimentação Global (30d)</span>
          <div className="mt-3">
            <span className="text-2xl font-black text-emerald-400 tracking-tight">$ {fmt(totalGlobalRecaudoVolume)}</span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold mt-1.5">
            Fluxo operacional de caixas transacionado
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="lg:col-span-2 bg-[#0C1224] border border-slate-800/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-800/80 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-900/30">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-500" />
              <div>
                <h2 className="font-extrabold text-white text-sm">Controle Consolidado de Empresas</h2>
                <p className="text-slate-400 text-[9px] uppercase font-bold tracking-widest mt-0.5">Operações comerciais SaaS reais</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TenantStatusFilter)}
                className="bg-[#060913] border border-slate-800 text-slate-300 text-[11px] font-extrabold py-1.5 px-2.5 rounded-lg outline-none cursor-pointer hover:border-slate-700"
              >
                <option value="all">Status: Todos</option>
                <option value="active">Saudáveis</option>
                <option value="inactive">Suspensas</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as TenantSortBy)}
                className="bg-[#060913] border border-slate-800 text-slate-300 text-[11px] font-extrabold py-1.5 px-2.5 rounded-lg outline-none cursor-pointer hover:border-slate-700"
              >
                <option value="recaudo">Ordenar: Recaudo</option>
                <option value="users">Ordenar: Usuários</option>
                <option value="name">Ordenar: Nome</option>
              </select>
            </div>
          </div>

          <div className="p-4 border-b border-slate-800/80 bg-slate-900/10 flex items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Pesquisar por nome de empresa ou Tenant ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#060913] border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-indigo-500 transition-all placeholder-slate-500 font-bold"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[550px]">
              <thead>
                <tr className="bg-slate-900/40 border-b border-slate-800/80 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                  <th className="py-3.5 px-5">Empresa</th>
                  <th className="py-3.5 px-4 text-center">Sistema</th>
                  <th className="py-3.5 px-4 text-center">Colabs</th>
                  <th className="py-3.5 px-4 text-right">Recaudo (30d)</th>
                  <th className="py-3.5 px-5 text-right">Licença</th>
                  <th className="py-3.5 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 font-bold text-xs">
                      Nenhuma empresa corresponde aos filtros ativos.
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map(tenant => {
                    const isSelected = selectedTenantDetail?.tenantId === tenant.tenantId;
                    return (
                      <tr
                        key={tenant.tenantId}
                        onClick={() => setSelectedTenantDetail(tenant)}
                        className={`hover:bg-slate-800/20 cursor-pointer transition-all ${
                          isSelected ? 'bg-indigo-900/15 border-l-4 border-indigo-600' : ''
                        }`}
                      >
                        <td className="py-4 px-5">
                          <div className="flex flex-col">
                            <span className="font-extrabold text-white text-xs">{tenant.tenantName}</span>
                            <span className="text-[9px] text-slate-500 font-mono mt-0.5">ID: {tenant.tenantId}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                            Completo
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center text-xs font-bold text-slate-200">
                          {tenant.totalUsers}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="font-black text-xs text-white font-mono">
                            $ {fmt(tenant.totalRecaudo)}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            tenant.active
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${tenant.active ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                            {tenant.active ? 'Ativo' : 'Suspenso'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center text-slate-500">
                          <ChevronRight className="w-4 h-4" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-[#0C1224] border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5 mb-4">
              <h3 className="font-extrabold text-white text-xs flex items-center gap-2 uppercase tracking-wide">
                <Terminal className="w-4 h-4 text-[#8CC63F]" />
                Monitor de Atividades Core
              </h3>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            </div>

            <div className="bg-[#060913] p-4 rounded-xl border border-slate-850 h-72 font-mono text-[10px] space-y-3 overflow-y-auto scrollbar-thin text-slate-300">
              {terminalLogs.map(log => (
                <div key={log.id} className="flex gap-2">
                  <span className="text-slate-500">[{log.time}]</span>
                  <span className={`font-bold shrink-0 ${terminalLogTextClass(log.type)}`}>
                    [{log.type}]
                  </span>
                  <span className="break-all">{log.message}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-800/60 pt-4 mt-6 flex justify-between items-center text-[10px] text-slate-500 font-bold">
            <span>ESTADOS REAL-TIME FIRESTORE</span>
            <span>V1.4.2</span>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
