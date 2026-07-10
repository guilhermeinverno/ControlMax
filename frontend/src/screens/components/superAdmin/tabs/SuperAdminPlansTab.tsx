import { motion } from 'motion/react';
import { TrendingUp, Layers } from 'lucide-react';

export interface SuperAdminPlansTabProps {
  clientCountSim: number;
  setClientCountSim: (count: number) => void;
  avgTicketSim: number;
  setAvgTicketSim: (ticket: number) => void;
}

export function SuperAdminPlansTab({
  clientCountSim,
  setClientCountSim,
  avgTicketSim,
  setAvgTicketSim,
}: SuperAdminPlansTabProps) {
  return (
    <motion.div
      key="plans"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[#0C1224] border border-slate-800/80 rounded-2xl p-6 shadow-sm">
          <h3 className="font-extrabold text-white text-sm mb-4 uppercase tracking-wide flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Simulador de Faturamento Direto (Projeção)
          </h3>

          <div className="space-y-6 mt-6">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                <span>Quantidade de Empresas Clientes:</span>
                <span className="text-white font-extrabold">{clientCountSim} empresas</span>
              </div>
              <input
                type="range"
                min="5"
                max="250"
                step="5"
                value={clientCountSim}
                onChange={(e) => setClientCountSim(parseInt(e.target.value))}
                className="w-full accent-indigo-600 h-1.5 bg-[#060913] rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                <span>Mensalidade Média por Empresa:</span>
                <span className="text-white font-extrabold">$ {avgTicketSim} / mês</span>
              </div>
              <input
                type="range"
                min="49"
                max="999"
                step="25"
                value={avgTicketSim}
                onChange={(e) => setAvgTicketSim(parseInt(e.target.value))}
                className="w-full accent-indigo-600 h-1.5 bg-[#060913] rounded-lg cursor-pointer"
              />
            </div>

            <div className="bg-[#060913] p-5 rounded-xl border border-slate-850 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-bold">Faturamento Mensal Estimado:</span>
                <span className="text-xl font-black text-emerald-400 font-mono">$ {(clientCountSim * avgTicketSim).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-850 pt-3">
                <span className="text-xs text-slate-400 font-bold">Faturamento Anual Estimado:</span>
                <span className="text-2xl font-black text-white font-mono">$ {(clientCountSim * avgTicketSim * 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#0C1224] border border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-white text-sm mb-4 uppercase tracking-wide flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <Layers className="w-4 h-4 text-indigo-500" />
              Modelo de Negócio Unificado
            </h3>

            <div className="space-y-4 mt-6 text-xs text-slate-300">
              <p className="leading-relaxed">
                O sistema não utiliza cobrança automática por planos ou mensalidades integradas.
                <strong> Toda empresa cadastrada tem acesso automático ao sistema em sua versão mais completa e robusta</strong>, sem restrições ou limitações artificiais de recursos.
              </p>

              <div className="bg-indigo-950/20 border border-indigo-900/35 p-4 rounded-xl space-y-2">
                <span className="font-black text-indigo-300 text-xs block uppercase tracking-wide">💼 Faturamento Direto</span>
                <span className="text-slate-400 text-[11px] font-bold block leading-relaxed">
                  O recebimento é feito de forma independente e direta (PIX, boleto ou contrato físico acordado diretamente com o cliente), permitindo flexibilidade total para negociar os valores individualmente para cada empresa.
                </span>
              </div>

              <div className="bg-emerald-950/10 border border-emerald-900/20 p-4 rounded-xl space-y-2">
                <span className="font-black text-emerald-400 text-xs block uppercase tracking-wide">🚀 Vantagens deste Modelo</span>
                <ul className="list-disc pl-4 space-y-1.5 text-[11px] text-slate-400 font-bold">
                  <li>Autonomia absoluta na precificação por cliente</li>
                  <li>Retenção de 100% dos lucros sem intermediários de pagamento</li>
                  <li>Acesso irrestrito a caixas, rotas e colaboradores</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 font-bold border-t border-slate-850 pt-4 mt-6 text-center uppercase tracking-wide">
            Insira os valores negociados no cadastro para acompanhar seu fluxo mensal consolidado
          </div>
        </div>
      </div>
    </motion.div>
  );
}
