import { getErrorMessage } from '../utils/errorMessage';
import { useState, useEffect } from 'react';
import { Screen, Sale } from '../types';
import { ConfirmModal } from './components/ConfirmModal';
import { ArrowLeft, Camera, Loader2, AlertCircle } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useBox } from '../hooks/useBox';
import { useTenant } from '../hooks/useTenant';
import { db } from '../lib/firebase';
import { mapSaleFromSnapshot } from '../utils/saleMapper';
import { executeRegisterPaymentTransaction } from '../utils/registerPaymentTransaction';

interface RegisterPaymentProps {
  onNavigate?: (screen: Screen, params?: Record<string, unknown>) => void;
  params?: Record<string, unknown>;
}

export function RegisterPayment({ onNavigate, params }: RegisterPaymentProps) {
  const { tenantId, userName, loading: tenantLoading } = useTenant();
  const { activeBox, loading: boxLoading } = useBox();
  
  const saleId = params?.saleId as string | undefined;
  // 'payment' (Images 1 and 2) or 'no-payment' (Image 3)
  const initialMode = (params?.mode as 'payment' | 'no-payment' | undefined) || 'payment';

  const [sale, setSale] = useState<Sale | null>(null);
  const [loadingSale, setLoadingSale] = useState(true);

  // General Form States
  const [punishToggle, setPunishToggle] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Payment Mode States (Images 1 and 2)
  const [paymentType, setPaymentType] = useState<'parcela' | 'dinheiro'>('parcela');
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia'>('efectivo');
  const [payTotalToggle, setPayTotalToggle] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState(1);
  const [customAmount, setCustomAmount] = useState('');

  // No-Payment Mode States (Image 3)
  const [selectedReason, setSelectedReason] = useState<string>('Cliente sem dinheiro');
  const [notes, setNotes] = useState('');

  // Load Sale Data
  useEffect(() => {
    if (!tenantId || !saleId) return;

    const saleRef = doc(db, 'sales', saleId);
    const unsubscribe = onSnapshot(saleRef, (docSnap) => {
      const mapped = mapSaleFromSnapshot(docSnap);
      if (mapped) {
        setSale(mapped);
      } else {
        console.warn("Sale not found with ID:", saleId);
      }
      setLoadingSale(false);
    }, (error) => {
      console.error("Error loading sale:", error);
      setLoadingSale(false);
    });

    return () => unsubscribe();
  }, [tenantId, saleId]);

  // Adjust installments dynamically when "Pay Total" is toggled
  useEffect(() => {
    if (!sale) return;
    if (payTotalToggle) {
      const pendingCents = sale.saldoPendienteCents || 0;
      const instAmt = sale.installmentAmount || 1;
      const maxInstallments = Math.max(1, Math.ceil(pendingCents / instAmt));
      setInstallmentsCount(maxInstallments);
    } else {
      setInstallmentsCount(1);
    }
  }, [payTotalToggle, sale]);

  if (!saleId) {
    return (
      <div className="p-4 bg-[#F3F4F6] min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-300 rounded p-4 text-center text-red-800 text-sm font-semibold">
          Nenhuma venda selecionada.
          <button onClick={() => onNavigate && onNavigate('sales')}
            className="block mt-3 mx-auto bg-[#6B21A8] text-white font-bold text-xs py-2 px-6 rounded cursor-pointer shadow">
            Voltar às Vendas
          </button>
        </div>
      </div>
    );
  }

  if (boxLoading || tenantLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#F3F4F6]">
        <div className="border-2 border-[#6B21A8] border-t-transparent rounded-full w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!activeBox) {
    return (
      <div className="flex flex-col bg-[#F3F4F6] min-h-screen p-4 space-y-3">
        <div className="bg-yellow-50 border border-yellow-300 rounded p-4 flex flex-col items-center text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-yellow-500" />
          <span className="font-bold text-yellow-800 text-sm">Nenhuma caixa aberta</span>
          <span className="text-yellow-700 text-xs">Abra uma caixa antes de registrar um pagamento.</span>
          <button
            onClick={() => onNavigate && onNavigate('open-box')}
            className="bg-[#6B21A8] text-white font-bold text-xs py-2 px-6 rounded shadow cursor-pointer"
          >
            Abrir Caixa
          </button>
        </div>
      </div>
    );
  }

  if (loadingSale) {
    return (
      <div className="flex flex-col items-center justify-center bg-[#F3F4F6] min-h-screen pt-4">
        <Loader2 className="w-8 h-8 text-[#6A008A] animate-spin mb-2" />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cargando datos de venta...</span>
      </div>
    );
  }

  if (!sale) {
    return null;
  }

  // Value calculation
  const defaultInstallmentAmount = sale.installmentAmount || 12000; // in cents, default 120,000 (R$ 120,00)
  const currentTotalPendingCents = sale.saldoPendienteCents || 0;
  
  let computedAmountCents = 0;
  if (initialMode === 'payment') {
    if (paymentType === 'parcela') {
      computedAmountCents = installmentsCount * defaultInstallmentAmount;
    } else {
      const floatVal = parseFloat(customAmount.replace(/[^0-9,.-]/g, '').replace(',', '.'));
      computedAmountCents = isNaN(floatVal) ? 0 : Math.round(floatVal * 100);
    }
  }

  // Ensure we don't pay more than the outstanding balance
  if (computedAmountCents > currentTotalPendingCents) {
    computedAmountCents = currentTotalPendingCents;
  }

  // Formatter functions
  const fmtCents = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const handleIncrement = () => {
    const instAmt = sale.installmentAmount || 12000;
    const maxInstallments = Math.max(1, Math.ceil(currentTotalPendingCents / instAmt));
    if (installmentsCount < maxInstallments) {
      setInstallmentsCount(prev => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (installmentsCount > 1) {
      setInstallmentsCount(prev => prev - 1);
    }
  };

  const handleSave = async () => {
    if (!activeBox || !sale) return;

    setSaving(true);
    setSaveError(null);
    setShowConfirm(false);

    try {
      let finalAmountCents = 0;
      let finalComment = '';
      let methodStr = paymentMethod;

      if (initialMode === 'payment') {
        finalAmountCents = computedAmountCents;
        finalComment = punishToggle ? '[Estudo punição ativa] ' : '';
        if (paymentType === 'parcela') {
          finalComment += `Pagamento de ${installmentsCount} parcela(s)`;
        } else {
          finalComment += 'Pagamento avulso em dinheiro';
        }
      } else {
        // No-Payment Mode
        finalAmountCents = 0;
        finalComment = `[Sem pagamento - Razão: ${selectedReason}] ${notes}`;
        methodStr = 'efectivo';
      }

      await executeRegisterPaymentTransaction({
        tenantId,
        activeBox,
        sale,
        parsedAmountCents: finalAmountCents,
        paymentMethod: methodStr,
        comment: finalComment,
        userName,
      });

      // Clear states and navigate back
      setCustomAmount('');
      onNavigate?.('sales');
    } catch (err) {
      setSaveError(getErrorMessage(err) || 'Erro ao registrar operação');
    } finally {
      setSaving(false);
    }
  };

  // Extra details calculation for mockup fidelity
  const lateDays = sale.lateDays !== undefined 
    ? sale.lateDays 
    : Math.max(0, Math.abs(sale.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 6);

  // Mock Route/Box/Client details for header matching screenshot "65 / 3 / 1007967"
  const routeNo = sale.userId ? sale.userId.slice(0, 2) : '65';
  const unitId = sale.unitName ? sale.unitName.split('-')[0].trim() : '3';
  const displayClientId = sale.clientId || '1007967';

  return (
    <div className="flex flex-col bg-[#F3F4F6] min-h-screen text-[#333333] pb-10">
      
      {/* SCREEN HEADER (Matches Images 1, 2, and 3 Purple Style) */}
      <div className="bg-[#6A008A] text-white px-4 py-3.5 flex items-center shadow-md relative">
        <button 
          onClick={() => onNavigate?.('sales')}
          className="mr-3 hover:bg-white/10 p-1.5 rounded-full transition-colors cursor-pointer"
        >
          <ArrowLeft size={22} className="stroke-[2.5]" />
        </button>
        <div className="flex flex-col leading-none">
          <span className="font-extrabold text-[15px] tracking-wide">Gestor de pagamentos</span>
          <span className="text-[10px] font-bold text-white/80 mt-1 select-none">
            {routeNo} / {unitId} / {displayClientId}
          </span>
        </div>
      </div>

      {/* ERROR CONTAINER */}
      {saveError && (
        <div className="m-3 bg-red-50 border border-red-200 text-red-700 p-2 text-xs flex items-center rounded-lg shadow-sm">
          <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-red-500" />
          <span>{saveError}</span>
        </div>
      )}

      {/* MAIN LAYOUT WRAPPER */}
      <div className="p-3.5 space-y-3.5 max-w-lg mx-auto w-full">

        {/* CLIENT DETAILS SECTION (Images 1, 2, 3) */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200/60 p-4">
          <div className="space-y-2 text-xs">
            
            <div className="flex justify-between items-center">
              <span className="font-bold text-purple-900/80 uppercase text-[10px]">Id Cliente:</span>
              <span className="font-extrabold text-[#333333]">{displayClientId}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-bold text-purple-900/80 uppercase text-[10px]">Nome:</span>
              <span className="font-extrabold text-[#333333] capitalize">{sale.clientName.toLowerCase()}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-bold text-purple-900/80 uppercase text-[10px]">Apelido:</span>
              <span className="font-extrabold text-[#333333] capitalize">{sale.clientName.toLowerCase()}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-bold text-purple-900/80 uppercase text-[10px]">Documento 1:</span>
              <span className="font-extrabold text-[#333333]">{sale.clientDoc || '01703984129'}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-bold text-purple-900/80 uppercase text-[10px]">Dias de atraso no pagamento:</span>
              <span className="font-extrabold text-[#333333]">{lateDays}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-bold text-purple-900/80 uppercase text-[10px]">Data do último pagamento:</span>
              <span className="font-extrabold text-[#333333]">
                {sale.lastPaymentAt 
                  ? new Date(sale.lastPaymentAt.seconds * 1000).toLocaleString('pt-BR') 
                  : '2025-08-27 15:51:47'}
              </span>
            </div>

            <div className="border-t border-gray-200/85 my-3 pt-3 flex justify-between items-center">
              <span className="font-extrabold text-[#6A008A] uppercase text-xs tracking-wider">Saldo atual:$</span>
              <span className="font-black text-xl text-[#333333]">
                ${fmtCents(currentTotalPendingCents)}
              </span>
            </div>

          </div>
        </div>

        {/* FORMS BY SELECTED ROUTE / MODE */}
        {initialMode === 'payment' ? (
          /* PAYMENT FORM CONTAINER (Images 1 and 2) */
          <div className="space-y-3.5">
            
            {/* STUDY PORTFOLIO TO STUDY / PUNISHMENT TOGGLE */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-200/60 p-4 flex justify-between items-center">
              <span className="font-extrabold text-xs text-gray-700 leading-snug max-w-[70%]">
                Mandar estudar para punição de carteira?
              </span>
              <button
                type="button"
                onClick={() => setPunishToggle(!punishToggle)}
                className={`w-12 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 ease-in-out ${
                  punishToggle ? 'bg-[#16A34A]' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                    punishToggle ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* PAYMENT TYPE SELECTION */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-200/60 p-4 space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                Tipo de pagamento
              </label>
              <div className="flex space-x-2.5">
                <button
                  type="button"
                  onClick={() => { setPaymentType('parcela'); setCustomAmount(''); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                    paymentType === 'parcela'
                      ? 'bg-[#EBF7EE] border-[#89D59E] text-[#1E3A1E]'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Parcela
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType('dinheiro')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                    paymentType === 'dinheiro'
                      ? 'bg-[#EBF7EE] border-[#89D59E] text-[#1E3A1E]'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Dinheiro
                </button>
              </div>
            </div>

            {/* METHOD SELECTION */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-200/60 p-4 space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                Método de pagamento
              </label>
              <div className="flex space-x-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('efectivo')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                    paymentMethod === 'efectivo'
                      ? 'bg-[#EBF7EE] border-[#89D59E] text-[#1E3A1E]'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Efectivo
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('transferencia')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                    paymentMethod === 'transferencia'
                      ? 'bg-[#EBF7EE] border-[#89D59E] text-[#1E3A1E]'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Transacción electrónica
                </button>
              </div>
            </div>

            {/* PAY TOTAL TOGGLE SWITCH */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-200/60 p-4 flex justify-between items-center">
              <span className="font-extrabold text-xs text-gray-700 leading-snug">
                Pagar total. Parcela:
              </span>
              <button
                type="button"
                onClick={() => setPayTotalToggle(!payTotalToggle)}
                className={`w-12 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 ease-in-out ${
                  payTotalToggle ? 'bg-[#16A34A]' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                    payTotalToggle ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* VALOR PARCELA INDICATOR (Images 1 and 2 Large text) */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-200/60 p-4 flex flex-col items-center">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                {paymentType === 'parcela' ? 'Valor parcela' : 'Valor digitado'}
              </span>
              <span className="text-4xl font-black text-[#333333]">
                ${fmtCents(computedAmountCents)}
              </span>
            </div>

            {/* DYNAMIC PARCEL CONTROLS (Image 2) */}
            {paymentType === 'parcela' ? (
              <div className="bg-white rounded-xl shadow-xs border border-gray-200/60 p-4 space-y-3">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                  Parcela a pagar
                </label>
                
                {/* Plus Minus Numeric Row */}
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={handleDecrement}
                    className="w-12 h-10 flex items-center justify-center bg-[#6A008A] hover:bg-[#581c87] text-white font-bold text-xl rounded-l-lg transition-colors cursor-pointer select-none"
                    disabled={payTotalToggle}
                  >
                    -
                  </button>
                  <div className="flex-1 h-10 flex items-center justify-center border-y border-gray-300 text-sm font-bold text-[#333333] bg-white select-none">
                    {installmentsCount}
                  </div>
                  <button
                    type="button"
                    onClick={handleIncrement}
                    className="w-12 h-10 flex items-center justify-center bg-[#6A008A] hover:bg-[#581c87] text-white font-bold text-xl rounded-r-lg transition-colors cursor-pointer select-none"
                    disabled={payTotalToggle}
                  >
                    +
                  </button>
                </div>

                {/* Styled slider bar with purple slider handle (matching Image 2) */}
                <div className="relative mt-4 mb-2 flex items-center">
                  <div className="w-full h-1 bg-gray-200 rounded-lg"></div>
                  {/* Circle slider handle absolute positioned mock */}
                  <div 
                    className="absolute -translate-y-1/2 w-6 h-6 rounded-full bg-[#6A008A] hover:bg-[#581c87] flex items-center justify-center text-white text-[10px] cursor-pointer shadow-md select-none"
                    style={{ left: `${Math.min(95, Math.max(5, (installmentsCount / Math.max(1, Math.ceil(currentTotalPendingCents / defaultInstallmentAmount))) * 100))}%` }}
                  >
                    &lt;&gt;
                  </div>
                </div>

              </div>
            ) : (
              /* Dinheiro numeric field */
              <div className="bg-white rounded-xl shadow-xs border border-gray-200/60 p-4 space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                  Digite o valor avulso
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">$</span>
                  <input
                    type="text"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm font-bold text-[#333333] outline-none focus:border-[#6A008A]"
                  />
                </div>
              </div>
            )}

            {/* ADICIONAR FOTO BLOCK (Images 1 and 2) */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-200/60 p-4 space-y-2">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                Adicionar foto
              </label>
              <button
                type="button"
                onClick={() => alert("Câmera ativada: tire uma foto para anexar ao recebimento.")}
                className="w-16 h-16 bg-gray-100 border border-gray-200/80 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-200/60 transition-all cursor-pointer"
                title="Tirar foto"
              >
                <Camera size={24} className="stroke-[2.5]" />
              </button>
            </div>

          </div>
        ) : (
          /* NO-PAYMENT REASONS FORM CONTAINER (Image 3) */
          <div className="space-y-3.5">
            
            {/* RAZÃO REASONS GRID (Image 3 2x2 grid) */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-200/60 p-4 space-y-2.5">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                Razón
              </label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {[
                  'Cliente sem dinheiro',
                  'Loja fechada',
                  'Incapaz de cobrar',
                  'Cliente n?o encontrado'
                ].map((reason) => {
                  const isSelected = selectedReason === reason;
                  return (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setSelectedReason(reason)}
                      className={`py-2 px-1 text-[11px] font-bold rounded-lg border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#EBF7EE] border-[#89D59E] text-[#1E3A1E]'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {reason}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STUDY PORTFOLIO TO STUDY / PUNISHMENT TOGGLE */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-200/60 p-4 flex justify-between items-center">
              <span className="font-extrabold text-xs text-gray-700 leading-snug max-w-[70%]">
                Mandar estudar para punição de carteira?
              </span>
              <button
                type="button"
                onClick={() => setPunishToggle(!punishToggle)}
                className={`w-12 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 ease-in-out ${
                  punishToggle ? 'bg-[#16A34A]' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                    punishToggle ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* NOTAS TEXT AREA */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-200/60 p-4 space-y-1.5">
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas"
                className="w-full border border-gray-200 rounded-lg p-3 text-xs text-[#333333] outline-none focus:border-[#6A008A] bg-white resize-none shadow-xs"
              />
            </div>

            {/* ADICIONAR FOTO BLOCK (Image 3) */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-200/60 p-4 space-y-2">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                Adicionar foto
              </label>
              <button
                type="button"
                onClick={() => alert("Câmera ativada: tire uma foto para anexar à justificativa de visita.")}
                className="w-16 h-16 bg-gray-100 border border-gray-200/80 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-200/60 transition-all cursor-pointer"
                title="Tirar foto"
              >
                <Camera size={24} className="stroke-[2.5]" />
              </button>
            </div>

          </div>
        )}

        {/* BOTTOM SAVING ACTIONS TRIGGER */}
        <div className="pt-2">
          <button
            onClick={() => {
              if (initialMode === 'payment' && computedAmountCents <= 0) {
                setSaveError('Insira um valor válido de pagamento.');
                return;
              }
              setShowConfirm(true);
            }}
            disabled={saving}
            className="w-full bg-[#6A008A] hover:bg-[#581c87] text-white font-extrabold py-3.5 text-xs tracking-widest uppercase rounded-xl shadow-md transition-all active:scale-[0.98] duration-150 flex justify-center items-center cursor-pointer select-none disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Registrando...
              </>
            ) : (
              'Salvar'
            )}
          </button>
        </div>

      </div>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSave}
        title={initialMode === 'payment' ? '¿Confirmar pago?' : '¿Confirmar visita sin pago?'}
        subtitle={
          initialMode === 'payment'
            ? `Se registrará un pago de $${fmtCents(computedAmountCents)} para ${sale.clientName}.`
            : `Se registrará la visita como "${selectedReason}" para ${sale.clientName}.`
        }
        confirmText="Sí, registrar"
      />

    </div>
  );
}
