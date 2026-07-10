import { getErrorMessage } from '../utils/errorMessage';
import { useState, useEffect } from 'react';
import type { HtmlInputChangeEvent } from '../types/reactEvents';
import { Screen, Sale } from '../types';
import { ConfirmModal } from './components/ConfirmModal';
import { Save, X, Loader2, AlertCircle } from 'lucide-react';
import { formatCurrencyBRL, parseCurrencyBRLToFloat, autocompleteCurrencyBRL, parseCurrencyBRLToCents } from '../utils/currency';
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

  const [sale, setSale] = useState<Sale | null>(null);
  const [loadingSale, setLoadingSale] = useState(true);

  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('efectivo');
  const [comment, setComment] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId || !saleId) return;

    const saleRef = doc(db, 'sales', saleId);
    const unsubscribe = onSnapshot(saleRef, (docSnap) => {
      const mapped = mapSaleFromSnapshot(docSnap);
      if (mapped) {
        setSale(mapped);
      } else {
        console.warn("Sale not found in RegisterPayment with ID:", saleId);
      }
      setLoadingSale(false);
    }, (error) => {
      console.error("Error loading sale in RegisterPayment:", error);
      setLoadingSale(false);
    });

    return () => unsubscribe();
  }, [tenantId, saleId]);

  // Guard for missing saleId (moved below hooks)
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

  const currentTotalPendingCents = sale.saldoPendienteCents !== undefined 
    ? sale.saldoPendienteCents 
    : parseCurrencyBRLToCents(sale.saldoPendiente);

  const currentTotalPending = currentTotalPendingCents / 100;

  const handleAmountChange = (e: HtmlInputChangeEvent) => {
    setAmount(formatCurrencyBRL(e.target.value));
  };

  const parsedAmount = parseCurrencyBRLToFloat(amount);
  const parsedAmountCents = Math.round(parsedAmount * 100);
  const newBalance = Math.max(0, currentTotalPending - parsedAmount);
  const handleSavePayment = async () => {
    if (!activeBox || !sale) return;
    if (!parsedAmountCents || parsedAmountCents <= 0) {
      setSaveError('Valor inválido');
      return;
    }

    setSaving(true);
    setSaveError(null);
    setShowConfirm(false);

    try {
      await executeRegisterPaymentTransaction({
        tenantId,
        activeBox,
        sale,
        parsedAmountCents,
        paymentMethod,
        comment,
        userName,
      });
      setAmount('');
      onNavigate?.('sale-detail', { saleId: sale.id });
    } catch (err) {
      setSaveError(getErrorMessage(err) || 'Erro ao registrar pagamento');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col bg-[#F3F4F6] min-h-screen text-[#333333] pt-2 pb-6 px-2 space-y-2">
      
      {/* Return Button placeholder */}
      <div className="bg-[#E5E7EB] px-2 py-1.5 flex items-center text-[10px] font-bold text-[#555555] border-b border-gray-300 -mt-2 -mx-2 mb-1">
        <button onClick={() => onNavigate && onNavigate('sale-detail', { saleId })} className="uppercase hover:underline cursor-pointer">&lt; Volver a Detalle</button>
      </div>

      {saveError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-2 text-xs flex items-center rounded-sm shadow-sm">
          <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-red-500" />
          <span>{saveError}</span>
        </div>
      )}

      {/* RESUMEN DEL CLIENTE */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm p-3 text-xs">
        <div className="flex justify-between items-start mb-2 border-b border-gray-200 pb-1.5">
          <div>
            <div className="flex items-center">
              <span className="font-bold text-[#333333] text-sm uppercase">{sale.clientName}</span>
            </div>
            <div className="text-[10px] text-[#777777] mt-0.5">
              <span>ID Clt: <span className="font-bold text-[#333333]">{sale.idPreVenta || sale.id}</span></span>
              <span className="mx-1">|</span>
              <span>ID Ven: <span className="font-bold text-[#333333]">{sale.id}</span></span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-[#777777] block">Caja Vinculada</span>
            <span className="font-bold text-purple-700">{activeBox ? (activeBox.userName || 'Caja Abierta') : 'Ninguna'}</span>
          </div>
        </div>
        <div className="flex justify-between items-center bg-gray-50 border border-gray-100 p-2 rounded-sm">
          <span className="font-bold text-[#555555] uppercase text-[10px]">Saldo Pendiente</span>
          <span className="font-bold text-[#EA580C] text-sm">$ {currentTotalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* FORMULARIO */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-sm p-3">
        <div className="space-y-3">
          
          <div>
            <label className="block text-[11px] font-bold text-[#555555] mb-1">Valor Recibido *</label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">$</span>
              <input 
                type="text" 
                value={amount}
                onChange={handleAmountChange}
                onBlur={(e) => {
                  const autocompleted = autocompleteCurrencyBRL(e.target.value);
                  if (autocompleted) setAmount(autocompleted);
                }}
                className="w-full border border-gray-300 rounded-sm pl-8 pr-2.5 py-2 text-sm font-bold text-[#333333] outline-none focus:border-[#6B21A8]"
                placeholder="0,00"
                disabled={saving}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#555555] mb-1">Fecha *</label>
            <input 
              type="date" 
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full border border-gray-300 rounded-sm px-2.5 py-2 text-sm font-bold text-[#333333] outline-none focus:border-[#6B21A8]"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#555555] mb-1">Forma de Pago *</label>
            <select 
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full border border-gray-300 rounded-sm px-2.5 py-2 text-sm font-bold text-[#333333] outline-none focus:border-[#6B21A8] bg-white appearance-none"
              disabled={saving}
            >
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="nequi">Nequi</option>
              <option value="daviplata">Daviplata</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#555555] mb-1">Observación</label>
            <textarea 
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs text-[#333333] outline-none focus:border-[#6B21A8]"
              placeholder="Opcional..."
              disabled={saving}
            ></textarea>
          </div>

        </div>
      </div>

      {/* RESUMEN AUTOMÁTICO */}
      <div className="bg-[#F8FAFC] border border-blue-200 shadow-sm rounded-sm p-3 text-xs">
        <h3 className="font-bold text-[#2563EB] border-b border-blue-200 pb-1 mb-2 uppercase text-[10px] tracking-wider">Proyección de Saldo</h3>
        <div className="flex justify-between items-center mb-1">
          <span className="text-[#555555]">Saldo Antes</span>
          <span className="font-semibold text-[#333333]">$ {currentTotalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-[#555555]">Valor Pagado</span>
          <span className="font-semibold text-[#16A34A]">- $ {parsedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between items-center border-t border-blue-100 pt-1 mt-1">
          <span className="font-bold text-[#333333]">Saldo Después</span>
          <span className="font-bold text-[#2563EB]">$ {newBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* BOTONES */}
      <div className="pt-2 flex flex-col space-y-2">
        <button 
          onClick={() => setShowConfirm(true)}
          className="w-full bg-[#16A34A] hover:bg-[#15803d] text-white font-bold py-2.5 text-sm flex justify-center items-center rounded-sm shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              REGISTRANDO...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-1.5" />
              GUARDAR PAGO
            </>
          )}
        </button>
        <button 
          onClick={() => onNavigate && onNavigate('sale-detail', { saleId })}
          className="w-full bg-[#F3F4F6] text-[#333333] border border-gray-300 font-bold py-2.5 text-sm flex justify-center items-center rounded-sm shadow-sm hover:bg-gray-100 transition-colors cursor-pointer"
          disabled={saving}
        >
          <X className="w-4 h-4 mr-1.5" />
          Cancelar
        </button>
      </div>

      <ConfirmModal 
        isOpen={showConfirm} 
        onClose={() => setShowConfirm(false)} 
        onConfirm={handleSavePayment}
        title="¿Confirmar pago?"
        subtitle={`Se registrará un pago de $ ${parsedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
        confirmText="Sí registrar"
      />

    </div>
  );
}
