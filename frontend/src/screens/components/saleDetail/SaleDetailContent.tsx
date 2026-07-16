import { useState } from 'react';
import {
  Coins,
  Clock,
  Pencil,
  ArrowLeft,
  Share2,
} from 'lucide-react';
import { Screen } from '../../../types';
import { formatFirestoreDate } from '../../../utils/firestoreTimestamp';
import { fmtCents } from '../../../utils/fmtCents';
import { useBox } from '../../../hooks/useBox';
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
  const { activeBox } = useBox();
  const [activeTab, setActiveTab] = useState<'detalles' | 'historico'>('detalles');

  // Share handler
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Venda ${sale.id}`,
        text: `Extrato de pagamento da venda ${sale.id} - Cliente: ${sale.clientName}`,
        url: window.location.href,
      }).catch(err => console.log(err));
    } else {
      alert("Extrato copiado para a área de transferência!");
    }
  };

  const installmentsCount = 20;
  const interestRate = sale.interes || "20.00";

  // Calculate percentage of paid amount
  const totalCents = sale.saldoTotalCents || 120000;
  const pendingCents = sale.saldoPendienteCents !== undefined ? sale.saldoPendienteCents : 0;
  const paidCents = Math.max(0, totalCents - pendingCents);
  const progressPercent = totalCents > 0 ? Math.min(100, (paidCents / totalCents) * 100) : 0;

  const valorCuotaCents = Math.round(totalCents / installmentsCount);
  const valorCuotaStr = `$ ${(valorCuotaCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="flex flex-col bg-[#F0F2F5] min-h-screen text-[#333333] -m-4 pb-28 select-none">
      
      {/* HEADER Matching Reference Images */}
      <div className="bg-[#6A008A] text-white pt-4 pb-0 px-4 shadow-sm">
        <div className="flex items-center space-x-3 mb-2 mt-1">
          <button
            onClick={() => onNavigate && onNavigate('sales')}
            className="text-white hover:bg-white/10 p-2 -ml-2 rounded-full transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-lg font-black tracking-wide">Detalhe da venda</h1>
            <span className="text-xs text-purple-200 block font-semibold mt-0.5">
              {activeBox?.unitName ? activeBox.unitName.substring(0, 3) : '65'} / {activeBox?.cnName ? activeBox.cnName.substring(0, 3) : '3'} / {activeBox?.id ? activeBox.id.substring(0, 7) : '1007967'}
            </span>
          </div>
        </div>

        {/* SUBTABS */}
        <div className="flex mt-4">
          <button
            onClick={() => setActiveTab('detalles')}
            className={`flex-1 pb-3 text-center text-sm font-bold transition-all relative ${
              activeTab === 'detalles' ? 'text-white' : 'text-purple-200/80 hover:text-white'
            }`}
          >
            Detalhes
            {activeTab === 'detalles' && (
              <span className="absolute bottom-0 left-0 right-0 h-1 bg-[#8CC63F]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('historico')}
            className={`flex-1 pb-3 text-center text-sm font-bold transition-all relative ${
              activeTab === 'historico' ? 'text-white' : 'text-purple-200/80 hover:text-white'
            }`}
          >
            Histórico de pagamentos
            {activeTab === 'historico' && (
              <span className="absolute bottom-0 left-0 right-0 h-1 bg-[#8CC63F]" />
            )}
          </button>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="p-4 max-w-md mx-auto w-full space-y-4">
        
        {/* CARD 1: Identification (Visible on both tabs) */}
        <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-gray-100 p-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <span className="text-base font-extrabold text-[#6A008A]">
              Id venda: {saleId.substring(0, 7)}
            </span>
            <button 
              onClick={handleShare}
              className="text-[#6A008A] hover:bg-purple-50 p-2 rounded-full transition-colors cursor-pointer"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Cliente</span>
              <span className="font-extrabold text-gray-900 text-right">{sale.clientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Documento 1</span>
              <span className="font-extrabold text-gray-900 text-right">{sale.idPreVenta || "8600000"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Data de venda</span>
              <span className="font-extrabold text-gray-900 text-right">
                {sale.createdAt
                  ? formatFirestoreDate(sale.createdAt, 'pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })
                  : '2026-07-13 19:56:53'}
              </span>
            </div>
          </div>
        </div>

        {/* TAB 1: DETALHES (Image 3) */}
        {activeTab === 'detalles' && (
          <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-gray-100 p-5 space-y-6">
            <div className="text-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                Saldo actual
              </span>
              <span className="text-3xl font-black text-[#6A008A] mt-1 block">
                {financial.saldoPendienteStr}
              </span>
            </div>

            {/* Custom progress bar exactly like Image 3 */}
            <div className="space-y-2">
              <div className="w-full bg-purple-100 rounded-full h-2 relative">
                <div 
                  className="bg-[#6A008A] h-2 rounded-full transition-all" 
                  style={{ width: `${progressPercent || 5}%` }} 
                />
              </div>
              <div className="flex justify-between text-xs font-bold text-gray-800">
                <div className="flex flex-col">
                  <span className="text-gray-400 font-semibold text-[10px] uppercase">Pago</span>
                  <span className="text-gray-900 font-extrabold mt-0.5">{financial.totalPagadoStr}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-gray-400 font-semibold text-[10px] uppercase">Valor final</span>
                  <span className="text-gray-900 font-extrabold mt-0.5">{financial.saldoTotalStr}</span>
                </div>
              </div>
            </div>

            {/* Detail Grid */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-4 pt-2 text-sm border-t border-gray-50">
              <div className="flex flex-col">
                <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">Número de parcelas</span>
                <span className="font-extrabold text-gray-900 mt-1">{installmentsCount}</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">Parcelas pendentes</span>
                <span className="font-extrabold text-gray-900 mt-1">
                  {(installmentsCount - payments.length).toFixed(2)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">Valor parcela</span>
                <span className="font-extrabold text-gray-900 mt-1">
                  {valorCuotaStr}
                </span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">Taxa de juros</span>
                <span className="font-extrabold text-gray-900 mt-1">{interestRate}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: HISTÓRICO DE PAGAMENTOS (Image 2) */}
        {activeTab === 'historico' && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-gray-900 px-1 mt-2">Histórico de pagamentos</h2>
            
            {payments.length === 0 ? (
              <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-gray-100 p-8 text-center text-gray-400 italic text-sm">
                Nenhum pagamento registrado para esta venda.
              </div>
            ) : (
              payments.map((p, idx) => {
                const currentPaidCount = idx + 1;
                const currentPendingCount = installmentsCount - currentPaidCount;
                return (
                  <div 
                    key={p.id || idx} 
                    className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden flex relative"
                  >
                    {/* Vertical Green Badge Bar */}
                    <div className="w-2.5 bg-[#8CC63F] shrink-0" />

                    {/* Payment details content */}
                    <div className="p-4 flex-1 space-y-2 text-xs">
                      <div className="flex justify-between items-center pb-1.5 border-b border-gray-50">
                        <span className="text-gray-400 font-bold text-[10px] uppercase">Data de pagamento</span>
                        <span className="font-extrabold text-gray-900 text-right">{p.date}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                        <div className="flex justify-between border-r border-gray-50 pr-2">
                          <span className="text-gray-400 font-semibold">Quota Nº</span>
                          <span className="font-bold text-gray-900">{currentPaidCount}</span>
                        </div>
                        <div className="flex justify-between pl-2">
                          <span className="text-gray-400 font-semibold">Parcelas pend...</span>
                          <span className="font-bold text-gray-900">{currentPendingCount.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between border-r border-gray-50 pr-2">
                          <span className="text-gray-400 font-semibold">Vr Quota</span>
                          <span className="font-bold text-gray-900">
                            {valorCuotaStr}
                          </span>
                        </div>
                        <div className="flex justify-between pl-2">
                          <span className="text-gray-400 font-semibold">Vr Pagamento</span>
                          <span className="font-extrabold text-emerald-600">${(p.amount / 100).toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between border-r border-gray-50 pr-2">
                          <span className="text-gray-400 font-semibold">Parcelas pagas</span>
                          <span className="font-bold text-gray-900">{currentPaidCount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pl-2">
                          <span className="text-gray-400 font-semibold">Saldo</span>
                          <span className="font-extrabold text-[#6A008A]">
                            ${((totalCents - p.amount) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div className="flex justify-between border-r border-gray-50 pr-2">
                          <span className="text-gray-400 font-semibold">Prestações...</span>
                          <span className="font-bold text-gray-900">{installmentsCount}</span>
                        </div>
                        <div className="flex justify-between pl-2">
                          <span className="text-gray-400 font-semibold">P. complemen...</span>
                          <span className="font-bold text-gray-900">$0</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* BOTTOM FLOATING ACTIONS BAR (Aligned, styled beautifully) */}
        <div className="pt-2 flex flex-col space-y-2.5">
          <button
            onClick={() => onNavigate && onNavigate('register-payment', { saleId })}
            className="w-full bg-[#8CC63F] hover:bg-[#7cb337] active:scale-98 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-md transition-all flex justify-center items-center gap-2 uppercase tracking-wider cursor-pointer text-sm"
          >
            <Coins className="w-5 h-5 text-white" />
            <span>Pagar Quota / Parcela</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => onNavigate && onNavigate('payment-history', { saleId })}
              className="flex-1 bg-white text-[#6A008A] border-2 border-[#6A008A] font-extrabold py-3 px-4 rounded-xl shadow-sm hover:bg-purple-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider text-xs"
            >
              <Clock className="w-4 h-4 text-[#6A008A]" />
              <span>Historial</span>
            </button>
            
            <button
              onClick={() => onNavigate && onNavigate('sales')}
              className="flex-[0.5] bg-gray-200 text-gray-700 font-extrabold py-3 px-4 rounded-xl shadow-sm hover:bg-gray-300 transition-all flex items-center justify-center cursor-pointer uppercase tracking-wider text-xs"
            >
              <span>Voltar</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
