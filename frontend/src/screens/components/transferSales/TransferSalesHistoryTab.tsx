import { History as HistoryIcon, Loader2 } from 'lucide-react';
import type { UnitTransfer } from '../../../types/transferSales';
import { toJsDate } from '../../../utils/firestoreTimestamp';
import { fmtTransferSales } from '../../../utils/transferSalesFormat';
import { listViewBody } from '../../../utils/listViewBody';

interface TransferSalesHistoryTabProps {
  loadingHistory: boolean;
  historyTransfers: UnitTransfer[];
}

export function TransferSalesHistoryTab({
  loadingHistory,
  historyTransfers,
}: TransferSalesHistoryTabProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
        <HistoryIcon className="w-4 h-4 text-[#6B21A8]" />
        Historial de traslados finalizados (Últimos 50 registros)
      </h2>

      {listViewBody(
        loadingHistory,
        historyTransfers.length,
        (
          <div className="bg-white border border-gray-200 rounded p-12 text-center text-gray-500 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#6B21A8] mx-auto" />
            <p className="text-xs font-bold">Cargando histórico de auditoría...</p>
          </div>
        ),
        (
          <div className="bg-white border border-gray-300 rounded p-12 text-center text-gray-400 space-y-1 shadow-sm">
            <HistoryIcon className="w-10 h-10 text-gray-300 mx-auto" />
            <h3 className="font-bold text-gray-600 text-xs uppercase tracking-wide">Sin Registros</h3>
            <p className="text-[11px]">No hay traslados finalizados en el histórico de auditoría.</p>
          </div>
        ),
        (
          <div className="bg-white border border-gray-300 rounded shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3">Fecha Traslado</th>
                    <th className="p-3">Unidades</th>
                    <th className="p-3">Origen (CN)</th>
                    <th className="p-3">Destinatario</th>
                    <th className="p-3">Reubicación (CN)</th>
                    <th className="p-3 text-right">Saldo Cartera</th>
                    <th className="p-3 text-center">Estado</th>
                    <th className="p-3">Resolución</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {historyTransfers.map((t) => {
                    const totalBalance = t.units.reduce((s, u) => s + (u.balance || 0), 0);
                    const transDate = toJsDate(t.createdAt);
                    const resolDate = t.resolvedAt ? toJsDate(t.resolvedAt) : null;

                    return (
                      <tr key={t.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="p-3 whitespace-nowrap text-gray-500">
                          <span className="font-bold text-gray-700">{transDate.toLocaleDateString('es-CO')}</span>
                          <span className="block text-[10px] text-gray-400 mt-0.5">
                            {transDate.toLocaleTimeString('es-CO')}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-gray-800">{t.units.map((u) => u.name).join(', ')}</div>
                          <span className="text-[10px] text-purple-700 font-bold">{t.units.length} unidades</span>
                        </td>
                        <td className="p-3 font-semibold text-gray-600">{t.fromCnName}</td>
                        <td className="p-3 font-semibold text-gray-600">{t.toUserName}</td>
                        <td className="p-3 font-semibold text-gray-600">{t.toCnName || '---'}</td>
                        <td className="p-3 text-right font-bold text-gray-800 font-mono">
                          $ {fmtTransferSales(totalBalance)}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              t.status === 'accepted'
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-red-100 text-red-800 border border-red-200'
                            }`}
                          >
                            {t.status === 'accepted' ? 'Aceptado' : 'Rechazado'}
                          </span>
                        </td>
                        <td className="p-3 text-gray-500">
                          <div className="font-semibold text-gray-700">Por: {t.resolvedBy || 'Desconocido'}</div>
                          {resolDate && (
                            <span className="text-[10px] text-gray-400 block mt-0.5">
                              {resolDate.toLocaleDateString('es-CO')} {resolDate.toLocaleTimeString('es-CO')}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}
