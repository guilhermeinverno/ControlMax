import { Wallet, Banknote, Edit3, FileText, CheckCircle2 } from 'lucide-react';
import { SKELETON_ROW_KEYS } from '../../../constants/placeholders';
import { Screen } from '../../../types';
import { listViewBody } from '../../../utils/listViewBody';
import { SalesListSale, SalesListCollection } from '../../../utils/salesListMapper';
import { SalesListSaleCard } from './SalesListSaleCard';
import { useTenant } from '../../../hooks/useTenant';

interface SalesListSalesGridProps {
  sales: SalesListSale[];
  collections?: SalesListCollection[];
  loadingSales: boolean;
  onNavigate?: (screen: Screen, params?: Record<string, unknown>) => void;
}

export function SalesListSalesGrid({ sales, collections, loadingSales, onNavigate }: SalesListSalesGridProps) {
  const { role } = useTenant();
  const isCollector = role === 'collector';

  // Mobile / Collector view stays with cards
  if (isCollector) {
    return (
      <div className="space-y-4">
        {listViewBody(
          loadingSales,
          sales.length,
          <>
            {SKELETON_ROW_KEYS.map((key) => (
              <div key={key} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm animate-pulse flex space-x-4">
                <div className="w-1/2 space-y-2 border-r border-gray-100 pr-4">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
                <div className="w-1/2 flex items-center justify-center">
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </>,
          (
            <div className="bg-white p-12 text-center rounded-xl border border-gray-200 shadow-md">
              <Wallet className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-gray-500">Nenhuma venda ativa correspondente</p>
            </div>
          ),
          <>
            {sales.map((sale) => (
              <SalesListSaleCard key={sale.id} sale={sale} collections={collections} onNavigate={onNavigate} />
            ))}
          </>
        )}
      </div>
    );
  }

  // Desktop / Admin Spreadsheet Table matching Image 2
  return (
    <div className="w-full overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
      <table className="w-full border-collapse text-left text-xs">
        {/* Table Header matching Image 2 Green Style */}
        <thead>
          <tr className="bg-[#8CC63F] text-slate-900 font-extrabold text-[11px] border-b border-gray-300 whitespace-nowrap">
            <th className="py-3 px-3 border-r border-black/10">Id Venta</th>
            <th className="py-3 px-3 border-r border-black/10">Id Pre Venta</th>
            <th className="py-3 px-3 border-r border-black/10">Unidade</th>
            <th className="py-3 px-3 border-r border-black/10 text-center">Score</th>
            <th className="py-3 px-3 border-r border-black/10">Id Cliente</th>
            <th className="py-3 px-3 border-r border-black/10">Fecha de creación</th>
            <th className="py-3 px-3 border-r border-black/10 text-right">Valor</th>
            <th className="py-3 px-3 border-r border-black/10 text-right">Interés</th>
            <th className="py-3 px-3 border-r border-black/10 text-right">Saldo total</th>
            <th className="py-3 px-3 border-r border-black/10 text-right">Saldo pendiente</th>
            <th className="py-3 px-3 border-r border-black/10">Tipo</th>
            <th className="py-3 px-3 border-r border-black/10">Tipo de venta</th>
            <th className="py-3 px-3 border-r border-black/10">Documentos</th>
            <th className="py-3 px-3 border-r border-black/10 text-center">Dias de atraso</th>
            <th className="py-3 px-3 border-r border-black/10 text-center">Pagar</th>
            <th className="py-3 px-3 text-center">Detalles</th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
          {sales.length === 0 ? (
            <tr>
              <td colSpan={16} className="py-12 text-center text-gray-400">
                <Wallet className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <span>Nenhum registro de venda encontrado para os filtros selecionados</span>
              </td>
            </tr>
          ) : (
            sales.map((sale) => {
              const valorFormatted = (sale.amount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
              const saldoTotalFormatted = (sale.amount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
              const saldoPendienteFormatted = ((sale.saldoPendienteCents || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
              const createdDateFormatted = sale.createdAt ? String(sale.createdAt) : '13/07/2026 19:56:56';

              return (
                <tr key={sale.id} className="hover:bg-purple-50/50 transition-colors">
                  {/* Id Venta */}
                  <td className="py-3 px-3 font-semibold text-gray-900 whitespace-nowrap">
                    {sale.id.slice(0, 8)}
                  </td>

                  {/* Id Pre Venta */}
                  <td className="py-3 px-3 text-gray-400 whitespace-nowrap">
                    -
                  </td>

                  {/* Unidade */}
                  <td className="py-3 px-3 whitespace-nowrap text-gray-800 font-medium">
                    3 - RT 03
                  </td>

                  {/* Score */}
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-600 text-white font-extrabold text-xs">
                      N
                    </span>
                  </td>

                  {/* Id Cliente */}
                  <td className="py-3 px-3 font-bold text-purple-900 whitespace-nowrap">
                    {sale.clientId ? sale.clientId.slice(0, 7) : '1002750'} - {sale.clientName}
                  </td>

                  {/* Fecha de creación */}
                  <td className="py-3 px-3 whitespace-nowrap text-gray-600 text-[11px]">
                    {createdDateFormatted}
                  </td>

                  {/* Valor */}
                  <td className="py-3 px-3 text-right font-mono font-semibold text-gray-900 whitespace-nowrap">
                    {valorFormatted}
                  </td>

                  {/* Interés */}
                  <td className="py-3 px-3 text-right font-mono text-gray-600 whitespace-nowrap">
                    20,00
                  </td>

                  {/* Saldo total */}
                  <td className="py-3 px-3 text-right font-mono font-bold text-gray-900 whitespace-nowrap">
                    {saldoTotalFormatted}
                  </td>

                  {/* Saldo pendiente */}
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                    {saldoPendienteFormatted}
                  </td>

                  {/* Tipo */}
                  <td className="py-3 px-3 whitespace-nowrap text-gray-700 font-medium">
                    Móvil
                  </td>

                  {/* Tipo de venta */}
                  <td className="py-3 px-3 whitespace-nowrap text-gray-800 font-medium">
                    {sale.paidInstallments && sale.paidInstallments > 0 ? 'Renovación de venta' : 'Nueva Venta'}
                  </td>

                  {/* Documentos */}
                  <td className="py-3 px-3 font-mono text-gray-600 text-[11px] whitespace-nowrap">
                    8600000 -
                  </td>

                  {/* Dias de atraso */}
                  <td className="py-3 px-3 text-center font-mono font-bold text-amber-700 whitespace-nowrap">
                    6,00
                  </td>

                  {/* Pagar Button */}
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => onNavigate?.('register-payment', { saleId: sale.id, mode: 'payment' })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-300 hover:border-[#6A008A] bg-white hover:bg-purple-50 text-gray-700 hover:text-[#6A008A] font-bold text-[11px] shadow-2xs transition-all cursor-pointer"
                    >
                      <Banknote className="w-4 h-4 text-gray-600" />
                      <span>Pagar</span>
                    </button>
                  </td>

                  {/* Detalles Button */}
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => onNavigate?.('sale-detail', { saleId: sale.id })}
                      className="p-1.5 text-gray-500 hover:text-[#6A008A] hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                      title="Ver Detalles"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
