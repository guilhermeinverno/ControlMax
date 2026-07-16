import { Coins, Edit3, History, User, Camera, Check, X, Mail } from 'lucide-react';
import { Screen } from '../../../types';
import { formatSalesListCents } from '../../../utils/salesListFormat';
import { SalesListSale } from '../../../utils/salesListMapper';
import { useTenant } from '../../../hooks/useTenant';

interface SalesListSaleCardProps {
  sale: SalesListSale;
  onNavigate?: (screen: Screen, params?: Record<string, unknown>) => void;
}

export function SalesListSaleCard({ sale, onNavigate }: SalesListSaleCardProps) {
  const { role } = useTenant();
  const interest = Math.round(sale.amount * 0.2);
  const totalWithInterest = sale.amount + interest;
  const fmt = formatSalesListCents;

  const isCollector = role === 'collector';

  if (isCollector) {
    const lateDays = Math.max(0, Math.abs(sale.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 6);
    
    const getSaleFrequency = (saleId: string): 'diario' | 'semanal' | 'quinzenal' | 'mensal' => {
      const sum = saleId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const val = Math.abs(sum) % 10;
      if (val < 7) return 'diario';
      if (val < 9) return 'semanal';
      return 'quinzenal';
    };
    const freq = getSaleFrequency(sale.id);
    const indicatorChar = freq === 'diario' ? 'D' : freq === 'semanal' ? 'S' : freq === 'quinzenal' ? 'Q' : 'M';

    // A card is a "Venda" if there are no paid installments, meaning it's a fresh/new credit.
    const isNewSale = sale.paidInstallments === 0 || sale.amount === sale.saldoPendienteCents;

    if (isNewSale) {
      // Render the Sales (Venda) card layout - exactly like Image 3
      const indicatorColor = 'text-green-600 border-green-600'; // In Image 3, Guilherme has a green 'D' circle badge

      return (
        <div className="bg-white border-y border-r border-gray-200/90 border-l-4 border-l-red-600 rounded-r-xl rounded-l-none shadow-md p-2.5 pb-2 flex flex-col hover:border-[#6B21A8]/40 transition-all duration-200 relative overflow-hidden">
          
          {/* Top Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              {/* Status letter badge with border circle */}
              <div className={`w-7 h-7 rounded-full border-2 ${indicatorColor} flex items-center justify-center font-black text-xs shrink-0 select-none`}>
                {indicatorChar}
              </div>

              {/* Client names */}
              <div className="flex flex-col leading-none min-w-0">
                <span className="font-extrabold text-[#333333] text-[13px] lg:text-[14px] truncate leading-tight">
                  {sale.clientId.slice(0, 7)} {sale.clientName}
                </span>
                <span className="text-[10px] font-bold text-gray-500 truncate lowercase mt-0">
                  {sale.clientName.toLowerCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Details Block (Vr. Parcela, Parcelas, Pagamento + Button 1) */}
          <div className="flex items-center justify-between border-t border-b border-gray-100 py-1 my-1 text-left min-h-[52px]">
            <div>
              <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wide leading-none mb-0.5">Vr. Parcela</span>
              <span className="font-extrabold text-[#333333] text-xs">${(sale.installmentAmount / 100).toFixed(0)}</span>
            </div>
            <div>
              <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wide leading-none mb-0.5">Parcelas</span>
              <span className="font-extrabold text-[#333333] text-xs">{sale.installments}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div>
                <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wide leading-none mb-0.5">Pagamento</span>
                <span className="font-extrabold text-red-600 text-xs">$0</span>
              </div>
              {/* Button 1: Registrar Pagamento */}
              <button
                onClick={() => onNavigate?.('register-payment', { saleId: sale.id, mode: 'payment' })}
                className="flex items-center justify-center hover:bg-purple-50 rounded-lg transition-all active:scale-95 duration-150 p-0.5 cursor-pointer select-none shrink-0"
                title="Registrar pagamento"
              >
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="6" y="14" width="28" height="18" rx="2" transform="rotate(-10 6 14)" fill="#FAF5FF" stroke="#6A008A" strokeWidth="2.5"/>
                  <circle cx="20" cy="22" r="4" stroke="#6A008A" strokeWidth="2"/>
                  <path d="M28 28C32 28 36 24 36 20C36 16 32 12 28 12" stroke="#6A008A" strokeWidth="2.5" strokeLinecap="round"/>
                  <circle cx="36" cy="34" r="8" fill="#6A008A"/>
                  <path d="M32 34L35 37L40 31" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Bottom Actions Row & Balance Outstanding */}
          <div className="flex items-center justify-between mt-0.5">
            <div className="flex items-center space-x-1.5">
              {/* Camera */}
              <button
                type="button"
                onClick={() => alert("Câmera ativada: tire uma foto para anexar à venda.")}
                className="w-7.5 h-7.5 rounded bg-[#8CC63F] hover:bg-[#7cb335] text-white flex items-center justify-center hover:opacity-95 active:scale-95 transition-all shadow-xs cursor-pointer"
                title="Tirar foto / Anexo"
              >
                <Camera size={14} className="stroke-[2.5]" />
              </button>

              {/* Mail/Envelope button instead of Check */}
              <button
                type="button"
                onClick={() => alert("Compartilhar recibo de venda por e-mail/mensagem.")}
                className="w-7.5 h-7.5 rounded-full border border-gray-300 text-gray-500 hover:text-[#6B21A8] hover:border-[#6B21A8] flex items-center justify-center hover:bg-purple-50 active:scale-95 transition-all cursor-pointer"
                title="Enviar recibo de venda"
              >
                <Mail size={14} className="stroke-[2.5]" />
              </button>

              {/* Overdue/Status numeric badge (always green 0 for new active sale) */}
              <div className="w-7.5 h-7.5 rounded flex items-center justify-center text-white font-extrabold text-xs bg-[#16A34A]">
                0
              </div>
            </div>

            {/* Valor de venda and Saldo devedor + Button 2 */}
            <div className="flex items-center space-x-3 text-right shrink-0">
              <div className="flex flex-col leading-none">
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">Valor de venda</span>
                <span className="text-xs font-black text-[#333333] mt-0.5">
                  ${(sale.amount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </span>
              </div>

              <div className="flex items-center space-x-1">
                <div className="flex flex-col leading-none">
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">Saldo devedor</span>
                  <span className="text-xs font-black text-[#333333] mt-0.5">
                    ${(sale.saldoPendienteCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </span>
                </div>
                {/* Button 2: Registrar Não Pagamento */}
                <button
                  onClick={() => onNavigate?.('register-payment', { saleId: sale.id, mode: 'no-payment' })}
                  className="flex items-center justify-center hover:bg-purple-50 rounded-lg transition-all active:scale-95 duration-150 p-0.5 cursor-pointer select-none shrink-0"
                  title="Registrar não pagamento"
                >
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="6" y="14" width="28" height="18" rx="2" transform="rotate(-10 6 14)" fill="#FAF5FF" stroke="#6A008A" strokeWidth="2.5"/>
                    <circle cx="20" cy="22" r="4" stroke="#6A008A" strokeWidth="2"/>
                    <path d="M28 28C32 28 36 24 36 20C36 16 32 12 28 12" stroke="#6A008A" strokeWidth="2.5" strokeLinecap="round"/>
                    <circle cx="36" cy="34" r="8" fill="#6A008A"/>
                    <path d="M33 31L39 37M39 31L33 37" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      // Render the Collections (Coleção) card layout - exactly like Image 2
      const indicatorColor = lateDays > 0 ? 'text-red-500 border-red-500' : 'text-green-600 border-green-600';
      const pendingInstallments = Math.max(0, sale.installments - sale.paidInstallments);

      return (
        <div className="bg-white border border-gray-200/90 rounded-xl shadow-md p-2.5 pb-2 flex flex-col hover:border-[#6B21A8]/40 transition-all duration-200">
          
          {/* Top Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              {/* Status letter badge with border circle */}
              <div className={`w-7 h-7 rounded-full border-2 ${indicatorColor} flex items-center justify-center font-black text-xs shrink-0 select-none`}>
                {indicatorChar}
              </div>

              {/* Client names */}
              <div className="flex flex-col leading-none min-w-0">
                <span className="font-extrabold text-[#333333] text-[13px] lg:text-[14px] truncate leading-tight">
                  {sale.clientId.slice(0, 7)} {sale.clientName}
                </span>
                <span className="text-[10px] font-bold text-gray-500 truncate lowercase mt-0">
                  {sale.clientName.toLowerCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Details Block (Vr. Parcela, Pendintes, Pagamento + Button 1) */}
          <div className="flex items-center justify-between border-t border-b border-gray-100 py-1 my-1 text-left min-h-[52px]">
            <div>
              <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wide leading-none mb-0.5">Vr. Parcela</span>
              <span className="font-extrabold text-[#333333] text-xs">${(sale.installmentAmount / 100).toFixed(0)}</span>
            </div>
            <div>
              <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wide leading-none mb-0.5">Pendintes</span>
              <span className="font-extrabold text-[#333333] text-xs">
                {pendingInstallments.toFixed(1)} / {sale.installments.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div>
                <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wide leading-none mb-0.5">Pagamento</span>
                <span className="font-extrabold text-gray-400 text-xs">--</span>
              </div>
              {/* Button 1: Registrar Pagamento */}
              <button
                onClick={() => onNavigate?.('register-payment', { saleId: sale.id, mode: 'payment' })}
                className="flex items-center justify-center hover:bg-purple-50 rounded-lg transition-all active:scale-95 duration-150 p-0.5 cursor-pointer select-none shrink-0"
                title="Registrar pagamento"
              >
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="6" y="14" width="28" height="18" rx="2" transform="rotate(-10 6 14)" fill="#FAF5FF" stroke="#6A008A" strokeWidth="2.5"/>
                  <circle cx="20" cy="22" r="4" stroke="#6A008A" strokeWidth="2"/>
                  <path d="M28 28C32 28 36 24 36 20C36 16 32 12 28 12" stroke="#6A008A" strokeWidth="2.5" strokeLinecap="round"/>
                  <circle cx="36" cy="34" r="8" fill="#6A008A"/>
                  <path d="M32 34L35 37L40 31" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Bottom Actions Row & Balance Outstanding */}
          <div className="flex items-center justify-between mt-0.5">
            <div className="flex items-center space-x-1.5">
              {/* Camera */}
              <button
                type="button"
                onClick={() => alert("Câmera ativada: tire uma foto para anexar à visita.")}
                className="w-7.5 h-7.5 rounded bg-[#8CC63F] hover:bg-[#7cb335] text-white flex items-center justify-center hover:opacity-95 active:scale-95 transition-all shadow-xs cursor-pointer"
                title="Tirar foto / Anexo"
              >
                <Camera size={14} className="stroke-[2.5]" />
              </button>

              {/* Visit Confirm Checkmark */}
              <button
                type="button"
                onClick={() => alert("Ficha do cliente registrada como visitada.")}
                className="w-7.5 h-7.5 rounded-full border border-gray-300 text-gray-500 hover:text-[#6B21A8] hover:border-[#6B21A8] flex items-center justify-center hover:bg-purple-50 active:scale-95 transition-all cursor-pointer"
                title="Registrar Visita"
              >
                <Check size={14} className="stroke-[3]" />
              </button>

              {/* Overdue/Status numeric badge */}
              <div
                className={`w-7.5 h-7.5 rounded flex items-center justify-center text-white font-extrabold text-xs ${
                  lateDays > 0 ? 'bg-red-500' : 'bg-[#16A34A]'
                }`}
              >
                {lateDays}
              </div>
            </div>

            {/* Valor de venda and Saldo devedor + Button 2 */}
            <div className="flex items-center space-x-3 text-right shrink-0">
              <div className="flex flex-col leading-none">
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">Valor de venda</span>
                <span className="text-xs font-black text-[#333333] mt-0.5">
                  ${(sale.amount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </span>
              </div>

              <div className="flex items-center space-x-1">
                <div className="flex flex-col leading-none">
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">Saldo devedor</span>
                  <span className="text-xs font-black text-[#333333] mt-0.5">
                    ${(sale.saldoPendienteCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </span>
                </div>
                {/* Button 2: Registrar Não Pagamento */}
                <button
                  onClick={() => onNavigate?.('register-payment', { saleId: sale.id, mode: 'no-payment' })}
                  className="flex items-center justify-center hover:bg-purple-50 rounded-lg transition-all active:scale-95 duration-150 p-0.5 cursor-pointer select-none shrink-0"
                  title="Registrar não pagamento"
                >
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="6" y="14" width="28" height="18" rx="2" transform="rotate(-10 6 14)" fill="#FAF5FF" stroke="#6A008A" strokeWidth="2.5"/>
                    <circle cx="20" cy="22" r="4" stroke="#6A008A" strokeWidth="2"/>
                    <path d="M28 28C32 28 36 24 36 20C36 16 32 12 28 12" stroke="#6A008A" strokeWidth="2.5" strokeLinecap="round"/>
                    <circle cx="36" cy="34" r="8" fill="#6A008A"/>
                    <path d="M33 31L39 37M39 31L33 37" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  // Fallback Admin/Supervisor detailed view
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
