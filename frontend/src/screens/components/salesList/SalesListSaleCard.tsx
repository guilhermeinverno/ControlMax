import { Coins, Edit3, History, User } from 'lucide-react';
import { Screen } from '../../../types';
import { formatSalesListCents } from '../../../utils/salesListFormat';
import { SalesListSale } from '../../../utils/salesListMapper';

interface SalesListSaleCardProps {
  sale: SalesListSale;
  onNavigate?: (screen: Screen, params?: Record<string, unknown>) => void;
}

export function SalesListSaleCard({ sale, onNavigate }: SalesListSaleCardProps) {
  const interest = Math.round(sale.amount * 0.2);
  const totalWithInterest = sale.amount + interest;
  const fmt = formatSalesListCents;

  return (
    <div className="grid grid-cols-12 bg-white border-l border-r border-b border-gray-200 shadow-sm rounded-b-lg overflow-hidden hover:border-[#6B21A8]/40 transition-colors">
      <div className="col-span-6 p-3 border-r border-gray-200 flex flex-col space-y-1.5 text-xs bg-white">
        <div>
          <span className="block text-[10px] text-gray-400 font-bold leading-none">Id Venta</span>
          <span className="font-extrabold text-gray-800">{sale.id.slice(0, 8)}</span>
        </div>
        <div>
          <span className="block text-[10px] text-gray-400 font-bold leading-none">Id Pre Venta</span>
          <span className="font-bold text-gray-500">-</span>
        </div>
        <div>
          <span className="block text-[10px] text-gray-400 font-bold leading-none">Unidade</span>
          <span className="font-extrabold text-gray-800">{sale.unitName || '3 - RT 03'}</span>
        </div>
        <div>
          <span className="block text-[10px] text-gray-400 font-bold leading-none mb-1">Score</span>
          <div className="inline-block bg-gray-500 rounded px-2.5 py-1 text-center shadow-3xs">
            <span className="text-xs font-black text-white">N</span>
          </div>
        </div>
        <div>
          <span className="block text-[10px] text-gray-400 font-bold leading-none">Fecha de creación</span>
          <span className="font-bold text-gray-700 leading-tight">
            {sale.createdAt
              ? sale.createdAt.toDate().toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })
              : '--'}
          </span>
        </div>
        <div>
          <span className="block text-[10px] text-gray-400 font-bold leading-none">Valor</span>
          <span className="font-extrabold text-gray-800">${fmt(sale.amount)}</span>
        </div>
        <div>
          <span className="block text-[10px] text-gray-400 font-bold leading-none">Interés</span>
          <span className="font-bold text-gray-700">${fmt(interest)}</span>
        </div>
        <div>
          <span className="block text-[10px] text-gray-400 font-bold leading-none">Saldo total</span>
          <span className="font-extrabold text-gray-800">${fmt(totalWithInterest)}</span>
        </div>
        <div>
          <span className="block text-[10px] text-gray-400 font-bold leading-none">Saldo pendiente</span>
          <span className="font-black text-red-600">${fmt(sale.saldoPendienteCents || sale.balance)}</span>
        </div>
        <div>
          <span className="block text-[10px] text-gray-400 font-bold leading-none">Tipo</span>
          <span className="font-bold text-gray-700">Móvil</span>
        </div>
        <div>
          <span className="block text-[10px] text-gray-400 font-bold leading-none">Tipo de venta</span>
          <span className="font-bold text-gray-700">Renovación de venta</span>
        </div>
        <div>
          <span className="block text-[10px] text-gray-400 font-bold leading-none">Documentos</span>
          <span className="font-bold text-gray-700 truncate block max-w-[130px]">{sale.clientDoc || '00699672104'}</span>
        </div>
        <div>
          <span className="block text-[10px] text-gray-400 font-bold leading-none">Dias de atraso</span>
          <span className="font-bold text-gray-700">0,00</span>
        </div>
        <div className="pt-2 flex flex-col space-y-1.5">
          <button
            onClick={() => onNavigate?.('register-payment', { saleId: sale.id })}
            className="flex items-center justify-center space-x-1.5 border border-[#6B21A8] text-[#6B21A8] hover:bg-purple-50 rounded-full py-2 px-3 text-xs font-extrabold transition-colors shadow-3xs"
          >
            <Coins size={14} className="stroke-[2.5]" />
            <span>Pagar</span>
          </button>
          <button
            onClick={() => onNavigate?.('sale-detail', { saleId: sale.id })}
            className="flex items-center justify-center space-x-1 py-1 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors"
          >
            <Edit3 size={12} />
            <span>Detalles</span>
          </button>
          <button
            onClick={() => onNavigate?.('sale-detail', { saleId: sale.id })}
            className="flex items-center justify-center space-x-1 py-1 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors"
          >
            <History size={12} />
            <span>Historial</span>
          </button>
        </div>
      </div>

      <div className="col-span-6 p-4 flex flex-col items-center justify-center bg-[#F9FAFB] text-center min-h-full">
        <div
          onClick={() => onNavigate?.('company-list', { clientId: sale.clientId })}
          className="font-black text-[#6B21A8] hover:text-[#52006A] text-[13px] leading-snug break-words max-w-full px-1 py-2 cursor-pointer hover:underline transition-colors"
          title="Ver ficha do cliente"
        >
          {sale.clientId || '1002558'} - {sale.clientName}
        </div>
        <div className="text-[10px] text-gray-400 mt-2 flex items-center space-x-1">
          <User size={10} className="text-purple-300" />
          <span>Cliente de Campo</span>
        </div>
      </div>
    </div>
  );
}
