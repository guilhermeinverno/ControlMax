import { FirestoreIncome } from '../../hooks/useNewIncomeData';
import { incomeTypeLabel } from '../../utils/incomeTypeLabels';
import { formatFirestoreDate } from '../../utils/firestoreTimestamp';
import { listViewBody } from '../../utils/listViewBody';

interface NewIncomeHistoryPanelProps {
  loadingHistory: boolean;
  incomes: FirestoreIncome[];
}

function formatIncomeDate(timestamp: unknown): string {
  if (!timestamp) return 'Reciente';
  return formatFirestoreDate(timestamp, 'es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }) || 'Reciente';
}

export function NewIncomeHistoryPanel({ loadingHistory, incomes }: NewIncomeHistoryPanelProps) {
  return (
    <div className="bg-white border border-gray-200 shadow-md rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        {listViewBody(
          loadingHistory,
          incomes.length,
          <div className="p-12 text-center text-xs text-gray-400 font-extrabold">Cargando historial de ingresos...</div>,
          <div className="p-12 text-center text-xs text-gray-400 font-extrabold">No se encontraron ingresos registrados.</div>,
          <table className="w-full text-left border-collapse min-w-[380px]">
            <thead>
              <tr className="bg-[#E5E7EB] text-gray-700 text-[10px] uppercase tracking-wider border-b border-gray-200">
                <th className="p-3 font-extrabold whitespace-nowrap">Fecha</th>
                <th className="p-3 font-extrabold whitespace-nowrap">Tipo</th>
                <th className="p-3 font-extrabold whitespace-nowrap">Comentario</th>
                <th className="p-3 font-extrabold whitespace-nowrap">Valor</th>
              </tr>
            </thead>
            <tbody className="text-xs text-gray-800">
              {incomes.map((inc, idx) => (
                <tr key={inc.id} className={`border-b border-gray-100 ${idx % 2 === 1 ? 'bg-gray-50/70' : ''}`}>
                  <td className="p-3 whitespace-nowrap text-gray-500 font-bold">{formatIncomeDate(inc.createdAt)}</td>
                  <td className="p-3 whitespace-nowrap uppercase text-[10px] font-extrabold text-[#6A008A]">
                    {incomeTypeLabel(inc.incomeType || inc.type)}
                  </td>
                  <td className="p-3 text-gray-500 max-w-[150px] truncate">{inc.comment}</td>
                  <td className="p-3 font-extrabold text-green-600 whitespace-nowrap">$ {(inc.amount / 100).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>,
        )}
      </div>
    </div>
  );
}
