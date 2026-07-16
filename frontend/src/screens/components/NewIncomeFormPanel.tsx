import type { HtmlInputChangeEvent } from '../../types/reactEvents';
import { Screen } from '../../types';
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  PlusCircle,
  Trash2,
  Upload,
} from 'lucide-react';
import { OpenBoxOption, SaleOption } from '../../types/operational';
import { autocompleteCurrencyBRL, formatCurrencyBRL } from '../../utils/currency';
import { isSaleIncomeType } from '../../utils/incomeTypeLabels';

interface NewIncomeFormPanelProps {
  subTab: 'ingreso' | 'complementar';
  onSubTabChange: (tab: 'ingreso' | 'complementar') => void;
  currentSelectedBox?: OpenBoxOption;
  incomeType: string;
  onIncomeTypeChange: (value: string) => void;
  salesList: SaleOption[];
  selectedSaleId: string;
  onSaleSelect: (saleId: string, saleName: string) => void;
  amount: string;
  onAmountChange: (value: string) => void;
  comment: string;
  onCommentChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  fileName: string;
  fileUrl: string;
  onFileChange: (e: HtmlInputChangeEvent) => void;
  onRemoveFile: () => void;
  successMsg: string | null;
  saveError: string | null;
  saving: boolean;
  onSaveClick: () => void;
  onNavigate?: (screen: Screen) => void;
}

function IncomeFileUpload({
  fileName,
  fileUrl,
  onFileChange,
  onRemoveFile,
}: Pick<NewIncomeFormPanelProps, 'fileName' | 'fileUrl' | 'onFileChange' | 'onRemoveFile'>) {
  if (!fileName) {
    return (
      <label
        htmlFor="income-file-input"
        className="border border-gray-200 bg-[#F9FAFB] rounded-xl flex flex-col items-center justify-center py-5 px-4 cursor-pointer hover:bg-gray-100/70 transition-colors shadow-xs"
      >
        <span className="text-sm text-gray-900 font-extrabold tracking-tight">Seleccionar archivo</span>
        <span className="text-xs text-gray-400 mt-1 font-bold">Ningún archivo seleccionado</span>
      </label>
    );
  }

  return (
    <div className="border border-green-300 rounded-xl bg-green-50/50 p-3.5 flex items-center justify-between animate-in fade-in duration-200">
      <div className="flex items-center space-x-3 text-xs text-[#333333] font-medium truncate">
        {fileUrl.startsWith('data:image/') ? (
          <img src={fileUrl} alt="Preview" className="w-10 h-10 object-cover rounded border border-gray-200 shrink-0" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-10 h-10 bg-gray-100 flex items-center justify-center rounded shrink-0">
            <Upload className="w-5 h-5 text-gray-500" />
          </div>
        )}
        <div className="truncate">
          <p className="font-extrabold text-gray-800 truncate max-w-[180px]">{fileName}</p>
          <p className="text-[10px] text-gray-400 font-bold">Archivo seleccionado</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRemoveFile}
        className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export function NewIncomeFormPanel({
  subTab,
  onSubTabChange,
  currentSelectedBox,
  incomeType,
  onIncomeTypeChange,
  salesList,
  selectedSaleId,
  onSaleSelect,
  amount,
  onAmountChange,
  comment,
  onCommentChange,
  description,
  onDescriptionChange,
  fileName,
  fileUrl,
  onFileChange,
  onRemoveFile,
  successMsg,
  saveError,
  saving,
  onSaveClick,
  onNavigate,
}: NewIncomeFormPanelProps) {
  return (
    <div className="flex flex-col space-y-4">
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="flex bg-[#F3F4F6] p-1.5 rounded-t-2xl border-b border-gray-100">
          <button
            type="button"
            onClick={() => onSubTabChange('ingreso')}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all w-1/2 ${
              subTab === 'ingreso'
                ? 'bg-white text-gray-900 font-extrabold shadow-xs border-t-2 border-[#8CC63F]'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Banknote className="w-4 h-4 text-[#8CC63F]" />
            Ingreso
          </button>
          <button
            type="button"
            onClick={() => onSubTabChange('complementar')}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all w-1/2 ${
              subTab === 'complementar'
                ? 'bg-white text-gray-900 font-extrabold shadow-xs border-t-2 border-[#8CC63F]'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-[#8CC63F]" />
            Complementar
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-gray-900 font-extrabold text-sm block tracking-tight">
              UGI Diario<span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="relative">
              <select
                disabled
                className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm font-extrabold text-gray-800 bg-gray-50 outline-none appearance-none cursor-not-allowed"
              >
                {currentSelectedBox ? (
                  <option value={currentSelectedBox.id}>
                    {currentSelectedBox.unitName || currentSelectedBox.cnName}
                  </option>
                ) : (
                  <option value="">La unidad debe tener la caja cerrada</option>
                )}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-gray-900 font-extrabold text-sm block tracking-tight">
              Trabajador<span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="relative">
              <select
                disabled
                className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm font-extrabold text-gray-800 bg-gray-50 outline-none appearance-none cursor-not-allowed"
              >
                {currentSelectedBox ? (
                  <option value={currentSelectedBox.userId}>
                    {currentSelectedBox.userName || 'Cobrador'}
                  </option>
                ) : (
                  <option value="">Sin Trabajador</option>
                )}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-gray-900 font-extrabold text-sm block tracking-tight">
              Tipo de ingreso<span className="text-red-500 ml-0.5">*</span>
            </label>
            <select
              id="income-type-select"
              value={incomeType}
              onChange={(e) => onIncomeTypeChange(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm font-semibold text-gray-800 bg-white outline-none focus:border-[#6A008A] appearance-none cursor-pointer"
            >
              <option value="">Seleccione el tipo de ingreso</option>
              <option value="venta">venta</option>
              <option value="venda">venda</option>
              <option value="inversion">inversion</option>
              <option value="inversion odu">inversion odu</option>
              <option value="factura controlmax">factura controlmax</option>
              <option value="descuadre">descuadre</option>
              <option value="varios">varios</option>
              <option value="prestamo otros">prestamo otros</option>
              <option value="labada moto">labada moto</option>
              <option value="peaje">peaje</option>
              <option value="recarga cel">recarga cel</option>
            </select>
          </div>

          {isSaleIncomeType(incomeType) && (
            <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
              <label className="text-gray-900 font-extrabold text-sm block tracking-tight">
                Id de venda<span className="text-red-500 ml-0.5">*</span>
              </label>
              <select
                id="sale-id-select"
                value={selectedSaleId}
                onChange={(e) => {
                  const selected = salesList.find((sale) => sale.id === e.target.value);
                  onSaleSelect(e.target.value, selected?.clientName ?? '');
                }}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm font-semibold text-gray-800 bg-white outline-none focus:border-[#6A008A] appearance-none cursor-pointer"
              >
                <option value="">Seleccionar Id de Venta</option>
                {salesList.map((sale) => (
                  <option key={sale.id} value={sale.id}>
                    {sale.id} - {sale.clientName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-gray-900 font-extrabold text-sm block tracking-tight">
              Valor<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              id="income-amount-input"
              type="text"
              value={amount}
              onChange={(e) => onAmountChange(formatCurrencyBRL(e.target.value))}
              onBlur={(e) => {
                const autocompleted = autocompleteCurrencyBRL(e.target.value);
                if (autocompleted) onAmountChange(autocompleted);
              }}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-[#6A008A] bg-white"
              placeholder="0"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-gray-900 font-extrabold text-sm block tracking-tight">
              Comentários<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              id="income-comment-input"
              type="text"
              value={comment}
              onChange={(e) => onCommentChange(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-[#6A008A] bg-white"
              placeholder="Ingrese comentarios"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-gray-900 font-extrabold text-sm block tracking-tight">
              Descrição<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              id="income-desc-input"
              type="text"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-[#6A008A] bg-white"
              placeholder="Ingresa la descripción"
            />
          </div>

          <div className="space-y-1.5 pt-1">
            <input
              type="file"
              id="income-file-input"
              className="hidden"
              onChange={onFileChange}
              accept="image/*,application/pdf"
            />
            <IncomeFileUpload
              fileName={fileName}
              fileUrl={fileUrl}
              onFileChange={onFileChange}
              onRemoveFile={onRemoveFile}
            />
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-xs rounded-xl p-3.5 font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4.5 h-4.5 text-green-600 shrink-0" />
          {successMsg}
        </div>
      )}

      {saveError && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl p-3.5 font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <AlertCircle className="w-4.5 h-4.5 text-red-600 shrink-0" />
          {saveError}
        </div>
      )}

      <div className="pt-2 flex flex-col space-y-2.5">
        <button
          id="btn-save-income"
          disabled={!currentSelectedBox || saving}
          onClick={onSaveClick}
          className="w-full bg-[#8CC63F] text-black font-extrabold py-3.5 text-sm flex justify-center items-center rounded-full shadow-md disabled:opacity-50 hover:bg-[#7bb335] active:scale-95 transition-all cursor-pointer"
        >
          {saving ? (
            <svg className="animate-spin h-4 w-4 mr-1.5 text-black" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : null}
          {saving ? 'GUARDANDO...' : 'Guardar'}
        </button>
        <button
          id="btn-cancel-income"
          disabled={saving}
          onClick={() => onNavigate?.('dashboard')}
          className="w-full bg-white text-gray-800 border border-gray-300 font-extrabold py-3.5 text-sm flex justify-center items-center rounded-full shadow-xs hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
