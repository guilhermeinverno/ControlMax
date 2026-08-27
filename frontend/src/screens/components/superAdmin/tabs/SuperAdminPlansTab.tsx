import { motion } from 'motion/react';
import { TrendingUp, Layers, Wallet } from 'lucide-react';
import type { SaasBillingSummary } from '../../../../types/superAdmin';

export interface SuperAdminPlansTabProps {
  clientCountSim: number;
  setClientCountSim: (count: number) => void;
  avgTicketSim: number;
  setAvgTicketSim: (ticket: number) => void;
  billingSummary: SaasBillingSummary | null;
  mrrEstimated: number;
  activeTenantsCount: number;
  pastDueCount: number;
}

function fmtMoney(units: number): string {
  return units.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function SuperAdminPlansTab({
  clientCountSim,
  setClientCountSim,
  avgTicketSim,
  setAvgTicketSim,
  billingSummary,
  mrrEstimated,
  activeTenantsCount,
  pastDueCount,
}: SuperAdminPlansTabProps) {
  const mrrUnits = billingSummary ? billingSummary.mrrCents / 100 : mrrEstimated;
  const openUnits = billingSummary ? billingSummary.invoices.openCents / 100 : 0;
  const paidUnits = billingSummary ? billingSummary.invoices.paidCents / 100 : 0;
  const period = billingSummary?.period || '—';

  return (
    <motion.div
      key="plans"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0C1224] border border-emerald-900/40 rounded-2xl p-5">
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5" /> MRR contratado
          </span>
          <p className="text-2xl font-black text-white mt-2 font-mono">$ {fmtMoney(mrrUnits)}</p>
          <p className="text-[10px] text-slate-400 font-bold mt-1">
            {billingSummary?.activeLicenses ?? activeTenantsCount} licenças adimplentes
          </p>
        </div>
        <div className="bg-[#0C1224] border border-amber-900/40 rounded-2xl p-5">
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Em aberto ({period})</span>
          <p className="text-2xl font-black text-white mt-2 font-mono">$ {fmtMoney(openUnits)}</p>
          <p className="text-[10px] text-slate-400 font-bold mt-1">
            {billingSummary?.invoices.openCount ?? 0} fatura(s) · {pastDueCount} past_due
          </p>
        </div>
        <div className="bg-[#0C1224] border border-indigo-900/40 rounded-2xl p-5">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Pago no mês ({period})</span>
          <p className="text-2xl font-black text-white mt-2 font-mono">$ {fmtMoney(paidUnits)}</p>
          <p className="text-[10px] text-slate-400 font-bold mt-1">
            {billingSummary?.invoices.paidCount ?? 0} fatura(s) liquidadas
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[#0C1224] border border-slate-800/80 rounded-2xl p-6 shadow-sm">
          <h3 className="font-extrabold text-white text-sm mb-4 uppercase tracking-wide flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Simulador de projeção (opcional)
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
                <span className="text-xs text-slate-400 font-bold">Projeção mensal:</span>
                <span className="text-xl font-black text-emerald-400 font-mono">
                  $ {fmtMoney(clientCountSim * avgTicketSim)}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-850 pt-3">
                <span className="text-xs text-slate-400 font-bold">Projeção anual:</span>
                <span className="text-2xl font-black text-white font-mono">
                  $ {fmtMoney(clientCountSim * avgTicketSim * 12)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#0C1224] border border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-white text-sm mb-4 uppercase tracking-wide flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <Layers className="w-4 h-4 text-indigo-500" />
              Cobrança direta (sem gateway)
            </h3>

            <div className="space-y-4 mt-6 text-xs text-slate-300">
              <p className="leading-relaxed">
                O ControlMax registra <strong>mensalidade negociada</strong> e <strong>faturas manuais</strong>
                (PIX, boleto ou contrato). Não há captura automática de cartão.
              </p>

              <div className="bg-indigo-950/20 border border-indigo-900/35 p-4 rounded-xl space-y-2">
                <span className="font-black text-indigo-300 text-xs block uppercase tracking-wide">Fluxo operacional</span>
                <ul className="list-disc pl-4 space-y-1.5 text-[11px] text-slate-400 font-bold">
                  <li>Defina o preço no cadastro / edição do tenant</li>
                  <li>Gere fatura do mês no drawer da empresa</li>
                  <li>Marque como paga quando o PIX/boleto liquidar</li>
                </ul>
              </div>

              <div className="bg-emerald-950/10 border border-emerald-900/20 p-4 rounded-xl space-y-2">
                <span className="font-black text-emerald-400 text-xs block uppercase tracking-wide">MRR</span>
                <span className="text-slate-400 text-[11px] font-bold block leading-relaxed">
                  Soma das mensalidades dos tenants com licença ativa e billingStatus = active.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
