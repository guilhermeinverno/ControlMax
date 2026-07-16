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
import { formatCurrencyBRL, autocompleteCurrencyBRL, parseCurrencyBRLToFloat } from '../utils/currency';
import { formatFirestoreDate } from '../utils/firestoreTimestamp';
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
  Layers,
  ChevronDown
} from 'lucide-react';

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
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  const { activeBox } = useBox();
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
        // Prepare Gasto payload
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
          description: comment || selectedDescription,
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
        // Prepare Entrada payload
        const payload = {
          tenantId,
          currentSelectedBox: activeBox,
          incomeType: selectedDescription.toLowerCase(),
          selectedSaleId: '',
          selectedSaleName: '',
          amount: amount || '0',
          comment: comment || selectedDescription,
          description: comment || selectedDescription,
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
      setSaveError(getErrorMessage(error) || 'Error al guardar el movimiento.');
    } finally {
      setSaving(false);
    }
  };

  // Predefined Descriptions
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
    'prestamo otros',
    'labada moto',
    'peaje'
  ];

  return (
    <div className="flex flex-col bg-slate-50 min-h-screen text-[#333333] select-none pb-12">
      
      {/* 1. Header with custom tabs in the banner */}
      <div className="bg-[#6A008A] pt-4 text-white flex flex-col shrink-0 shadow-md">
        <div className="flex items-center justify-between px-4 pb-2">
          <button 
            onClick={() => onNavigate && onNavigate('dashboard')}
            className="p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div className="flex flex-col items-center text-center">
            <span className="text-white font-black text-lg tracking-tight uppercase">Registro de Movimentos</span>
            <span className="text-white/85 text-[11px] font-bold tracking-wider mt-0.5">
              {activeBox?.unitName ? activeBox.unitName.substring(0, 3) : '65'} / {activeBox?.cnName ? activeBox.cnName.substring(0, 3) : '3'} / {activeBox?.id ? activeBox.id.substring(0, 7) : '1007967'}
            </span>
          </div>
          <button className="p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
            <Share2 className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Dynamic Navigation Sub-tabs */}
        <div className="flex justify-around items-center border-t border-white/10 mt-2">
          <button 
            onClick={() => setActiveTab('new')}
            className={`w-1/2 py-3 text-center text-xs font-black tracking-wider uppercase relative transition-all cursor-pointer ${
              activeTab === 'new' ? 'text-white font-black' : 'text-white/60 font-semibold'
            }`}
          >
            Registrar
            {activeTab === 'new' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#8CC63F] rounded-full mx-auto w-12" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`w-1/2 py-3 text-center text-xs font-black tracking-wider uppercase relative transition-all cursor-pointer ${
              activeTab === 'history' ? 'text-white font-black' : 'text-white/60 font-semibold'
            }`}
          >
            Movimentos
            {activeTab === 'history' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#8CC63F] rounded-full mx-auto w-12" />
            )}
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full px-4 pt-4 flex flex-col space-y-4">
        {activeTab === 'new' ? (
          <div className="flex flex-col space-y-4">
            
            {/* Helper Text */}
            <div className="py-1">
              <p className="text-xs font-black text-slate-500 uppercase tracking-wide">Selecione um tipo de movimento</p>
            </div>

            {/* 2. Toggle selection button group */}
            <div className="grid grid-cols-2 gap-3">
              {/* Gasto button */}
              <button 
                type="button"
                onClick={() => {
                  setMovementType('gasto');
                  setSelectedDescription('Gasolina');
                  setSuccessMsg(null);
                  setSaveError(null);
                }}
                className={`flex items-center justify-center space-x-2 py-4 px-4 rounded-2xl border transition-all cursor-pointer ${
                  movementType === 'gasto'
                    ? 'bg-[#F9FBE7] border-[#8CC63F] text-slate-900 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  movementType === 'gasto' ? 'bg-[#8CC63F]/20 text-[#8CC63F]' : 'bg-slate-100 text-slate-400'
                }`}>
                  <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                </div>
                <span className="text-sm font-black uppercase tracking-wide">Gasto</span>
              </button>

              {/* Entrada button */}
              <button 
                type="button"
                onClick={() => {
                  setMovementType('entrada');
                  setSelectedDescription('inversion');
                  setSuccessMsg(null);
                  setSaveError(null);
                }}
                className={`flex items-center justify-center space-x-2 py-4 px-4 rounded-2xl border transition-all cursor-pointer ${
                  movementType === 'entrada'
                    ? 'bg-[#F9FBE7] border-[#8CC63F] text-slate-900 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  movementType === 'entrada' ? 'bg-[#8CC63F]/20 text-[#8CC63F]' : 'bg-slate-100 text-slate-400'
                }`}>
                  <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                </div>
                <span className="text-sm font-black uppercase tracking-wide">Entrada</span>
              </button>
            </div>

            {/* Form Fields container */}
            <div className="space-y-4 pt-1">
              
              {/* Descrição Select Field */}
              <div className="relative">
                <select 
                  id="desc-select"
                  value={selectedDescription}
                  onChange={(e) => setSelectedDescription(e.target.value)}
                  className="peer w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 pr-10 text-sm font-semibold text-slate-800 outline-none focus:border-[#6A008A] transition-colors appearance-none cursor-pointer"
                >
                  {movementOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <label 
                  htmlFor="desc-select"
                  className="absolute left-4 -top-2 px-1 bg-white text-[10px] font-bold text-slate-400 peer-focus:text-[#6A008A]"
                >
                  Descrição*
                </label>
                <div className="absolute right-4 top-4.5 pointer-events-none text-slate-400">
                  <ChevronDown className="w-5 h-5" />
                </div>
              </div>

              {/* Valor Input Field */}
              <div className="relative">
                <input 
                  type="text"
                  id="amount-input"
                  value={amount}
                  onChange={(e) => setAmount(formatCurrencyBRL(e.target.value))}
                  onBlur={(e) => {
                    const autoVal = autocompleteCurrencyBRL(e.target.value);
                    if (autoVal) setAmount(autoVal);
                  }}
                  className="peer w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#6A008A] transition-colors placeholder-transparent"
                  placeholder="Valor*"
                />
                <label 
                  htmlFor="amount-input"
                  className="absolute left-4 -top-2 px-1 bg-white text-[10px] font-bold text-slate-400 peer-focus:text-[#6A008A]"
                >
                  Valor*
                </label>
              </div>

              {/* Image Uploader */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1">Adicionar foto</p>
                <input 
                  type="file" 
                  id="image-file-input"
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*"
                />

                {fileName ? (
                  <div className="border border-green-200 rounded-2xl bg-green-50/50 p-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3 text-xs text-slate-800 font-medium truncate">
                      {fileUrl.startsWith('data:image/') ? (
                        <img 
                          src={fileUrl} 
                          alt="Preview" 
                          className="w-10 h-10 object-cover rounded-xl border border-slate-200 shrink-0" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-slate-100 flex items-center justify-center rounded-xl shrink-0">
                          <Camera className="w-5 h-5 text-slate-500" />
                        </div>
                      )}
                      <div className="truncate">
                        <p className="font-extrabold text-slate-800 truncate max-w-[180px]">{fileName}</p>
                        <p className="text-[9px] text-slate-400 font-bold">Foto selecionada</p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        setFileName('');
                        setFileUrl('');
                      }}
                      className="p-1.5 hover:bg-red-50 text-red-500 rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label 
                    htmlFor="image-file-input"
                    className="w-16 h-16 border-2 border-dashed border-slate-300 bg-white rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <Camera className="w-6 h-6 text-slate-400" />
                  </label>
                )}
              </div>

              {/* Comentários Text Input */}
              <div className="relative">
                <input 
                  type="text"
                  id="comment-input"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="peer w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#6A008A] transition-colors placeholder-transparent"
                  placeholder="Comentários"
                />
                <label 
                  htmlFor="comment-input"
                  className="absolute left-4 -top-2 px-1 bg-white text-[10px] font-bold text-slate-400 peer-focus:text-[#6A008A]"
                >
                  Comentários
                </label>
              </div>

              {/* Total indicator */}
              <div className="py-1">
                <p className="text-xs font-black text-slate-800 uppercase tracking-tight">
                  {movementType === 'gasto' ? 'Valor total das despesas:' : 'Valor total das entrada:'} <span className="font-extrabold text-slate-900">${amount || '0'}</span>
                </p>
              </div>

              {/* Success and Error messages */}
              {successMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl p-3 font-bold flex items-center space-x-2 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {saveError && (
                <div className="bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl p-3 font-bold flex items-center space-x-2 animate-in fade-in duration-200">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              {/* Action buttons at the bottom */}
              <div className="pt-2 flex flex-col space-y-3.5">
                <button 
                  type="button"
                  disabled={saving}
                  onClick={() => setShowConfirm(true)}
                  className="w-full bg-[#6A008A] text-white font-black py-4.5 text-sm rounded-2xl shadow-md hover:bg-[#52006A] active:scale-95 transition-all flex justify-center items-center cursor-pointer uppercase tracking-wider"
                >
                  {saving && (
                    <div className="border-2 border-white border-t-transparent rounded-full w-5 h-5 animate-spin mr-2" />
                  )}
                  Salvar a o movimento
                </button>

                <button 
                  type="button"
                  disabled={saving}
                  onClick={() => setShowConfirm(true)}
                  className="w-full bg-white text-[#6A008A] border border-[#6A008A] font-black py-4.5 text-sm rounded-2xl shadow-xs hover:bg-purple-50 active:scale-95 transition-all flex justify-center items-center cursor-pointer uppercase tracking-wider"
                >
                  Enviar para análisis
                </button>
              </div>

            </div>

          </div>
        ) : (
          /* History tab */
          <div className="flex flex-col space-y-4">
            <div className="bg-white border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] rounded-2xl overflow-hidden">
              <div className="px-4 py-3 bg-[#6A008A]/5 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wide">Últimos Lançamentos</span>
                <span className="text-[10px] font-bold text-[#6A008A] uppercase tracking-wide bg-purple-50 px-2 py-0.5 rounded-full">Histórico</span>
              </div>
              
              {loadingHistory ? (
                <div className="p-12 flex flex-col items-center justify-center space-y-2">
                  <div className="border-2 border-[#6A008A] border-t-transparent rounded-full w-6 h-6 animate-spin" />
                  <span className="text-xs text-slate-400 font-bold">Carregando lançamentos...</span>
                </div>
              ) : unifiedHistory.length === 0 ? (
                <div className="p-12 text-center">
                  <span className="text-xs text-slate-400 font-bold">Nenhum lançamento encontrado.</span>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
                  {unifiedHistory.map((item) => {
                    const isExpense = item.type !== 'income';
                    const amountFloat = item.amount / 100;
                    const dateStr = item.createdAt 
                      ? formatFirestoreDate(item.createdAt, 'pt-BR', { day: '2-digit', month: '2-digit' })
                      : 'Recente';

                    return (
                      <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center space-x-3 truncate">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isExpense ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {isExpense ? (
                              <ArrowUpRight className="w-5 h-5" />
                            ) : (
                              <ArrowDownLeft className="w-5 h-5" />
                            )}
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-black text-slate-800 capitalize leading-tight truncate">
                              {item.expenseType || item.type || 'Movimento'}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5 flex items-center">
                              <Calendar className="w-3 h-3 mr-0.5 text-slate-300" />
                              {dateStr}
                              {item.comment && (
                                <span className="ml-1.5 truncate border-l border-slate-200 pl-1.5 max-w-[120px]" title={item.comment}>
                                  {item.comment}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <span className={`text-sm font-black tracking-tight shrink-0 ${
                          isExpense ? 'text-red-600' : 'text-emerald-600'
                        }`}>
                          {isExpense ? '-' : '+'}${amountFloat.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSave}
        title="¿Confirmar registro?"
        subtitle={
          movementType === 'gasto'
            ? `Se registrará un nuevo gasto de $ ${amount || '0'}`
            : `Se registrará un nuevo ingreso de $ ${amount || '0'}`
        }
        confirmText="Sí guardar"
      />
    </div>
  );
}

