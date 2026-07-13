import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface TransferSalesAlertsProps {
  error: string | null;
  success: string | null;
}

export function TransferSalesAlerts({ error, success }: TransferSalesAlertsProps) {
  return (
    <>
      {error && (
        <div className="bg-red-50 border border-red-300 rounded p-4 text-red-800 text-xs flex items-start shadow-sm">
          <AlertCircle className="w-4.5 h-4.5 mr-2.5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold block uppercase tracking-wider mb-0.5 text-red-900">Atención / Error</span>
            <p>{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-300 rounded p-4 text-green-800 text-xs flex items-start shadow-sm">
          <CheckCircle2 className="w-4.5 h-4.5 mr-2.5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold block uppercase tracking-wider mb-0.5 text-green-950">Operación Exitosa</span>
            <p>{success}</p>
          </div>
        </div>
      )}
    </>
  );
}
