import { motion, AnimatePresence } from 'motion/react';
import { X, Layers, Users, Play } from 'lucide-react';
import type { TenantMetrics, UserDoc } from '../../../types/superAdmin';
import { fmt } from './superAdminFormat';

export interface SuperAdminTenantDrawerProps {
  selectedTenantDetail: TenantMetrics | null;
  setSelectedTenantDetail: (tenant: TenantMetrics | null) => void;
  users: UserDoc[];
  handleImpersonate: (tenantId: string, tenantName: string) => void;
  handleToggleTenantActive: (tenantId: string, active: boolean) => void;
}

export function SuperAdminTenantDrawer({
  selectedTenantDetail,
  setSelectedTenantDetail,
  users,
  handleImpersonate,
  handleToggleTenantActive,
}: SuperAdminTenantDrawerProps) {
  const tenantUsers = selectedTenantDetail
    ? users.filter(u => u.tenantId === selectedTenantDetail.tenantId)
    : [];

  return (
    <AnimatePresence>
      {selectedTenantDetail && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedTenantDetail(null)}
            className="absolute inset-0 bg-[#060913]/90 cursor-pointer"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="relative w-full max-w-xl bg-[#0C1224] h-full shadow-2xl border-l border-slate-800/80 flex flex-col z-10"
          >
            <div className="p-6 bg-[#0E162C] border-b border-slate-800 text-white flex justify-between items-center shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base tracking-tight text-white">{selectedTenantDetail.tenantName}</h3>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${
                    selectedTenantDetail.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {selectedTenantDetail.active ? 'Ativo' : 'Suspenso'}
                  </span>
                </div>
                <p className="text-slate-400 text-[10px] mt-1 font-mono">Tenant ID: {selectedTenantDetail.tenantId}</p>
              </div>
              <button
                onClick={() => setSelectedTenantDetail(null)}
                className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#060913] border border-slate-800 p-4 rounded-xl">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Recaudo Unificado (30d)</span>
                  <p className="text-lg font-black text-emerald-400 mt-1.5 font-mono">$ {fmt(selectedTenantDetail.totalRecaudo)}</p>
                </div>

                <div className="bg-[#060913] border border-slate-800 p-4 rounded-xl">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Status Operacional</span>
                  <p className="text-base font-black text-white mt-1.5">{selectedTenantDetail.totalBoxes} Caixas Totais</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 font-bold">
                    <span className="text-emerald-400">{selectedTenantDetail.openBoxes} caixas abertas</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#060913] border border-slate-800 p-5 rounded-xl space-y-3.5">
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-400" /> Detalhes da Licença SaaS
                </h4>

                <div className="divide-y divide-slate-850 text-xs">
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400">Plano Escolhido:</span>
                    <span className="font-extrabold text-white">{selectedTenantDetail.plan}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400">Preço Mensal Acordado:</span>
                    <span className="font-extrabold text-indigo-400">$ {selectedTenantDetail.monthlyPrice.toFixed(2)}/mês</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400">Dia de Cadastro:</span>
                    <span className="font-extrabold text-white">{selectedTenantDetail.createdAt ? selectedTenantDetail.createdAt.toDate().toLocaleDateString('pt-BR') : 'Demo'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-400" /> Colaboradores Vinculados ({selectedTenantDetail.totalUsers})
                </h4>

                <div className="border border-slate-800 rounded-xl divide-y divide-slate-850 overflow-hidden bg-[#060913] max-h-52 overflow-y-auto">
                  {tenantUsers.map(colab => (
                    <div key={colab.id} className="p-3 flex items-center justify-between hover:bg-slate-800/10 transition-colors">
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="font-extrabold text-white text-xs truncate">{colab.name || colab.userName || 'Sem Nome'}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{colab.email}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider shrink-0 ${
                        colab.role === 'admin' ? 'bg-purple-950 text-purple-300' : 'bg-slate-900 text-slate-400'
                      }`}>
                        {colab.role}
                      </span>
                    </div>
                  ))}
                  {tenantUsers.length === 0 && (
                    <p className="p-4 text-center text-xs text-slate-500 italic">Nenhum colaborador registrado para esta empresa.</p>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-800 pt-5 space-y-3 shrink-0">
                <button
                  onClick={() => handleImpersonate(selectedTenantDetail.tenantId, selectedTenantDetail.tenantName)}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider py-3 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/10"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Entrar como Empresa (Impersonar)
                </button>
                <button
                  onClick={() => handleToggleTenantActive(selectedTenantDetail.tenantId, selectedTenantDetail.active)}
                  className={`w-full py-3 rounded-xl cursor-pointer text-xs font-extrabold transition-all border ${
                    selectedTenantDetail.active
                      ? 'bg-rose-950/20 text-rose-400 border-rose-900/30 hover:bg-rose-900 hover:text-white'
                      : 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30 hover:bg-emerald-900 hover:text-white'
                  }`}
                >
                  {selectedTenantDetail.active ? 'Bloquear Licença / Suspender' : 'Desbloquear Licença / Ativar'}
                </button>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
