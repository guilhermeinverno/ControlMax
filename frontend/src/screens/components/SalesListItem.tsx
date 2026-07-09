import React from 'react';
import { Coins, Pencil, Clock, Camera } from 'lucide-react';
import { Screen } from '../../types';
import { formatToBRL } from '../../utils/currencyUtils';

export interface SaleItem {
  id: string;
  idPreVenta: string;
  unidade: string;
  score: string;
  createdAt: string;
  createdDateISO: string;
  valor: string;
  interes: string;
  saldoTotal: string;
  saldoPendiente: string;
  tipo: string;
  tipoVenta: string;
  documentos: string;
  diasAtraso: string;
  clientName: string;
  status: 'active' | 'inactive' | 'charged_off';
}

interface SalesListItemProps {
  sale: SaleItem;
  onNavigate?: (screen: Screen, params?: Record<string, unknown>) => void;
}

export const SalesListItem: React.FC<SalesListItemProps> = ({ sale, onNavigate }) => {
  return (
    <tr className="hover:bg-gray-50/40 transition-colors">
      {/* Left Column (Metadata fields stacked) */}
      <td className="p-3 border-r border-gray-100 w-[45%] align-top text-xs">
        <div className="space-y-2.5">
          <div>
            <span className="text-[10px] text-gray-400 uppercase font-bold leading-none block">Id Venta</span>
            <span className="text-xs font-bold text-[#333333] mt-0.5 block">{sale.id}</span>
          </div>
          
          <div>
            <span className="text-[10px] text-gray-400 uppercase font-bold leading-none block">Id Pre Venta</span>
            <span className="text-xs font-semibold text-[#333333] mt-0.5 block">
              {sale.idPreVenta || <span className="text-gray-300 italic">-</span>}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-gray-400 uppercase font-bold leading-none block">Unidade</span>
            <span className="text-xs font-bold text-[#333333] mt-0.5 block">{sale.unidade}</span>
          </div>

          <div>
            <span className="text-[10px] text-gray-400 uppercase font-bold leading-none block mb-1">Score</span>
            <div className="bg-[#777777] text-white w-7 h-7 flex items-center justify-center font-black text-sm rounded shadow-sm">
              {sale.score}
            </div>
          </div>

          <div>
            <span className="text-[10px] text-gray-400 uppercase font-bold leading-none block">Fecha de creación</span>
            <span className="text-xs font-bold text-[#333333] mt-0.5 block leading-tight">{sale.createdAt}</span>
          </div>

          <div>
            <span className="text-[10px] text-gray-400 uppercase font-bold leading-none block">Valor</span>
            <span className="text-xs font-bold text-[#333333] mt-0.5 block">{formatToBRL(sale.valor)}</span>
          </div>

          <div>
            <span className="text-[10px] text-gray-400 uppercase font-bold leading-none block">Interés</span>
            <span className="text-xs font-bold text-[#333333] mt-0.5 block">{formatToBRL(sale.interes)}</span>
          </div>

          <div>
            <span className="text-[10px] text-gray-400 uppercase font-bold leading-none block">Saldo total</span>
            <span className="text-xs font-bold text-[#333333] mt-0.5 block">{formatToBRL(sale.saldoTotal)}</span>
          </div>

          <div>
            <span className="text-[10px] text-gray-400 uppercase font-bold leading-none block">Saldo pendiente</span>
            <span className="text-xs font-bold text-[#333333] mt-0.5 block">{formatToBRL(sale.saldoPendiente)}</span>
          </div>

          <div>
            <span className="text-[10px] text-gray-400 uppercase font-bold leading-none block">Tipo</span>
            <span className="text-xs font-bold text-[#333333] mt-0.5 block">{sale.tipo}</span>
          </div>

          <div>
            <span className="text-[10px] text-gray-400 uppercase font-bold leading-none block">Tipo de venta</span>
            <span className="text-xs font-bold text-[#333333] mt-0.5 block">{sale.tipoVenta}</span>
          </div>

          <div>
            <span className="text-[10px] text-gray-400 uppercase font-bold leading-none block">Documentos</span>
            <span className="text-xs font-bold text-[#333333] mt-0.5 block select-all">{sale.documentos}</span>
          </div>

          <div>
            <span className="text-[10px] text-gray-400 uppercase font-bold leading-none block">Dias de atraso</span>
            <span className="text-xs font-bold text-[#333333] mt-0.5 block">{sale.diasAtraso}</span>
          </div>

          <div className="pt-2 border-t border-dashed border-gray-100 space-y-3">
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-bold leading-none block mb-1">Pagar</span>
              <button 
                onClick={() => onNavigate && onNavigate('register-payment', { saleId: sale.id })}
                className="border-2 border-gray-200 bg-white hover:bg-gray-50 text-[#333333] font-bold text-xs py-2 px-4 rounded-full flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Coins className="w-3.5 h-3.5 text-gray-500" />
                Pagar
              </button>
            </div>

            <div>
              <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Detalles</span>
              <button 
                onClick={() => onNavigate && onNavigate('sale-detail', { saleId: sale.id })}
                className="w-10 h-10 border border-gray-200 bg-white hover:bg-gray-50 rounded flex items-center justify-center transition-colors shadow-sm"
                title="Ver Detalles"
              >
                <Pencil className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <div>
              <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Historial</span>
              <button 
                onClick={() => onNavigate && onNavigate('payment-history', { saleId: sale.id })}
                className="w-10 h-10 border border-gray-200 bg-white hover:bg-gray-50 rounded flex items-center justify-center transition-colors shadow-sm"
                title="Ver Historial"
              >
                <Clock className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <div>
              <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Imágenes</span>
              <button 
                className="w-10 h-10 border border-gray-200 bg-white hover:bg-gray-50 rounded flex items-center justify-center transition-colors shadow-sm"
                title="Ver Imágenes"
              >
                <Camera className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </td>

      {/* Right Column (Client name / id in violet bold) */}
      <td className="p-3 w-[55%] align-top text-xs">
        <div 
          onClick={() => onNavigate && onNavigate('sale-detail', { saleId: sale.id })}
          className="font-extrabold text-[#6B21A8] hover:text-[#581c87] cursor-pointer hover:underline transition-all leading-relaxed"
        >
          {sale.clientName}
        </div>
      </td>
    </tr>
  );
};
