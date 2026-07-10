import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface PlatformManagementAlertsProps {
  successMsg: string | null;
  errorMsg: string | null;
}

export function PlatformManagementAlerts({ successMsg, errorMsg }: PlatformManagementAlertsProps) {
  return (
    <AnimatePresence>
      {successMsg ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-emerald-50 border-b border-emerald-100 text-emerald-800 px-5 py-3.5 text-xs font-bold flex items-center gap-2.5 shadow-sm"
        >
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </motion.div>
      ) : null}
      {errorMsg ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-rose-50 border-b border-rose-100 text-rose-800 px-5 py-3.5 text-xs font-bold flex items-center gap-2.5 shadow-sm"
        >
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
