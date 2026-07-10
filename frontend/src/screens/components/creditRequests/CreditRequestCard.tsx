import { Timestamp } from 'firebase/firestore';
import { Check, History, Loader2, X } from 'lucide-react';
import type { CreditRequest } from '../../../utils/creditRequestMapper';
import {
  creditRequestStatusBadgeClasses,
  creditRequestStatusLabel,
  creditScoreColorClasses,
} from '../../../utils/statusLabels';
import { fmtCents } from '../../../utils/fmtCents';

function formatCreditRequestDate(timestamp: Timestamp | null): string {
  if (!timestamp) return 'Recente';
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toLocaleString('pt-BR');
  }
  return 'Pendente';
}

interface HistoryLog {
  time: string;
  action: string;
  user: string;
  details: string;
}

interface CreditRequestCardProps {
  request: CreditRequest;
  isExpanded: boolean;
  canReview: boolean;
  savingActionId: string | null;
  onToggle: () => void;
  onApprove: () => void;
  onReject: () => void;
}

export function CreditRequestCard({
  request,
  isExpanded,
  canReview,
  savingActionId,
  onToggle,
  onApprove,
  onReject,
}: CreditRequestCardProps) {
  const badgeClasses = creditRequestStatusBadgeClasses(request.status);
  const badgeLabel = creditRequestStatusLabel(request.status);
  const scoreColor = creditScoreColorClasses(request.score);
  const showReviewButtons = request.status === 'pending' && canReview;
  const historyLogs = (request.historyLogs || []) as HistoryLog[];

  return (
    <div
      id={`request-card-${request.id}`}
      className="bg-white border border-gray-300 shadow-sm rounded p-3 flex flex-col space-y-2 transition-all cursor-pointer hover:border-[#6B21A8]"
      onClick={onToggle}
    >
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-bold text-gray-900 text-sm">{request.clientName}</h4>
          <p className="text-gray-500 text-xs font-mono">{request.clientDoc || 'CC Não informada'}</p>
        </div>
        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${badgeClasses}`}>
          {badgeLabel}
        </span>
      </div>

      <div className="flex justify-between items-center text-xs text-gray-500 pt-1">
        <div>
          <span className="text-[10px] uppercase font-semibold text-gray-400 block">Valor Solicitado</span>
          <span className="font-extrabold text-[#16A34A] text-sm">$ {fmtCents(request.amount)}</span>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-semibold text-gray-400 block">Score</span>
          <span className={`inline-block font-bold px-2 py-0.5 rounded border text-xs ${scoreColor}`}>
            {request.score} / 100
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center text-[10px] text-gray-400 border-t border-gray-100 pt-2 mt-1">
        <span>
          Por: <span className="font-semibold text-gray-600">{request.requestedBy}</span>
        </span>
        <span>{formatCreditRequestDate(request.createdAt)}</span>
      </div>

      {isExpanded && (
        <div
          className="border-t border-gray-200 pt-3 mt-2 space-y-3"
          onClick={(e) => e.stopPropagation()}
        >
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">
              Observações / Justificativa
            </span>
            <div className="bg-gray-50 border border-gray-200 p-2 rounded text-xs text-gray-700 italic leading-relaxed">
              {request.observations || 'Nenhuma observação informada.'}
            </div>
          </div>

          <div className="flex justify-between items-center bg-gray-50 border border-gray-105 p-2 rounded">
            <span className="text-[10px] uppercase font-bold text-gray-500">Saldo Atual do Cliente</span>
            <span className="font-bold text-red-600 text-xs">$ {fmtCents(request.currentBalance || 0)}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1 flex items-center">
              <History className="w-3.5 h-3.5 mr-1" /> Histórico de Ações
            </span>
            <div className="max-h-36 overflow-y-auto space-y-1.5 border border-gray-150 rounded bg-gray-50 p-2">
              {historyLogs.length > 0 ? (
                historyLogs.map((log) => (
                  <div
                    key={`${log.time}-${log.action}-${log.user}`}
                    className="text-[10px] border-b border-gray-100 pb-1.5 last:border-0 last:pb-0"
                  >
                    <div className="flex justify-between text-purple-700 font-bold">
                      <span>{log.action}</span>
                      <span className="text-gray-400 font-normal">{log.time}</span>
                    </div>
                    <div className="text-gray-500">
                      Operador: <span className="font-semibold">{log.user}</span>
                    </div>
                    {log.details && <div className="text-gray-600 italic mt-0.5">{log.details}</div>}
                  </div>
                ))
              ) : (
                <div className="text-center italic text-gray-400 text-[10px] py-2">
                  Sem registros de histórico.
                </div>
              )}
            </div>
          </div>

          {showReviewButtons && (
            <div className="flex space-x-2 pt-2 border-t border-gray-100">
              <button
                onClick={onApprove}
                className="flex-1 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold py-2 px-3 rounded text-xs flex justify-center items-center cursor-pointer transition-colors"
                disabled={savingActionId !== null}
              >
                {savingActionId === request.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                ) : (
                  <Check className="w-3.5 h-3.5 mr-1" />
                )}
                Aprovar
              </button>
              <button
                onClick={onReject}
                className="flex-1 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold py-2 px-3 rounded text-xs flex justify-center items-center cursor-pointer transition-colors"
                disabled={savingActionId !== null}
              >
                {savingActionId === request.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                ) : (
                  <X className="w-3.5 h-3.5 mr-1" />
                )}
                Rejeitar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
