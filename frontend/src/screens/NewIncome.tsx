import { useState } from 'react';
import type { HtmlInputChangeEvent } from '../types/reactEvents';
import { Screen } from '../types';
import { ConfirmModal } from './components/ConfirmModal';
import { useBox } from '../hooks/useBox';
import { useNewIncomeData } from '../hooks/useNewIncomeData';
import { useTenant } from '../hooks/useTenant';
import { getErrorMessage } from '../utils/errorMessage';
import { persistIncomeAndUpdateBox, validateIncomeForm } from '../utils/incomeSave';
import { persistExpense, validateExpenseForm, expenseSuccessMessage } from '../utils/expenseSave';
import { formatCurrencyBRL, autocompleteCurrencyBRL } from '../utils/currency';
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
  ClipboardList
} from 'lucide-react';

interface NewIncomeProps {
  onNavigate?: (screen: Screen) => void;
}

export function NewIncome({ onNavigate }: NewIncomeProps) {
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [movementType, setMovementType] = useState<'gasto' | 'entrada'>('entrada');
  const [showConfirm, setShowConfirm] = useState(false);
  const [amount, setAmount] = useState('');
  const [selectedDescription, setSelectedDescription] = useState('inversion');
  const [selectedSaleId, setSelectedSaleId] = useState('');
  const [selectedSaleName, setSelectedSaleName] = useState('');
  const [comment, setComment] = useState('');
  const [description, setDescription] = useState('');
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
    incomes,
    loadingHistory,
    currentSelectedBox,
    salesList,
  } = useNewIncomeData({ tenantId, activeBox });

  const selectedCnName = centers.find((c) => c.id === selectedCnId)?.name || '';
  const selectedBoxId = currentSelectedBox?.id || '';
  const selectedBoxName = currentSelectedBox?.userName || '';
  const unifiedHistory = incomes;

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
          selectedCnId: selectedCnId || activeBox?.cnId || '',
          selectedCnName: selectedCnName || activeBox?.cnName || 'Centro',
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
          selectedSaleId: selectedSaleId,
          selectedSaleName: selectedSaleName,
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
      
      {/* Header Bar */}
      <div className="bg-[#6A008A] pt-4 pb-3 text-white flex flex-col shrink-0 shadow-md mb-6">
        <div className="flex items-center justify-between px-4 lg:px-6">
          <button 
            onClick={() => onNavigate && onNavigate('dashboard')}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div className="flex flex-col items-center text-center">
            <span className="text-white font-black text-base lg:text-lg tracking-tight uppercase">Ventas Ingresos</span>
            <span className="text-white/80 text-[10px] font-bold tracking-wider mt-0.5">
              {activeBox?.unitName || 'Sin Unidad'} | {activeBox?.userName || 'Sin Trabajador'}
            </span>
          </div>
          <button className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
            <Share2 className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full px-4 flex flex-col space-y-4">
        
        {/* Tab Selection */}
        <div className="flex space-x-1 border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('new')}
            className={`px-5 py-2.5 rounded-t-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border ${
              activeTab === 'new'
                ? 'bg-[#8CC63F] text-white border-[#8CC63F]'
                : 'bg-white hover:bg-gray-50 text-gray-500 border-gray-200 border-b-transparent'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Ingreso</span>
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-5 py-2.5 rounded-t-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border ${
              activeTab === 'history'
                ? 'bg-[#8CC63F] text-white border-[#8CC63F]'
                : 'bg-white hover:bg-gray-50 text-gray-500 border-gray-200 border-b-transparent'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Complementar</span>
          </button>
        </div>

        {activeTab === 'new' ? (
          <div className="bg-white border border-gray-200 shadow-md rounded-b-xl rounded-tr-xl p-6 flex flex-col space-y-6">
            
            {/* Movement Type Display */}
            <div className="flex items-center space-x-3 text-xs font-black text-gray-500">
              <span className="uppercase tracking-wider">Tipo de movimento</span>
              <div className="flex items-center space-x-1.5 text-gray-700 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200">
                <span className="w-3.5 h-3.5 rounded-full border-4 border-[#8CC63F] bg-white inline-block"></span>
                <span className="uppercase">Ingreso</span>
              </div>
            </div>

            {/* Form Fields Grid */}
            <div className="space-y-4 max-w-2xl">
              
              {/* UGI Diario */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                <label className="md:text-right font-black text-xs text-gray-500 uppercase tracking-wider md:pr-4">
                  UGI Diario*
                </label>
                <div className="md:col-span-2">
                  <select 
                    disabled
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-gray-50 text-sm font-semibold text-gray-600 outline-none cursor-not-allowed"
                  >
                    <option value="">{activeBox?.unitName || 'La unidad debe tener la caja cerrada'}</option>
                  </select>
                </div>
              </div>

              {/* Trabajador */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                <label className="md:text-right font-black text-xs text-gray-500 uppercase tracking-wider md:pr-4">
                  Trabajador*
                </label>
                <div className="md:col-span-2">
                  <select 
                    disabled
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-gray-50 text-sm font-semibold text-gray-600 outline-none cursor-not-allowed"
                  >
                    <option value="">{activeBox?.userName || 'Sin Trabajador'}</option>
                  </select>
                </div>
              </div>

              {/* Tipo de ingreso */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                <label className="md:text-right font-black text-xs text-gray-500 uppercase tracking-wider md:pr-4">
                  Tipo de ingreso*
                </label>
                <div className="md:col-span-2">
                  <select 
                    value={selectedDescription}
                    onChange={(e) => setSelectedDescription(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-sm font-bold text-gray-700 outline-none focus:border-[#6A008A] cursor-pointer"
                  >
                    {movementOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Id de venda */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                <label className="md:text-right font-black text-xs text-gray-500 uppercase tracking-wider md:pr-4">
                  Id de venda*
                </label>
                <div className="md:col-span-2">
                  <select 
                    value={selectedSaleId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedSaleId(val);
                      const sale = salesList.find(s => s.id === val);
                      setSelectedSaleName(sale?.clientName || '');
                    }}
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-sm font-bold text-gray-700 outline-none focus:border-[#6A008A] cursor-pointer"
                  >
                    <option value="">Seleccionar Id de Venta</option>
                    {salesList.map((sale) => (
                      <option key={sale.id} value={sale.id}>
                        {sale.id.slice(0, 8)} - {sale.clientName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Valor */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                <label className="md:text-right font-black text-xs text-gray-500 uppercase tracking-wider md:pr-4">
                  Valor*
                </label>
                <div className="md:col-span-2">
                  <input 
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(formatCurrencyBRL(e.target.value))}
                    onBlur={(e) => {
                      const autoVal = autocompleteCurrencyBRL(e.target.value);
                      if (autoVal) setAmount(autoVal);
                    }}
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-sm font-bold text-gray-800 outline-none focus:border-[#6A008A]"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Comentarios */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                <label className="md:text-right font-black text-xs text-gray-500 uppercase tracking-wider md:pr-4">
                  Comentários*
                </label>
                <div className="md:col-span-2">
                  <input 
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-sm font-semibold text-gray-800 outline-none focus:border-[#6A008A]"
                    placeholder="Ingrese comentarios"
                  />
                </div>
              </div>

              {/* Descrição */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                <label className="md:text-right font-black text-xs text-gray-500 uppercase tracking-wider md:pr-4">
                  Descrição*
                </label>
                <div className="md:col-span-2">
                  <input 
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-sm font-semibold text-gray-800 outline-none focus:border-[#6A008A]"
                    placeholder="Ingrese la descripción"
                  />
                </div>
              </div>

              {/* Seleccionar archivo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start pt-2">
                <div className="md:text-right md:pr-4"></div>
                <div className="md:col-span-2">
                  <input 
                    type="file" 
                    id="image-file-input"
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
                        className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label 
                      htmlFor="image-file-input"
                      className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 hover:bg-gray-50 rounded-lg text-xs font-black uppercase tracking-wider text-gray-600 cursor-pointer shadow-xs transition-all"
                    >
                      <Camera className="w-4 h-4 text-gray-500" />
                      <span>Seleccionar archivo</span>
                    </label>
                  )}
                </div>
              </div>

            </div>

            {/* Error and Success Indicators */}
            {saveError && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl p-3 font-bold flex items-center space-x-2 max-w-2xl">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl p-3 font-bold flex items-center space-x-2 max-w-2xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Save Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3 max-w-2xl">
              <button 
                type="button"
                disabled={saving}
                onClick={() => setShowConfirm(true)}
                className="flex-1 bg-[#6A008A] text-white font-black py-3.5 px-6 text-xs rounded-xl shadow-md hover:bg-[#52006A] active:scale-98 transition-all flex justify-center items-center cursor-pointer uppercase tracking-wider"
              >
                {saving && (
                  <div className="border-2 border-white border-t-transparent rounded-full w-4 h-4 animate-spin mr-2" />
                )}
                Salvar Movimento
              </button>
              <button 
                type="button"
                disabled={saving}
                onClick={() => setShowConfirm(true)}
                className="flex-1 bg-white text-[#6A008A] border border-[#6A008A] font-black py-3.5 px-6 text-xs rounded-xl shadow-xs hover:bg-purple-50 active:scale-98 transition-all flex justify-center items-center cursor-pointer uppercase tracking-wider"
              >
                Enviar para análisis
              </button>
            </div>

          </div>
        ) : (
          /* History list */
          <div className="bg-white border border-gray-200 shadow-md rounded-xl overflow-hidden flex flex-col p-4">
            <div className="pb-3 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-black text-gray-800 text-xs uppercase tracking-wider">Histórico de Lançamentos</h3>
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
                            {(item as any).incomeType || item.type || 'Movimento'}
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
                        {isExpense ? '-' : '+'}${amountFloat.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
        subtitle={`Se registrará un nuevo ingreso de $ ${amount || '0'}`}
        confirmText="Sí guardar"
      />
    </div>
  );
}
