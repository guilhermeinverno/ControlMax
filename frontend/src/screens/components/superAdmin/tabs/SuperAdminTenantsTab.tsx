import { motion } from 'motion/react';
import { Plus, Play, Lock, Unlock, Sliders } from 'lucide-react';
import type { TenantDoc, TenantMetrics } from '../../../../types/superAdmin';
import type { HtmlFormSubmitEvent } from '../../../../types/reactEvents';
import { fmt } from '../superAdminFormat';

export interface SuperAdminTenantsTabProps {
  tenants: TenantDoc[];
  processedTenants: TenantMetrics[];
  newTenantName: string;
  setNewTenantName: (name: string) => void;
  newTenantPrice: string;
  setNewTenantPrice: (price: string) => void;
  newTenantAdminName: string;
  setNewTenantAdminName: (name: string) => void;
  newTenantAdminEmail: string;
  setNewTenantAdminEmail: (email: string) => void;
  submittingTenant: boolean;
  handleAddTenant: (e: HtmlFormSubmitEvent) => void;
  editingTenantId: string | null;
  setEditingTenantId: (id: string | null) => void;
  editPrice: string;
  setEditPrice: (price: string) => void;
  handleSavePlanEdit: (tenantId: string) => void;
  handleImpersonate: (tenantId: string, tenantName: string) => void;
  handleToggleTenantActive: (tenantId: string, active: boolean) => void;
}

export function SuperAdminTenantsTab({
  tenants,
  processedTenants,
  newTenantName,
  setNewTenantName,
  newTenantPrice,
  setNewTenantPrice,
  newTenantAdminName,
  setNewTenantAdminName,
  newTenantAdminEmail,
  setNewTenantAdminEmail,
  submittingTenant,
  handleAddTenant,
  editingTenantId,
  setEditingTenantId,
  editPrice,
  setEditPrice,
  handleSavePlanEdit,
  handleImpersonate,
  handleToggleTenantActive,
}: SuperAdminTenantsTabProps) {
  return (
    <motion.div
      key="tenants"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="bg-[#0C1224] border border-slate-800/80 rounded-2xl p-6 self-start shadow-sm">
          <h3 className="font-extrabold text-white text-sm mb-4 uppercase tracking-wide flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <Plus className="w-4 h-4 text-indigo-500" />
            Cadastrar Nova Empresa (SaaS client)
          </h3>
          <form onSubmit={handleAddTenant} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Nome da Empresa
              </label>
              <input
                type="text"
                placeholder="Ex: Nordeste Cobreurs Ltda"
                required
                value={newTenantName}
                onChange={(e) => setNewTenantName(e.target.value)}
                className="w-full bg-[#060913] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-indigo-500 transition-all font-bold placeholder-slate-600"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Nome do Administrador (Cliente)
              </label>
              <input
                type="text"
                placeholder="Ex: Carlos Oliveira"
                required
                value={newTenantAdminName}
                onChange={(e) => setNewTenantAdminName(e.target.value)}
                className="w-full bg-[#060913] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-indigo-500 transition-all font-bold placeholder-slate-600"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                E-mail Google do Administrador
              </label>
              <input
                type="email"
                placeholder="Ex: carlos.oliveira@gmail.com"
                required
                value={newTenantAdminEmail}
                onChange={(e) => setNewTenantAdminEmail(e.target.value)}
                className="w-full bg-[#060913] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-indigo-500 transition-all font-bold placeholder-slate-600"
              />
              <span className="text-[9px] text-indigo-400 font-bold mt-1 block uppercase leading-tight">
                * Esta conta Google dará acesso imediato ao painel corporativo do cliente.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Plano Ativo
                </label>
                <div className="w-full bg-indigo-950/40 border border-indigo-900/35 text-indigo-300 rounded-xl px-3 py-2.5 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-inner">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                  Completo
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Mensalidade Acordada ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="199.00"
                  required
                  value={newTenantPrice}
                  onChange={(e) => setNewTenantPrice(e.target.value)}
                  className="w-full bg-[#060913] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-indigo-500 transition-all font-bold"
                />
              </div>
            </div>

            <p className="text-[9px] text-slate-500 font-bold leading-relaxed uppercase">
              * Toda empresa cadastrada possui acesso irrestrito ao sistema completo. O valor inserido é usado para controle de faturamento direto das mensalidades combinadas.
            </p>

            <button
              type="submit"
              disabled={submittingTenant}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-4 py-3 rounded-xl text-xs transition-colors shadow-lg shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
            >
              {submittingTenant ? 'Sincronizando com Firestore...' : 'Gravar Empresa no Firestore'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center bg-[#0C1224] p-4 border border-slate-800/80 rounded-2xl">
            <h3 className="font-extrabold text-white text-sm">Empresas Licenciadas ({tenants.length})</h3>
            <div className="text-[11px] font-bold text-slate-400">Clique para expandir estatísticas</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {processedTenants.map(tenant => {
              const isEditing = editingTenantId === tenant.tenantId;
              return (
                <div key={tenant.tenantId} className="bg-[#0C1224] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between group hover:border-slate-700 transition-all">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-extrabold text-white text-sm leading-tight">{tenant.tenantName}</h4>
                        <span className="text-[10px] text-slate-500 font-mono">ID: {tenant.tenantId}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                        Completo
                      </span>
                    </div>

                    <div className="border-t border-slate-850 py-3 my-3 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Mensalidade Combinada:</span>
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step="0.01"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="w-20 bg-[#060913] border border-slate-800 rounded px-2 py-1 text-xs text-white font-extrabold outline-none"
                            />
                          </div>
                        ) : (
                          <span className="font-extrabold text-indigo-400">$ {tenant.monthlyPrice.toFixed(2)}/mês</span>
                        )}
                      </div>

                      <div className="flex justify-between text-[11px] text-slate-400 font-bold">
                        <span>Colaboradores / Caixas:</span>
                        <span className="text-white">{tenant.totalUsers} Colabs · {tenant.totalBoxes} Caixas</span>
                      </div>

                      <div className="flex justify-between text-[11px] text-slate-400 font-bold">
                        <span>Volume Recaudado:</span>
                        <span className="text-emerald-400">$ {fmt(tenant.totalRecaudo)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t border-slate-850 pt-3 mt-3">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSavePlanEdit(tenant.tenantId)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] uppercase tracking-wide py-2 rounded-lg cursor-pointer transition-colors"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => setEditingTenantId(null)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-400 px-3 py-2 rounded-lg cursor-pointer text-[10px] font-bold"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleImpersonate(tenant.tenantId, tenant.tenantName)}
                          className="flex-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-600/30 font-extrabold text-[10px] uppercase tracking-wide py-2 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1"
                          title="Entrar como esta empresa para visualizar o app sob a ótica deles"
                        >
                          <Play className="w-3 h-3 fill-current" /> Acessar Sistema
                        </button>

                        <button
                          onClick={() => {
                            setEditingTenantId(tenant.tenantId);
                            setEditPrice(tenant.monthlyPrice.toString());
                          }}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-2 rounded-lg cursor-pointer text-[10px] font-bold border border-slate-700/50"
                          title="Editar Plano SaaS"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleToggleTenantActive(tenant.tenantId, tenant.active)}
                          className={`px-2.5 py-2 rounded-lg cursor-pointer border text-[10px] font-bold transition-all ${
                            tenant.active
                              ? 'bg-rose-950/20 text-rose-400 border-rose-900/30 hover:bg-rose-900 hover:text-white'
                              : 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30 hover:bg-emerald-900 hover:text-white'
                          }`}
                          title={tenant.active ? 'Suspender Licença' : 'Ativar Licença'}
                        >
                          {tenant.active ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
