import { useState } from 'react';
import type { HtmlInputChangeEvent } from '../types/reactEvents';
import { Screen } from '../types';
import { ConfirmModal } from './components/ConfirmModal';
import { useBox } from '../hooks/useBox';
import { useNewExpenseData } from '../hooks/useNewExpenseData';
import { useTenant } from '../hooks/useTenant';
import { getErrorMessage } from '../utils/errorMessage';
import { expenseSuccessMessage, persistExpense, validateExpenseForm } from '../utils/expenseSave';
import { persistIncomeAndUpdateBox, validateIncomeForm } from '../utils/incomeSave';
import { formatCurrencyBRL, autocompleteCurrencyBRL } from '../utils/currency';
import { formatFirestoreDate } from '../utils/firestoreTimestamp';
import { auth } from '../lib/firebase';
import { 
  ArrowLeft,
  Share2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Camera, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2,
  Calendar,
  ChevronRight,
  ClipboardList,
  ChevronDown,
  Eraser,
  Loader2
} from 'lucide-react';

const GastoIcon = () => (
  <svg className="w-5 h-5 mr-2 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <circle cx="10" cy="12" r="7" />
    <path d="M10 9v6M8 11h4" />
    <path d="M17 12h4m0 0l-2-2m2 2l-2 2" />
  </svg>
);

const EntradaIcon = () => (
  <svg className="w-5 h-5 mr-2 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <circle cx="14" cy="12" r="7" />
    <path d="M14 9v6M12 11h4" />
    <path d="M7 12h-4m0 0l2-2m-2 2l2 2" />
  </svg>
);

interface NewExpenseProps {
  onNavigate?: (screen: Screen) => void;
}

export function NewExpense({ onNavigate }: NewExpenseProps) {
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [movementType, setMovementType] = useState<'gasto' | 'entrada'>('gasto');
  const [showConfirm, setShowConfirm] = useState(false);
  const [amount, setAmount] = useState('');
  const [selectedDescription, setSelectedDescription] = useState('Gasolina');
  const [comment, setComment] = useState('');
  const [description, setDescription] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  const { activeBox } = useBox();
  const currentUser = auth?.currentUser;
  const { tenantId, role, userName, isSuperAdmin } = useTenant();
  const {
    centers,
    selectedCnId,
    selectedCnName,
    selectedBoxId,
    selectedBoxName,
    unifiedHistory,
    loadingHistory,
  } = useNewExpenseData({ tenantId, activeBox });

  const handleFileChange = (e: HtmlInputChangeEvent) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFileUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaveError(null);
    setSuccessMsg(null);
    setSaving(true);
    setShowConfirm(false);

    try {
      if (movementType === 'gasto') {
        const payload = {
          tenantId,
          egresoMode: 'gasto' as const,
          selectedCnId,
          selectedCnName,
          selectedBoxId: selectedBoxId || activeBox?.id || '',
          selectedBoxName: selectedBoxName || activeBox?.userName || 'Caja',
          expenseType: selectedDescription.toLowerCase(),
          amount: amount || '0',
          comment: comment || selectedDescription,
          description: description || selectedDescription,
          fileName,
          fileUrl,
          userName,
          role,
          isSuperAdmin,
        };

        const validationError = validateExpenseForm(payload);
        if (validationError) {
          setSaveError(validationError);
          setSaving(false);
          return;
        }

        const status = await persistExpense(payload);
        setSuccessMsg(expenseSuccessMessage('gasto', status));
        setTimeout(() => onNavigate?.('dashboard'), 1500);
      } else {
        const payload = {
          tenantId,
          currentSelectedBox: activeBox,
          incomeType: selectedDescription.toLowerCase(),
          selectedSaleId: '',
          selectedSaleName: '',
          amount: amount || '0',
          comment: comment || selectedDescription,
          description: description || selectedDescription,
          fileName,
          fileUrl,
          userName,
        };

        const validationError = validateIncomeForm(payload);
        if (validationError) {
          setSaveError(validationError);
          setSaving(false);
          return;
        }

        await persistIncomeAndUpdateBox(payload);
        setSuccessMsg('¡Movimiento de entrada registrado correctamente!');
        setTimeout(() => onNavigate?.('dashboard'), 1500);
      }
    } catch (error) {
      console.error('Error creating movement:', error);
      setSaveError(getErrorMessage(error) || 'Error al guardar el movimento.');
    } finally {
      setSaving(false);
    }
  };

  const movementOptions = movementType === 'gasto' ? [
    'Gasolina',
    'aceite',
    'Sueldo',
    'Arriendo',
    'Pinchada',
    'Arreglo moto',
    'Almuerzo trabajador',
    'recarga telefono'
  ] : [
    'inversion',
    'inversion odu',
    'factura ControlMax',
    'descuadre',
    'varios',
    'prestamo outros',
    'labada moto',
    'peaje'
  ];
  return (
    <div className="flex flex-col bg-[#F3F4F6] min-h-screen text-[#333333] select-none pb-12">
      
      {/* Header Bar (Matches Purple Style with tabs) */}
      <div className="bg-[#6A008A] text-white flex flex-col shrink-0 shadow-md">
        <div className="flex items-center px-4 py-4 relative">
          <button 
            onClick={() => onNavigate && onNavigate('dashboard')}
            className="p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer border-none bg-transparent outline-none"
          >
            <ArrowLeft className="w-6 h-6 text-white stroke-[2.5]" />
          </button>
          
          <div className="flex flex-col ml-3 leading-tight">
            <span className="text-white font-extrabold text-base tracking-tight leading-tight">
              Registro de Movimentos
            </span>
            <span className="text-white/80 text-[11px] font-bold tracking-wider mt-0.5">
              {activeBox?.userId?.slice(0, 2) || '65'} / {activeBox?.unitName?.split(' ')[0] || activeBox?.unitId || '3'} / {currentUser?.uid?.slice(0, 7) || '1008005'}
            </span>
          </div>
        </div>

        {/* Tab selection */}
        <div className="flex w-full border-t border-white/10">
          <button 
            onClick={() => setActiveTab('new')}
            className={`flex-1 text-center py-3 text-xs font-black uppercase tracking-wider transition-all relative cursor-pointer border-none bg-transparent outline-none ${
              activeTab === 'new' ? 'text-white font-black' : 'text-white/60'
            }`}
          >
            Registrar
            {activeTab === 'new' && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#8CC63F]" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 text-center py-3 text-xs font-black uppercase tracking-wider transition-all relative cursor-pointer border-none bg-transparent outline-none ${
              activeTab === 'history' ? 'text-white font-black' : 'text-white/60'
            }`}
          >
            Movimentos
            {activeTab === 'history' && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#8CC63F]" />
            )}
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full px-4 flex flex-col space-y-4 pt-5">

        {activeTab === 'new' ? (
          <div className="bg-white p-5 flex flex-col space-y-5 rounded-2xl border border-slate-200/60 shadow-md">
            
            {/* Tipo de movimento selector header */}
            <div className="flex items-center justify-between">
              <span className="text-slate-800 text-xs font-extrabold uppercase tracking-wide">
                Selecione um tipo de movimento
              </span>
              <button 
                type="button"
                onClick={() => {
                  setAmount('');
                  setComment('');
                  setDescription('');
                  setFileName('');
                  setFileUrl('');
                }}
                className="p-1 hover:bg-slate-100 rounded-lg text-[#6A008A] transition-colors cursor-pointer border-none bg-transparent outline-none"
                title="Limpar formulário"
              >
                <Eraser className="w-5 h-5" />
              </button>
            </div>

            {/* Segmented buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setMovementType('gasto');
                  setSelectedDescription('Gasolina');
                  setDescription('Gasolina');
                }}
                className={`flex-1 py-3.5 px-4 rounded-xl border flex items-center justify-center font-black text-xs tracking-wider uppercase transition-all cursor-pointer outline-none ${
                  movementType === 'gasto'
                    ? 'bg-[#F1F9E7] border-[#8CC63F] text-[#6A008A]'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                <GastoIcon />
                <span>Gasto</span>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setMovementType('entrada');
                  setSelectedDescription('inversion');
                  setDescription('inversion');
                }}
                className={`flex-1 py-3.5 px-4 rounded-xl border flex items-center justify-center font-black text-xs tracking-wider uppercase transition-all cursor-pointer outline-none ${
                  movementType === 'entrada'
                    ? 'bg-[#F8EFFF] border-[#6A008A] text-[#6A008A]'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                <EntradaIcon />
                <span>Entrada</span>
              </button>
            </div>

            {/* Descrição Select Dropdown */}
            <div className="relative">
              <select
                value={selectedDescription}
                onChange={(e) => {
                  setSelectedDescription(e.target.value);
                  setDescription(e.target.value);
                }}
                className="peer w-full bg-white border border-slate-300 rounded-lg px-4 py-3.5 pr-10 text-sm font-bold text-slate-800 outline-none focus:border-[#6B119C] appearance-none cursor-pointer"
                required
              >
                {movementOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <label className="absolute left-3 -top-2.5 z-10 px-1 bg-white text-[11px] font-bold text-slate-400">
                Descrição*
              </label>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown size={18} />
              </div>
            </div>

            {/* Valor Input */}
            <div className="relative">
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(formatCurrencyBRL(e.target.value))}
                onBlur={(e) => {
                  const autoVal = autocompleteCurrencyBRL(e.target.value);
                  if (autoVal) setAmount(autoVal);
                }}
                className="peer w-full bg-white border border-slate-300 rounded-lg px-4 py-3.5 text-sm font-bold text-slate-800 outline-none focus:border-[#6B119C] transition-colors placeholder-transparent"
                placeholder=" "
                required
              />
              <label className="absolute left-3 -top-2.5 z-10 px-1 bg-white text-[11px] font-bold text-slate-400 peer-focus:text-[#6B119C]">
                Valor*
              </label>
            </div>

            {/* Photo upload */}
            <div className="flex flex-col space-y-2">
              <span className="text-slate-800 text-xs font-bold uppercase tracking-wide">
                Adicionar foto
              </span>
              
              <input 
                type="file" 
                id="movement-image-input"
                className="hidden"
                onChange={handleFileChange}
                accept="image/*"
              />
              
              {fileName ? (
                <div className="border border-green-200 rounded-xl bg-green-50/50 p-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-xs text-slate-800 font-medium truncate">
                    {fileUrl.startsWith('data:image/') ? (
                      <img 
                        src={fileUrl} 
                        alt="Preview" 
                        className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0" 
                      />
                    ) : (
                      <div className="w-10 h-10 bg-slate-100 flex items-center justify-center rounded-lg shrink-0">
                        <Camera className="w-5 h-5 text-slate-500" />
                      </div>
                    )}
                    <div className="truncate">
                      <p className="font-extrabold text-slate-800 truncate max-w-[180px]">{fileName}</p>
                      <p className="text-[9px] text-slate-400 font-bold">Arquivo anexado</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => {
                      setFileName('');
                      setFileUrl('');
                    }}
                    className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer border-none bg-transparent outline-none"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label 
                  htmlFor="movement-image-input"
                  className="w-16 h-16 bg-slate-100 border border-slate-300 rounded-xl flex items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors shadow-sm"
                >
                  <Camera className="w-6 h-6 text-slate-400" />
                </label>
              )}
            </div>

            {/* Comentários Input */}
            <div className="relative">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="peer w-full bg-white border border-slate-300 rounded-lg px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#6B119C] transition-colors placeholder-transparent"
                placeholder=" "
              />
              <label className="absolute left-3 -top-2.5 z-10 px-1 bg-white text-[11px] font-bold text-slate-400 peer-focus:text-[#6B119C]">
                Comentários
              </label>
            </div>

            {/* Error and Success Indicators */}
            {saveError && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl p-3.5 font-bold flex items-center space-x-2 animate-fadeIn">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            {successMsg && (
              <div className="bg-green-50 border border-green-200 text-green-800 text-xs rounded-xl p-3.5 font-bold flex items-center space-x-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Value Total summary row */}
            <div className="flex items-center justify-between text-slate-800 font-extrabold text-sm border-t border-slate-100 pt-3">
              <span>
                {movementType === 'gasto' ? 'Valor total das gastos:' : 'Valor total das entrada:'}
              </span>
              <span>
                {amount ? amount : '0,00'}
              </span>
            </div>

            {/* Save Buttons */}
            <div className="flex flex-col gap-3">
              <button 
                type="button"
                disabled={saving}
                onClick={() => setShowConfirm(true)}
                className="w-full bg-[#6A008A] hover:bg-[#52006A] text-white font-black py-4 text-sm rounded-xl shadow-md active:scale-98 transition-all flex justify-center items-center cursor-pointer uppercase tracking-wider border-none outline-none"
              >
                {saving && (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                )}
                Salvar a o movimento
              </button>
              
              {movementType === 'gasto' && (
                <button 
                  type="button"
                  disabled={saving}
                  onClick={() => setShowConfirm(true)}
                  className="w-full bg-white text-[#6A008A] border border-[#6A008A] font-black py-4 text-sm rounded-xl hover:bg-purple-50 active:scale-98 transition-all flex justify-center items-center cursor-pointer uppercase tracking-wider border-none outline-none"
                >
                  Enviar para análisis
                </button>
              )}
            </div>

          </div>
        ) : (
          /* History list */
          <div className="bg-white border border-gray-200 shadow-md rounded-2xl overflow-hidden flex flex-col p-5">
            <div className="pb-3 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-extrabold text-gray-800 text-xs uppercase tracking-wider">Histórico de Lançamentos</h3>
            </div>
            
            {loadingHistory ? (
              <div className="p-12 flex flex-col items-center justify-center space-y-2">
                <div className="border-2 border-[#6A008A] border-t-transparent rounded-full w-6 h-6 animate-spin" />
                <span className="text-xs text-slate-400 font-bold">Carregando histórico...</span>
              </div>
            ) : unifiedHistory.length === 0 ? (
              <div className="p-12 text-center text-gray-400 italic font-semibold text-xs">
                Nenhum lançamento encontrado para esta caixa.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[480px] overflow-y-auto mt-2">
                {unifiedHistory.map((item) => {
                  const isExpense = item.type !== 'income';
                  const amountFloat = item.amount / 100;
                  const dateStr = item.createdAt 
                    ? formatFirestoreDate(item.createdAt, 'pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    : 'Recente';

                  return (
                    <div key={item.id} className="py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center space-x-3 truncate">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isExpense ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {isExpense ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-black text-gray-800 capitalize leading-tight truncate">
                            {(item as any).expenseType || item.type || 'Movimento'}
                          </p>
                          <p className="text-[10px] text-gray-400 font-bold mt-0.5 flex items-center">
                            <Calendar className="w-3.5 h-3.5 mr-0.5 text-gray-300" />
                            {dateStr}
                            {item.comment && (
                              <span className="ml-2 truncate border-l border-gray-200 pl-2 max-w-[160px]">
                                {item.comment}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <span className={`text-sm font-black tracking-tight shrink-0 ${
                        isExpense ? 'text-red-600' : 'text-emerald-600'
                      }`}>
                        {isExpense ? '-' : '+'}{amountFloat.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSave}
        title="¿Confirmar registro?"
        subtitle={`Se registrará un nuevo ${movementType === 'gasto' ? 'gasto' : 'ingreso'} de ${amount || '0,00'}`}
        confirmText="Sí guardar"
      />
    </div>
  );
}
