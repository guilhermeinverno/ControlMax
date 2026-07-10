import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface FormsAlertsProps {
  errorMsg: string | null;
  successMsg: string | null;
  onDismissError: () => void;
  onDismissSuccess: () => void;
}

export function FormsAlerts({ errorMsg, successMsg, onDismissError, onDismissSuccess }: FormsAlertsProps) {
  return (
    <>
      {errorMsg ? (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={onDismissError} className="text-red-900 font-bold hover:underline">
            X
          </button>
        </div>
      ) : null}

      {successMsg ? (
        <div className="bg-green-50 border border-green-200 text-green-800 p-3.5 rounded text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={onDismissSuccess} className="text-green-900 font-bold hover:underline">
            X
          </button>
        </div>
      ) : null}
    </>
  );
}
