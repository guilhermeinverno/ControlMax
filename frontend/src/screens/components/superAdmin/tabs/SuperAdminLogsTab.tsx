import { motion } from 'motion/react';
import { Terminal } from 'lucide-react';
import { terminalLogTextClass } from '../../../../utils/statusLabels';
import type { TerminalLog } from '../../../../types/superAdmin';

export interface SuperAdminLogsTabProps {
  terminalLogs: TerminalLog[];
}

export function SuperAdminLogsTab({ terminalLogs }: SuperAdminLogsTabProps) {
  return (
    <motion.div
      key="logs"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-8"
    >
      <div className="bg-[#0C1224] border border-slate-800/80 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5 text-indigo-500" />
            <div>
              <h3 className="font-extrabold text-white text-sm">Visualizador de Logs e Transações de Auditoria</h3>
              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-0.5">Simulação de telemetria operacional em tempo real</p>
            </div>
          </div>
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2.5 py-1 rounded-full font-black flex items-center gap-1.5 shadow-sm">
            STREAM OPERACIONAL ATIVO
          </span>
        </div>

        <div className="bg-[#060913] p-5 rounded-xl border border-slate-850 font-mono text-[11px] space-y-4 max-h-[500px] overflow-y-auto text-slate-300 shadow-inner">
          {terminalLogs.map(log => (
            <div key={log.id} className="flex gap-3 leading-relaxed border-b border-slate-850/50 pb-2">
              <span className="text-slate-500 shrink-0">[{log.time}]</span>
              <span className={`font-black shrink-0 ${terminalLogTextClass(log.type)}`}>
                [{log.type}]
              </span>
              <span className="break-all">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
