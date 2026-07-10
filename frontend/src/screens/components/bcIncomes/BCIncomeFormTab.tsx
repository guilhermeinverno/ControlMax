import {
  AlertCircle,
  CheckCircle2,
  History,
  Info,
  Loader2,
} from 'lucide-react';
import type { HtmlFormSubmitEvent, HtmlInputChangeEvent } from '../../../types/reactEvents';
import type { BCIncome } from '../../../types/bcIncome';
import type { Box } from '../../../types';

interface BCIncomeFormTabProps {
  activeBox: Box | null;
  formError: string | null;
  formSuccess: string | null;
  formCnId: string;
  formCnName: string;
  category: BCIncome['category'];
  amountInput: string;
  description: string;
  submitting: boolean;
  onSubmit: (e: HtmlFormSubmitEvent) => void;
  onViewHistory: () => void;
  onFormCnChange: (cnId: string, cnName: string) => void;
  onCategoryChange: (category: BCIncome['category']) => void;
  onAmountChange: (e: HtmlInputChangeEvent) => void;
  onDescriptionChange: (value: string) => void;
}

export function BCIncomeFormTab({
  activeBox,
  formError,
  formSuccess,
  formCnId,
  category,
  amountInput,
  description,
  submitting,
  onSubmit,
  onViewHistory,
  onFormCnChange,
  onCategoryChange,
  onAmountChange,
  onDescriptionChange,
}: BCIncomeFormTabProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-2">
        Registrar Novo Ingresso no CN
      </h2>

      {formError && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded text-xs flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {formSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded text-xs flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0 text-green-600" />
          <span>{formSuccess}</span>
        </div>
      )}

      <div className="flex flex-col">
        <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">
          Centro de Negócios (CN) <span className="text-red-500">*</span>
        </label>
        <select
          value={formCnId}
          onChange={(e) => onFormCnChange(e.target.value, e.target.options[e.target.selectedIndex].text)}
          className="border border-gray-300 rounded p-2.5 text-sm bg-white outline-none focus:border-[#6B21A8]"
        >
          <option value="cn_padrao">CN de la sociedad 6501</option>
          <option value="cn_b">CN Filial Principal</option>
        </select>
        <span className="text-[10px] text-gray-400 mt-1 italic">
          * Pendente: Vincular com centros de negócios reais em atualizações futuras.
        </span>
      </div>

      <div className="flex items-center space-x-2 bg-purple-50 border border-purple-100 p-2.5 rounded text-xs text-purple-800">
        <Info className="w-4 h-4 text-purple-600 flex-shrink-0" />
        <span>
          {activeBox ? (
            <>
              Suas operações de caixa estão abertas em: <strong>{activeBox.cnName}</strong>.
            </>
          ) : (
            <>Você não possui uma caixa aberta atualmente, mas pode registrar ingressos diretos ao CN.</>
          )}
        </span>
      </div>

      <div className="flex flex-col">
        <label className="text-[11px] font-bold text-[#555555] uppercase mb-1">
          Categoria de Entrada <span className="text-red-500">*</span>
        </label>
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value as BCIncome['category'])}
          className="border border-gray-300 rounded p-2.5 text-sm bg-white outline-none focus:border-[#6B21A8]"
        >
          <option value="deposit">Depósito Bancário</option>
          <option value="transfer">Transferência Pix</option>
          <option value="contribution">Aporte de Capital</option>
          <option value="other">Outros Recebimentos</option>
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
            className="w-full border border-gray-300 rounded p-2.5 pl-9 text-sm text-[#333333] outline-none font-bold focus:border-[#6B21A8]"
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
          placeholder="Ex: Depósito ref. cobrança geral, transferência sócio investidor, etc."
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="border border-gray-300 rounded p-2.5 text-sm text-[#333333] outline-none focus:border-[#6B21A8]"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-100">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-[#16A34A] hover:bg-[#15803d] text-white font-bold py-3 rounded-md text-xs shadow-sm flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <CheckCircle2 className="w-4 h-4 mr-2" />
          )}
          Salvar Ingresso
        </button>
        <button
          type="button"
          onClick={onViewHistory}
          className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-md text-xs shadow-sm transition-colors cursor-pointer flex items-center justify-center"
        >
          <History className="w-4 h-4 mr-2 text-purple-600" />
          Ver Histórico
        </button>
      </div>
    </form>
  );
}
