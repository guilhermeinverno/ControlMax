import type { HtmlInputChangeEvent } from '../../types/reactEvents';
import { Screen } from '../../types';
import { AlertCircle, CheckCircle2, Trash2, Upload } from 'lucide-react';
import { BusinessCenter } from '../../types/company';
import { OpenBoxOption } from '../../types/operational';
import { autocompleteCurrencyBRL, formatCurrencyBRL } from '../../utils/currency';

interface NewExpenseFormPanelProps {
  egresoMode: 'gasto' | 'retiro';
  onEgresoModeChange: (mode: 'gasto' | 'retiro') => void;
  centers: BusinessCenter[];
  selectedCnId: string;
  onCnChange: (cnId: string) => void;
  cnOpenBoxes: OpenBoxOption[];
  selectedBoxId: string;
  onBoxChange: (boxId: string) => void;
  expenseType: string;
  onExpenseTypeChange: (value: string) => void;
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

function SelectChevron() {
  return (
    <div className="absolute right-4 top-4.5 pointer-events-none text-gray-400">
      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
      </svg>
    </div>
  );
}

export function NewExpenseFormPanel({
  egresoMode,
  onEgresoModeChange,
  centers,
  selectedCnId,
  onCnChange,
  cnOpenBoxes,
  selectedBoxId,
  onBoxChange,
  expenseType,
  onExpenseTypeChange,
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
}: NewExpenseFormPanelProps) {
  return (
    <div className="flex flex-col space-y-4">
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-center space-x-6 py-4 px-2 border-b border-gray-100 bg-[#F9FAFB]">
          <label className="flex items-center space-x-2 text-xs font-black text-gray-700 cursor-pointer">
            <input
              type="radio"
              name="egresoMode"
              value="gasto"
              checked={egresoMode === 'gasto'}
              onChange={() => onEgresoModeChange('gasto')}
              className="w-4.5 h-4.5 text-[#6A008A] focus:ring-[#6A008A] accent-[#6A008A] cursor-pointer"
            />
            <span>Crear Gasto</span>
          </label>
          <label className="flex items-center space-x-2 text-xs font-black text-gray-700 cursor-pointer">
            <input
              type="radio"
              name="egresoMode"
              value="retiro"
              checked={egresoMode === 'retiro'}
              onChange={() => onEgresoModeChange('retiro')}
              className="w-4.5 h-4.5 text-[#6A008A] focus:ring-[#6A008A] accent-[#6A008A] cursor-pointer"
            />
            <span>Crear Retiro CN principal</span>
          </label>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-gray-900 font-extrabold text-sm block tracking-tight">
              CN<span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="relative">
              <select
                value={selectedCnId}
                onChange={(e) => onCnChange(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm font-semibold text-gray-800 bg-white outline-none focus:border-[#6A008A] appearance-none cursor-pointer"
              >
                {centers.map((center) => (
                  <option key={center.id} value={center.id}>
                    {center.name}
                  </option>
                ))}
              </select>
              <SelectChevron />
            </div>
          </div>

          {egresoMode === 'gasto' && (
            <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
              <label className="text-gray-900 font-extrabold text-sm block tracking-tight">
                Caja<span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="relative">
                <select
                  id="box-select"
                  value={selectedBoxId}
                  onChange={(e) => onBoxChange(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm font-semibold text-gray-800 bg-white outline-none focus:border-[#6A008A] appearance-none cursor-pointer"
                >
                  <option value="">Seleccione caja</option>
                  {cnOpenBoxes.map((box) => (
                    <option key={box.id} value={box.id}>
                      {box.userName || 'Cobrador'} ({box.unitName || 'Caja'})
                    </option>
                  ))}
                </select>
                <SelectChevron />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-gray-900 font-extrabold text-sm block tracking-tight">
              Tipo de Egreso<span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="relative">
              <select
                id="expense-type-select"
                value={expenseType}
                onChange={(e) => onExpenseTypeChange(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm font-semibold text-gray-800 bg-white outline-none focus:border-[#6A008A] appearance-none cursor-pointer"
              >
                <option value="">Seleccione Tipo de movimiento</option>
                <option value="gasolina">Gasolina</option>
                <option value="aceite">Aceite</option>
                <option value="sueldo">Sueldo</option>
                <option value="arriendo">Arriendo</option>
                <option value="pinchada">Pinchada</option>
                <option value="arreglo moto">Arreglo Moto</option>
                <option value="almuerzo trabajador">Almuerzo Trabajador</option>
                <option value="recarga telefono">Recarga Teléfono</option>
                <option value="factura controlmax">Factura ControlMax</option>
                <option value="pago internet oficina">Pago Internet Oficina</option>
                <option value="pago cel jf">Pago Cel JF</option>
                <option value="descuadre">Descuadre</option>
                <option value="varios">Varios</option>
                <option value="jefe">JEFE</option>
              </select>
              <SelectChevron />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-gray-900 font-extrabold text-sm block tracking-tight">
              Valor<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              id="expense-amount-input"
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
              Comentario<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              id="expense-comment-input"
              type="text"
              value={comment}
              onChange={(e) => onCommentChange(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-[#6A008A] bg-white"
              placeholder="Ingrese Comentario"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-gray-900 font-extrabold text-sm block tracking-tight">
              Descripción<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              id="expense-desc-input"
              type="text"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-[#6A008A] bg-white"
              placeholder="ingrese descripción"
            />
          </div>

          <div className="space-y-1.5 pt-1">
            <label className="text-gray-900 font-extrabold text-sm block tracking-tight">Seleccione Archivo</label>
            <input
              type="file"
              id="expense-file-input"
              className="hidden"
              onChange={onFileChange}
              accept="image/*,application/pdf"
            />
            {fileName ? (
              <div className="border border-green-300 rounded-xl bg-green-50/50 p-3.5 flex items-center justify-between animate-in fade-in duration-200">
                <div className="flex items-center space-x-3 text-xs text-[#333333] font-medium truncate">
                  {fileUrl.startsWith('data:image/') ? (
                    <img
                      src={fileUrl}
                      alt="Preview"
                      className="w-10 h-10 object-cover rounded border border-gray-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
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
            ) : (
              <label
                htmlFor="expense-file-input"
                className="border border-gray-200 bg-[#F9FAFB] rounded-xl flex flex-col items-center justify-center py-5 px-4 cursor-pointer hover:bg-gray-100/70 transition-colors shadow-xs"
              >
                <span className="text-sm text-gray-900 font-extrabold tracking-tight">Escolher arquivos</span>
                <span className="text-xs text-gray-400 mt-1 font-bold">Nenhum a... escolhido</span>
              </label>
            )}
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

      <div className="pt-2 flex flex-col space-y-2.5 max-w-xs mx-auto w-full">
        <button
          id="btn-save-expense"
          disabled={saving || (egresoMode === 'gasto' && !selectedBoxId)}
          onClick={onSaveClick}
          className="w-full bg-[#8CC63F] text-black font-extrabold py-3.5 text-sm flex justify-center items-center rounded-full shadow-md disabled:opacity-50 hover:bg-[#7bb335] active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
        >
          {saving ? (
            <svg className="animate-spin h-4 w-4 mr-1.5 text-black" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : null}
          {saving ? 'GUARDANDO...' : 'Guardar'}
        </button>

        <button
          id="btn-cancel-expense"
          disabled={saving}
          onClick={() => onNavigate?.('dashboard')}
          className="w-full bg-white text-gray-800 border border-gray-300 font-extrabold py-3.5 text-sm flex justify-center items-center rounded-full shadow-xs hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
        >
          Cancelar
        </button>

        <button
          id="btn-back-to-summary"
          disabled={saving}
          onClick={() => onNavigate?.('dashboard')}
          className="w-full bg-white text-gray-800 border border-gray-300 font-extrabold py-3.5 text-sm flex justify-center items-center rounded-full shadow-xs hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
        >
          Volver A Resumen
        </button>
      </div>
    </div>
  );
}
