import { getErrorMessage } from '../utils/errorMessage';
import { useState } from 'react';
import { Screen } from '../types';
import { ConfirmModal } from './components/ConfirmModal';
import { UnitSelectors } from './components/UnitSelectors';
import { useBox } from '../hooks/useBox';
import { ArrowLeft, Share2, Calculator, Check, Copy, AlertTriangle } from 'lucide-react';

interface CloseBoxProps {
  onNavigate?: (screen: Screen) => void;
}

export function CloseBox({ onNavigate }: CloseBoxProps) {
  const { activeBox, loading, error, closeBox } = useBox();
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [enteredValue, setEnteredValue] = useState('');

  const fmtUSD = (cents: number) => 
    (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    };
    let dStr = new Date().toLocaleDateString('pt-BR', options);
    // Format "ter., 14 de julho de 2026" to "ter. 14 de julho 2026"
    dStr = dStr.replace(',', '.');
    dStr = dStr.replace(' de 2', ' 2'); // remove ' de' before year
    return dStr;
  };

  const handleConfirmClose = async () => {
    setShowConfirm(false);
    setSubmitting(true);
    setSubmitError(null);
    try {
      await closeBox();
      if (onNavigate) {
        onNavigate('box-summary');
      }
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12 bg-slate-50 min-h-screen">
        <div className="border-2 border-[#6A008A] border-t-transparent rounded-full w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error && !activeBox) {
    return (
      <div className="flex flex-col bg-slate-50 min-h-screen text-[#333333]">
        <UnitSelectors />
        <div className="px-3 pt-3 pb-6">
          <div className="bg-red-50 border border-red-300 rounded-sm p-4 text-xs flex flex-col items-center text-center space-y-2 shadow-sm">
            <span className="font-bold text-red-800 text-sm">Erro ao verificar caixa aberta</span>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!activeBox) {
    return (
      <div className="flex flex-col bg-slate-50 min-h-screen text-[#333333]">
        <UnitSelectors />
        <div className="px-3 pt-3 pb-6 flex flex-col space-y-3">
          <div className="bg-yellow-50 border border-yellow-300 rounded-sm p-4 text-xs flex flex-col items-center text-center space-y-2 shadow-sm">
            <span className="font-bold text-yellow-800 text-sm">Nenhuma caixa aberta encontrada</span>
            <span className="text-yellow-600">Por favor, abra uma caixa antes de tentar fechá-la.</span>
          </div>
          <button 
            onClick={() => onNavigate && onNavigate('open-box')}
            className="w-full bg-[#6A008A] text-white font-bold py-3 text-sm flex justify-center items-center rounded-xl shadow-sm hover:bg-[#52006A] transition-all"
          >
            Abrir Caixa
          </button>
        </div>
      </div>
    );
  }

  // Calculate dynamic totals
  const cajaFinal = activeBox.initialAmount + activeBox.totalCollections + activeBox.totalIncomes - activeBox.totalExpenses - activeBox.totalSales - activeBox.totalTransfers;

  return (
    <div className="flex flex-col bg-slate-50 min-h-screen text-[#333333] select-none pb-12">
      
      {/* 1. Header (Purple Banner) */}
      <div className="bg-[#6A008A] pt-4 pb-4 px-4 text-white flex flex-col relative shrink-0 shadow-md">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => onNavigate && onNavigate('dashboard')}
            className="p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div className="flex flex-col items-center text-center">
            <span className="text-white font-black text-lg tracking-tight uppercase">Fechamento de caixa</span>
            <span className="text-white/85 text-[11px] font-bold tracking-wider mt-0.5">
              {activeBox.unitName ? activeBox.unitName.substring(0, 3) : '65'} / {activeBox.cnName ? activeBox.cnName.substring(0, 3) : '3'} / {activeBox.id ? activeBox.id.substring(0, 7) : '1007967'}
            </span>
          </div>
          <button className="p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
            <Share2 className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full px-4 pt-4 flex flex-col space-y-4">
        
        {/* Date Section */}
        <div className="text-center py-1">
          <span className="text-[#6A008A] font-bold text-sm tracking-wide lowercase">
            {getFormattedDate()}
          </span>
        </div>

        {/* 2. "caixa atual" Card */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-[#6A008A] shrink-0">
              <Calculator className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 uppercase tracking-wide leading-none">caixa atual</p>
              <div className="flex items-center space-x-1.5 mt-1.5">
                <Copy className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors shrink-0" />
                <span className="text-xl font-extrabold text-slate-900 tracking-tight">${fmtUSD(cajaFinal)}</span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2 text-right">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider leading-none">caixa inicial</p>
            <p className="text-[11px] font-extrabold text-emerald-700 tracking-tight mt-1">${fmtUSD(activeBox.initialAmount)}</p>
          </div>
        </div>

        {/* 3. Metrics Grid (2 columns with bullets) */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 px-1 py-1">
          {/* Column 1 */}
          <div className="flex flex-col space-y-4">
            <div className="relative pl-4.5">
              <span className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-[#6A008A]" />
              <p className="text-xs font-black text-slate-800 leading-none">Renda / Complementar</p>
              <p className="text-sm font-extrabold text-slate-900 mt-1">${fmtUSD(activeBox.totalIncomes)}</p>
            </div>

            <div className="relative pl-4.5">
              <span className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-[#6A008A]" />
              <p className="text-xs font-black text-slate-800 leading-none">Transferências CN -&gt; UGI</p>
              <p className="text-sm font-extrabold text-slate-900 mt-1">$0</p>
            </div>

            <div className="relative pl-4.5">
              <span className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-[#6A008A]" />
              <p className="text-xs font-black text-slate-800 leading-none">Coleção Dinheiro</p>
              <p className="text-sm font-extrabold text-slate-900 mt-1">${fmtUSD(activeBox.totalCollections)}</p>
            </div>

            <div className="relative pl-4.5">
              <span className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-[#6A008A]" />
              <p className="text-xs font-black text-slate-800 leading-none">Coleção extra total</p>
              <p className="text-sm font-extrabold text-slate-900 mt-1">$60</p>
            </div>

            <div className="relative pl-4.5">
              <span className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-[#6A008A]" />
              <p className="text-xs font-black text-slate-800 leading-none">Vendas novas</p>
              <p className="text-sm font-extrabold text-slate-900 mt-1">
                ${fmtUSD(activeBox.totalSales)} / {activeBox.totalSales > 0 ? '1' : '0'}
              </p>
            </div>
          </div>

          {/* Column 2 */}
          <div className="flex flex-col space-y-4">
            <div className="relative pl-4.5">
              <span className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-[#6A008A]" />
              <p className="text-xs font-black text-slate-800 leading-none">Despesas</p>
              <p className="text-sm font-extrabold text-slate-900 mt-1">${fmtUSD(activeBox.totalExpenses)}</p>
            </div>

            <div className="relative pl-4.5">
              <span className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-[#6A008A]" />
              <p className="text-xs font-black text-slate-800 leading-none">Transferências UGI -&gt; CN</p>
              <p className="text-sm font-extrabold text-slate-900 mt-1">$0</p>
            </div>

            <div className="relative pl-4.5">
              <span className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-[#6A008A]" />
              <p className="text-xs font-black text-slate-800 leading-none">Coleção Transação eletrônica</p>
              <p className="text-sm font-extrabold text-slate-900 mt-1">$0</p>
            </div>

            <div className="relative pl-4.5">
              <span className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-[#6A008A]" />
              <p className="text-xs font-black text-slate-800 leading-none">Coletado total</p>
              <p className="text-sm font-extrabold text-slate-900 mt-1">${fmtUSD(activeBox.totalCollections)}</p>
            </div>
          </div>
        </div>

        {/* 4. Progress Bars */}
        <div className="flex flex-col space-y-4 pt-2">
          {/* Bar 1: Coleção */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-black text-slate-800">
              <span>Coleção</span>
              <span>0%</span>
            </div>
            <div className="w-full bg-purple-100 rounded-full h-2">
              <div className="bg-[#6A008A] h-2 rounded-full" style={{ width: '0%' }} />
            </div>
          </div>

          {/* Bar 2: Clientes visitados */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-black text-slate-800">
              <span>Clientes visitados</span>
              <span>2 de 75</span>
            </div>
            <div className="w-full bg-purple-100 rounded-full h-2">
              <div className="bg-[#6A008A] h-2 rounded-full" style={{ width: '2.66%' }} />
            </div>
          </div>
        </div>

        {/* 5. Bottom Info Badges */}
        <div className="grid grid-cols-3 gap-2 pt-3 text-center">
          <div className="bg-slate-100/60 border border-slate-100 rounded-xl p-2">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-tight leading-tight">pré-venda a aprovar</p>
            <p className="text-sm font-black text-slate-800 mt-1.5">0</p>
          </div>
          <div className="bg-slate-100/60 border border-slate-100 rounded-xl p-2">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-tight leading-tight">Pré-despesas a aprovar</p>
            <p className="text-sm font-black text-slate-800 mt-1.5">0</p>
          </div>
          <div className="bg-slate-100/60 border border-slate-100 rounded-xl p-2">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-tight leading-tight">Transferencia por aprobar</p>
            <p className="text-sm font-black text-slate-800 mt-1.5">0</p>
          </div>
        </div>

        {/* 6. Text input */}
        <div className="pt-2 relative">
          <input 
            type="text" 
            id="closing-value-input"
            value={enteredValue}
            onChange={(e) => setEnteredValue(e.target.value)}
            className="peer w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#6A008A] transition-colors placeholder-transparent"
            placeholder="Valor"
          />
          <label 
            htmlFor="closing-value-input"
            className="absolute left-4 -top-2 px-1 bg-white text-[10px] font-bold text-slate-400 peer-focus:text-[#6A008A] transition-all"
          >
            Valor*
          </label>
        </div>

        {/* Error message if any */}
        {submitError && (
          <div className="bg-red-50 border border-red-300 rounded-xl p-3 text-xs text-red-800 font-semibold shadow-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* 7. Action Button */}
        <div className="pt-3">
          <button 
            onClick={() => setShowConfirm(true)}
            disabled={submitting}
            className="w-full bg-[#6A008A] text-white font-black py-4.5 text-sm rounded-2xl shadow-md hover:bg-[#52006A] active:scale-95 transition-all flex justify-center items-center cursor-pointer uppercase tracking-wider"
          >
            {submitting ? (
              <div className="border-2 border-white border-t-transparent rounded-full w-5 h-5 animate-spin mr-2" />
            ) : (
              <Check className="w-5 h-5 mr-2 stroke-[3]" />
            )}
            Fechar a caixa
          </button>
        </div>

      </div>

      <ConfirmModal 
        isOpen={showConfirm} 
        onClose={() => setShowConfirm(false)} 
        onConfirm={handleConfirmClose}
        title="¿Confirmar cierre de caja?"
        subtitle={`Monto final: $ ${fmtUSD(cajaFinal)}`}
        confirmText="Sí cerrar"
      />

    </div>
  );
}

