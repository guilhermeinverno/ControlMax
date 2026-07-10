import {
  Coins,
  Clock,
  Pencil,
  MapPin,
  User as UserIcon,
  Phone,
  FileText,
} from 'lucide-react';
import { Screen } from '../../../types';
import { saleActivityLabel } from '../../../utils/statusLabels';
import { formatFirestoreDate } from '../../../utils/firestoreTimestamp';
import { fmtCents } from '../../../utils/fmtCents';
import type { SaleDetailRecord, SalePaymentRecord } from '../../../types/saleDetail';
import type { SaleFinancialDisplay } from '../../../utils/saleDetailDisplay';

interface SaleDetailContentProps {
  sale: SaleDetailRecord;
  payments: SalePaymentRecord[];
  financial: SaleFinancialDisplay;
  saleId: string;
  onNavigate?: (screen: Screen, params?: Record<string, unknown>) => void;
}

export function SaleDetailContent({
  sale,
  payments,
  financial,
  saleId,
  onNavigate,
}: SaleDetailContentProps) {
  return (
    <div className="flex flex-col bg-[#F3F4F6] min-h-screen text-[#333333] pt-2 pb-6 px-2 space-y-2">
      {/* SECCIÓN RESUMEN DE LA VENTA */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm p-2 text-xs">
        <div className="flex items-center justify-between border-b border-gray-200 pb-1 mb-1">
          <div className="flex items-center space-x-1.5">
            <span className="bg-[#555555] text-white w-5 h-5 flex items-center justify-center font-bold text-[10px] rounded-sm shrink-0">
              {sale.score || 'N'}
            </span>
            <span className="font-bold text-[#333333] text-sm">{sale.clientName}</span>
          </div>
          <span className="font-bold text-gray-500">#{sale.id}</span>
        </div>

        <div className="grid grid-cols-2 gap-y-1 gap-x-2 mt-2">
          <div className="flex flex-col">
            <span className="text-[#777777] text-[10px] font-bold">ID Cliente</span>
            <span className="font-semibold text-[#333333]">{sale.idPreVenta || sale.id}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#777777] text-[10px] font-bold">Estado</span>
            <span className="font-semibold text-[#333333] capitalize">{saleActivityLabel(sale.status)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#777777] text-[10px] font-bold">Unidad</span>
            <span className="font-semibold text-[#333333]">{sale.unidade}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#777777] text-[10px] font-bold">Fecha Creación</span>
            <span className="font-semibold text-[#333333]">
              {sale.createdAt
                ? formatFirestoreDate(sale.createdAt, 'pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })
                : '--'}
            </span>
          </div>
        </div>
      </div>

      {/* SECCIÓN FINANCIERA */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm p-2 text-xs">
        <div className="flex flex-col space-y-1">
          <div className="flex justify-between border-b border-dashed border-gray-200 pb-0.5">
            <span className="font-bold text-[#777777]">Valor Venta</span>
            <span className="font-bold text-[#16A34A]">{financial.valorStr}</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-gray-200 pb-0.5">
            <span className="font-bold text-[#777777]">Interés</span>
            <span className="font-bold text-[#16A34A]">{sale.interes || '0,00'}</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-gray-200 pb-0.5">
            <span className="font-bold text-[#777777]">Saldo Total</span>
            <span className="font-bold text-[#16A34A]">{financial.saldoTotalStr}</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-gray-400 bg-gray-50 pb-0.5 px-1 rounded-sm">
            <span className="font-bold text-[#333333]">Saldo Pendiente</span>
            <span className="font-bold text-[#16A34A]">{financial.saldoPendienteStr}</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-gray-200 pb-0.5">
            <span className="font-bold text-[#777777]">Total Pagado</span>
            <span className="font-bold text-[#16A34A]">{financial.totalPagadoStr}</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-gray-200 pb-0.5">
            <span className="font-bold text-[#777777]">Número de Cuotas</span>
            <span className="font-semibold text-[#333333]">12</span>
          </div>
          <div className="flex justify-between pb-0.5">
            <span className="font-bold text-[#777777]">Próximo Vencimiento</span>
            <span className="font-semibold text-[#333333]">20/09/2025</span>
          </div>
        </div>
      </div>

      {/* SECCIÓN CLIENTE */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm p-2 text-xs">
        <div className="space-y-1.5">
          <div className="flex items-start">
            <UserIcon className="w-3.5 h-3.5 text-[#777777] mr-1.5 mt-0.5 shrink-0" />
            <span className="font-semibold text-[#333333]">{sale.clientName}</span>
          </div>
          <div className="flex items-start">
            <Phone className="w-3.5 h-3.5 text-[#777777] mr-1.5 mt-0.5 shrink-0" />
            <span className="font-semibold text-[#333333]">+55 11 99999-8888</span>
          </div>
          <div className="flex items-start">
            <MapPin className="w-3.5 h-3.5 text-[#777777] mr-1.5 mt-0.5 shrink-0" />
            <span className="font-semibold text-[#333333]">Av. Principal 123, {sale.unidade}.</span>
          </div>
          <div className="flex items-start">
            <FileText className="w-3.5 h-3.5 text-[#777777] mr-1.5 mt-0.5 shrink-0" />
            <span className="font-semibold text-[#777777] italic">Cobrar solo por la mañana.</span>
          </div>
        </div>
      </div>

      {/* SECCIÓN PAGOS */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm text-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#E5E7EB] text-[#555555]">
            <tr>
              <th className="p-1.5 border-r border-gray-300 font-bold uppercase text-[10px]">Fecha</th>
              <th className="p-1.5 border-r border-gray-300 font-bold uppercase text-[10px]">Valor</th>
              <th className="p-1.5 border-r border-gray-300 font-bold uppercase text-[10px]">Usuario</th>
              <th className="p-1.5 font-bold uppercase text-[10px] text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="text-[#333333]">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-3 text-center text-gray-400 italic">
                  No hay pagos registrados aún para esta venta.
                </td>
              </tr>
            ) : (
              payments.map((p, index) => (
                <tr key={p.id} className={`border-b border-gray-200 ${index % 2 === 1 ? 'bg-gray-50' : ''}`}>
                  <td className="p-1.5 border-r border-gray-200">{p.date}</td>
                  <td className="p-1.5 border-r border-gray-200 font-bold text-[#16A34A]">
                    $ {fmtCents(p.amount)}
                  </td>
                  <td className="p-1.5 border-r border-gray-200 truncate max-w-[80px]">{p.userName}</td>
                  <td className="p-1.5 text-center font-semibold text-[#16A34A]">{p.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* AÇÕES */}
      <div className="pt-2 flex flex-col space-y-2">
        <button
          onClick={() => onNavigate && onNavigate('register-payment', { saleId })}
          className="w-full bg-[#16A34A] hover:bg-[#15803d] text-white font-bold py-2.5 text-sm flex justify-center items-center rounded-sm shadow-sm transition-colors cursor-pointer"
        >
          <Coins className="w-4 h-4 mr-1.5" />
          PAGAR
        </button>

        <div className="flex space-x-2">
          <button
            onClick={() => onNavigate && onNavigate('payment-history', { saleId })}
            className="flex-1 bg-[#F3F4F6] text-[#333333] border border-gray-300 font-bold py-2 text-xs flex justify-center items-center rounded-sm shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 mr-1 text-[#555555]" />
            Historial
          </button>
          <button className="flex-1 bg-[#2563EB] text-white font-bold py-2 text-xs flex justify-center items-center rounded-sm shadow-sm hover:bg-[#1d4ed8] transition-colors cursor-pointer">
            <Pencil className="w-3.5 h-3.5 mr-1" />
            Editar
          </button>
          <button
            onClick={() => onNavigate && onNavigate('sales')}
            className="flex-[0.5] bg-gray-200 text-[#333333] border border-gray-300 font-bold py-2 text-xs flex justify-center items-center rounded-sm shadow-sm hover:bg-gray-300 transition-colors cursor-pointer"
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}
