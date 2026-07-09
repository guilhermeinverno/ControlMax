import { Download } from 'lucide-react';
import { Customer } from '../../../types/company';
import { DEMO_PAYMENTS, DEMO_SALES } from './demoData';
import { useCustomerFinancialData } from './useCustomerFinancialData';

interface CustomerModalSalesTabProps {
  customer: Customer;
}

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function CustomerModalSalesTab({ customer }: CustomerModalSalesTabProps) {
  const { sales, payments, loading } = useCustomerFinancialData(customer.id);
  const salesToDisplay = sales.length > 0 ? sales : DEMO_SALES;
  const paymentsToDisplay = payments.length > 0 ? payments : DEMO_PAYMENTS;

  if (loading) {
    return (
      <div className="text-center py-8 text-xs text-gray-500 animate-pulse">
        Carregando vendas e pagamentos...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h3 className="text-sm font-extrabold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-1">Ventas</h3>

        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#8CC63F] text-white">
                <th className="py-2 px-3 text-left font-black">UGI</th>
                <th className="py-2 px-3 text-left font-black">Caixa</th>
                <th className="py-2 px-3 text-left font-black">Data de venda</th>
                <th className="py-2 px-3 text-right font-black">Venta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {salesToDisplay.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-mono font-bold text-gray-700">{sale.ugi}</td>
                  <td className="py-2.5 px-3 text-gray-600">{sale.caixa}</td>
                  <td className="py-2.5 px-3 text-gray-500 text-[10px]">{sale.date}</td>
                  <td className="py-2.5 px-3 text-right font-extrabold text-gray-800">
                    $ {formatCents(sale.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-1 flex justify-start">
          <button
            type="button"
            className="bg-[#8CC63F] hover:bg-[#7BB52F] text-white font-extrabold px-4 py-2 rounded-lg text-[10px] uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
          >
            Movimento de venda
          </button>
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <div className="flex justify-between items-center border-b border-gray-100 pb-1">
          <h3 className="text-sm font-extrabold text-gray-700 uppercase tracking-wide">Pagos</h3>
          <button type="button" className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer" title="Descargar Historial">
            <Download className="w-4 h-4" />
          </button>
        </div>

        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#8CC63F] text-white">
                <th className="py-2 px-3 text-left font-black">UGI</th>
                <th className="py-2 px-3 text-left font-black">Caixa</th>
                <th className="py-2 px-3 text-left font-black">Data de Pagamento</th>
                <th className="py-2 px-3 text-right font-black">Tipo de movimento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {paymentsToDisplay.map((pay) => (
                <tr key={pay.id} className="hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-mono font-bold text-gray-700">{pay.ugi}</td>
                  <td className="py-2.5 px-3 text-gray-600">{pay.caixa}</td>
                  <td className="py-2.5 px-3 text-gray-500 text-[10px]">{pay.date}</td>
                  <td className="py-2.5 px-3 text-right text-[11px] font-bold text-green-700">
                    {pay.method} - $ {formatCents(pay.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
