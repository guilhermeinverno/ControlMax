import type { FirestoreExpense } from '../../hooks/useNewExpenseData';
import { formatExpenseType } from '../../utils/expenseTypeLabels';
import { formatFirestoreDate } from '../../utils/firestoreTimestamp';
import { listViewBody } from '../../utils/listViewBody';

interface NewExpenseHistoryPanelProps {
  loadingHistory: boolean;
  unifiedHistory: FirestoreExpense[];
}

function formatExpenseDate(timestamp: unknown): string {
  if (!timestamp) return 'Reciente';
  return (
    formatFirestoreDate(timestamp, 'es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }) || 'Reciente'
  );
}

export function NewExpenseHistoryPanel({ loadingHistory, unifiedHistory }: NewExpenseHistoryPanelProps) {
  return (
    <div className="bg-white border border-gray-200 shadow-md rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        {listViewBody(
          loadingHistory,
          unifiedHistory.length,
          <div className="p-12 text-center text-xs text-gray-400 font-extrabold">Cargando historial de egresos...</div>,
          <div className="p-12 text-center text-xs text-gray-400 font-extrabold">No se encontraron egresos registrados.</div>,
          <table className="w-full text-left border-collapse min-w-[420px]">
            <thead>
              <tr className="bg-[#E5E7EB] text-gray-700 text-[10px] uppercase tracking-wider border-b border-gray-200">
                <th className="p-3 font-extrabold whitespace-nowrap">Fecha</th>
                <th className="p-3 font-extrabold whitespace-nowrap">Origen</th>
                <th className="p-3 font-extrabold whitespace-nowrap">Tipo</th>
                <th className="p-3 font-extrabold whitespace-nowrap">Comentario</th>
                <th className="p-3 font-extrabold whitespace-nowrap">Valor</th>
              </tr>
            </thead>
            <tbody className="text-xs text-gray-800">
              {unifiedHistory.map((expense, idx) => (
                <tr key={expense.id} className={`border-b border-gray-100 ${idx % 2 === 1 ? 'bg-gray-50/70' : ''}`}>
                  <td className="p-3 whitespace-nowrap text-gray-500 font-bold">{formatExpenseDate(expense.createdAt)}</td>
                  <td className="p-3 whitespace-nowrap text-[10px] text-gray-600 font-semibold">
                    {expense.boxName ? `Caja: ${expense.boxName}` : 'CN Principal'}
                  </td>
                  <td className="p-3 whitespace-nowrap uppercase text-[10px] font-extrabold text-[#6A008A]">
                    {formatExpenseType(expense.expenseType || '')}
                  </td>
                  <td className="p-3 text-gray-500 max-w-[130px] truncate" title={expense.comment || expense.description}>
                    {expense.comment || expense.description}
                  </td>
                  <td className="p-3 font-extrabold text-red-600 whitespace-nowrap">$ {(expense.amount / 100).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>,
        )}
      </div>
    </div>
  );
}
