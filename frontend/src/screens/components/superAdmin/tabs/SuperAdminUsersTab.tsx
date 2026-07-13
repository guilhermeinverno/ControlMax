import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { superAdminRoleBadgeClasses } from '../../../../utils/statusLabels';
import type { TenantDoc, UserDoc } from '../../../../types/superAdmin';
import type { HtmlFormSubmitEvent } from '../../../../types/reactEvents';

export interface SuperAdminUsersTabProps {
  tenants: TenantDoc[];
  users: UserDoc[];
  newUserName: string;
  setNewUserName: (name: string) => void;
  newUserEmail: string;
  setNewUserEmail: (email: string) => void;
  newUserRole: string;
  setNewUserRole: (role: string) => void;
  newUserTenant: string;
  setNewUserTenant: (tenantId: string) => void;
  submittingUser: boolean;
  handleAddUser: (e: HtmlFormSubmitEvent) => void;
  handleToggleUserActive: (userId: string, active: boolean) => void;
}

export function SuperAdminUsersTab({
  tenants,
  users,
  newUserName,
  setNewUserName,
  newUserEmail,
  setNewUserEmail,
  newUserRole,
  setNewUserRole,
  newUserTenant,
  setNewUserTenant,
  submittingUser,
  handleAddUser,
  handleToggleUserActive,
}: SuperAdminUsersTabProps) {
  return (
    <motion.div
      key="users"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-8"
    >

      <div className="bg-[#0C1224] border border-slate-800/80 rounded-2xl p-6 self-start shadow-sm">
        <h3 className="font-extrabold text-white text-sm mb-4 uppercase tracking-wide flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <Plus className="w-4 h-4 text-indigo-500" />
          Novo Colaborador Comercial
        </h3>
        <form onSubmit={handleAddUser} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Nome Completo
            </label>
            <input
              type="text"
              placeholder="Ex: João da Silva"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              className="w-full bg-[#060913] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-indigo-500 transition-all font-bold placeholder-slate-600"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Email de Acesso
            </label>
            <input
              type="email"
              placeholder="joao@empresa.com"
              required
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              className="w-full bg-[#060913] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-indigo-500 transition-all font-bold placeholder-slate-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Empresa Associada
              </label>
              <select
                required
                value={newUserTenant}
                onChange={(e) => setNewUserTenant(e.target.value)}
                className="w-full bg-[#060913] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none font-bold cursor-pointer"
              >
                <option value="">Selecione...</option>
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Função (Role)
              </label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value)}
                className="w-full bg-[#060913] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none font-bold cursor-pointer"
              >
                <option value="admin">Administrador</option>
                <option value="supervisor">Supervisor</option>
                <option value="vendedor">Vendedor</option>
                <option value="cobrador">Cobrador</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={submittingUser}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-4 py-3 rounded-xl text-xs transition-colors shadow-lg shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
          >
            {submittingUser ? 'Sincronizando...' : 'Gravar no Firestore'}
          </button>
        </form>
      </div>

      <div className="lg:col-span-2 bg-[#0C1224] border border-slate-800/80 rounded-2xl overflow-hidden flex flex-col shadow-sm">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/30">
          <h3 className="font-extrabold text-white text-sm">Colaboradores de Clientes</h3>
          <span className="bg-slate-800 text-slate-400 text-xs px-3 py-1 rounded-full font-bold">Total: {users.length}</span>
        </div>

        <div className="overflow-y-auto max-h-[500px]">
          <ul className="divide-y divide-slate-850">
            {users.map(u => {
              const associatedCompany = tenants.find(t => t.id === u.tenantId)?.name || 'Empresa Desconhecida';
              return (
                <li key={u.id} className="p-4 hover:bg-slate-800/10 flex items-center justify-between transition-colors">
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="flex items-center gap-2.5">
                      <span className="font-extrabold text-white text-xs truncate">{u.name || u.userName || 'Sem Nome'}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider ${superAdminRoleBadgeClasses(u.role)}`}>
                        {u.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-bold">
                      <span className="font-mono">{u.email}</span>
                      <span>·</span>
                      <span className="text-indigo-400">Tenant: {associatedCompany}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      onClick={() => handleToggleUserActive(u.id, u.active)}
                      className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wide cursor-pointer transition-all ${
                        u.active
                          ? 'bg-rose-950/20 text-rose-400 border-rose-900/20 hover:bg-rose-900 hover:text-white'
                          : 'bg-emerald-950/20 text-emerald-400 border-emerald-900/20 hover:bg-emerald-900 hover:text-white'
                      }`}
                    >
                      {u.active ? 'Bloquear' : 'Desbloquear'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

    </motion.div>
  );
}
