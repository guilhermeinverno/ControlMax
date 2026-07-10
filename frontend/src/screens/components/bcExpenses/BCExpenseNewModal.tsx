import {
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
  PlusCircle,
  X,
} from 'lucide-react';
import type { HtmlFormSubmitEvent, HtmlInputChangeEvent } from '../../../types/reactEvents';
import type { BCExpense } from '../../../types/bcExpense';

interface BCExpenseNewModalProps {
  isOpen: boolean;
  isAdmin: boolean;
  formError: string | null;
  formSuccess: string | null;
  formCnId: string;
  category: BCExpense['category'];
  amountInput: string;
  description: string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: HtmlFormSubmitEvent) => void;
  onFormCnChange: (cnId: string, cnName: string) => void;
  onCategoryChange: (category: BCExpense['category']) => void;
  onAmountChange: (e: HtmlInputChangeEvent) => void;
  onDescriptionChange: (value: string) => void;
  onClearError: () => void;
}

export function BCExpenseNewModal({
  isOpen,
  isAdmin,
  formError,
  formSuccess,
  formCnId,
  category,
  amountInput,
  description,
  submitting,
  onClose,
  onSubmit,
  onFormCnChange,
  onCategoryChange,
  onAmountChange,
  onDescriptionChange,
  onClearError,
}: BCExpenseNewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center">
            <PlusCircle className="w-4 h-4 mr-1.5 text-[#6B21A8]" />
            Registrar Novo Egreso no CN
          </h2>
          <button
            onClick={() => {
              onClose();
              onClearError();
            }}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded text-xs flex items-center mt-4">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {formSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded text-xs flex items-center mt-4">
            <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0 text-green-600" />
            <span>{formSuccess}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4 mt-4">
          <div className="flex flex-col">
            <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">
              Centro de Negócios (CN) <span className="text-red-500">*</span>
            </label>
            <select
              value={formCnId}
              onChange={(e) => onFormCnChange(e.target.value, e.target.options[e.target.selectedIndex].text)}
              className="border border-gray-300 rounded p-2.5 text-xs bg-white outline-none focus:border-[#6B21A8]"
            >
              <option value="cn_padrao">CN de la sociedad 6501</option>
              <option value="cn_b">CN Filial Principal</option>
            </select>
            <span className="text-[10px] text-gray-400 mt-1 italic">
              * Pendente: Vincular com centros de negócios reais em atualizações futuras.
            </span>
          </div>

          <div className="flex flex-col">
            <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">
              Categoria de Saída <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value as BCExpense['category'])}
              className="border border-gray-300 rounded p-2.5 text-xs bg-white outline-none focus:border-[#6B21A8]"
            >
              <option value="supplies">Suprimentos</option>
              <option value="salary">Salário</option>
              <option value="rent">Aluguel</option>
              <option value="transport">Transporte</option>
              <option value="other">Outros</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">
              Valor ($) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm text-gray-500 font-bold">$</span>
              <input
                type="text"
                required
                value={amountInput}
                onChange={onAmountChange}
                placeholder="0,00"
                className="w-full border border-gray-300 rounded p-2.5 pl-9 text-xs text-[#333333] outline-none font-bold focus:border-[#6B21A8]"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">
              Descrição / Comprovante <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Ex: Pagamento do aluguel da sede, compra de insumos operacionais, frete, etc."
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="border border-gray-300 rounded p-2.5 text-xs text-[#333333] outline-none focus:border-[#6B21A8]"
            />
          </div>

          <div className="bg-purple-50 border border-purple-100 p-2.5 rounded text-[11px] text-purple-800 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
            <span>
              {isAdmin
                ? "Como Administrador, o egreso será automaticamente aprovado e deduzido do saldo."
                : "Como Supervisor, o egreso será registrado como 'Pendente' para validação administrativa."}
            </span>
          </div>

          <div className="flex gap-2 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                onClose();
                onClearError();
              }}
              className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-2.5 rounded-md text-xs transition-colors cursor-pointer text-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-[#16A34A] hover:bg-[#15803d] text-white font-bold py-2.5 rounded-md text-xs shadow-sm flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Salvar Egreso
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
