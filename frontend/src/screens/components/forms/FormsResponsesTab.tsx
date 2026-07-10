import { Calendar, Loader2, User } from 'lucide-react';
import { FormResponse } from '../../../types';
import { booleanFieldDisplay } from '../../../utils/statusLabels';
import { listViewBody } from '../../../utils/listViewBody';
import { formatResponseDate } from '../../../utils/formsHelpers';

interface FormsResponsesTabProps {
  responsesList: FormResponse[];
  loadingResponses: boolean;
  role: string;
}

export function FormsResponsesTab({ responsesList, loadingResponses, role }: FormsResponsesTabProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide">
            Historial de Respuestas Recibidas
          </h2>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {role === 'collector'
              ? 'Mostrando tus respuestas completadas'
              : 'Mostrando respuestas de todos los cobradores'}
          </p>
        </div>
        <p className="text-[11px] text-gray-400">Total: {responsesList.length}</p>
      </div>

      {listViewBody(
        loadingResponses,
        responsesList.length,
        (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-700 mb-2" />
            <p className="text-xs text-gray-400">Buscando envíos...</p>
          </div>
        ),
        (
          <div className="text-center py-12 text-gray-400 text-xs">
            Ninguna respuesta registrada hasta el momento.
          </div>
        ),
        (
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {responsesList.map((resp) => (
              <div
                key={resp.id}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex flex-col md:flex-row justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-gray-900 text-sm">{resp.formTitle}</span>
                    <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded font-mono">
                      ID: {resp.id.substring(0, 8)}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                    {Object.entries(resp.answers).map(([key, value]) => (
                      <div key={key} className="bg-white p-2 rounded border border-gray-150 text-xs">
                        <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wide">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span className="font-semibold text-gray-800">
                          {typeof value === 'boolean' ? booleanFieldDisplay(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="md:border-l md:border-gray-200 md:pl-4 flex flex-col justify-center text-xs text-gray-500 space-y-1.5 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-purple-600" />
                    <span className="font-medium text-gray-700">{resp.submittedBy}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-purple-600" />
                    <span className="font-mono text-[11px]">{formatResponseDate(resp.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
