import { DollarSign, Percent } from 'lucide-react';
import { motion } from 'motion/react';
import { PlatformToggle, type PlatformTabProps } from './platformShared';

export function PlatformFinancialTab({ settings, onChange }: PlatformTabProps) {
  return (
    <motion.div
      key="financial"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-xs font-black text-[#6A008A] uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <DollarSign className="w-4 h-4 text-[#8CC63F]" />
          Parámetros Operativos & Finanzas
        </h3>
        <p className="text-xs text-gray-500 font-medium">
          Configure las tasas mensuales base, el recargo regulado de mora y los límites operacionales de cartera de su inquilino.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-[11px] font-black text-gray-600 mb-1.5 uppercase tracking-widest">
            Divisa Predeterminada
          </label>
          <select
            value={settings.currency}
            onChange={(e) => onChange('currency', e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-semibold focus:border-[#6A008A] outline-none bg-white text-gray-800 shadow-xs"
          >
            <option value="COP">COP ($ Peso Colombiano)</option>
            <option value="BRL">BRL (R$ Real Brasileño)</option>
            <option value="USD">USD ($ Dólar Americano)</option>
            <option value="EUR">EUR (€ Euro)</option>
            <option value="MXN">MXN ($ Peso Mexicano)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-black text-gray-600 mb-1.5 uppercase tracking-widest">
            Límite Máximo de Crédito por Solicitud ($)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 text-gray-400 font-extrabold text-xs top-1/2 -translate-y-1/2">$</span>
            <input
              type="number"
              value={settings.maxCreditLimit / 100}
              onChange={(e) => onChange('maxCreditLimit', Math.round(Number(e.target.value) * 100))}
              placeholder="Ej. 100000"
              className="w-full border border-gray-300 rounded-xl pl-7.5 pr-3.5 py-2 text-xs font-bold focus:border-[#6A008A] outline-none text-gray-850 shadow-xs"
            />
          </div>
          <span className="text-[10px] text-gray-400 mt-1 block">
            Tope de control interno para la aprobación masiva y automática de solicitudes de crédito.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-[11px] font-black text-gray-600 mb-1.5 uppercase tracking-widest">
            Tasa de Interés Base Mensual (%)
          </label>
          <div className="relative">
            <span className="absolute right-3.5 text-gray-400 font-bold text-xs top-1/2 -translate-y-1/2">% mes</span>
            <input
              type="number"
              value={settings.defaultMonthlyInterest}
              onChange={(e) => onChange('defaultMonthlyInterest', Number(e.target.value))}
              placeholder="Ej. 20"
              className="w-full border border-gray-300 rounded-xl pl-3.5 pr-14 py-2 text-xs font-bold focus:border-[#6A008A] outline-none text-gray-800 shadow-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-black text-gray-600 mb-1.5 uppercase tracking-widest">
            Tasa de Recargo de Mora Diario (%)
          </label>
          <div className="relative">
            <span className="absolute right-3.5 text-gray-400 font-bold text-xs top-1/2 -translate-y-1/2">% diario</span>
            <input
              type="number"
              value={settings.defaultLateFeePercentage}
              onChange={(e) => onChange('defaultLateFeePercentage', Number(e.target.value))}
              placeholder="Ej. 5"
              className="w-full border border-gray-300 rounded-xl pl-3.5 pr-16 py-2 text-xs font-bold focus:border-[#6A008A] outline-none text-gray-800 shadow-xs"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
        <div className="flex gap-3">
          <Percent className="w-5 h-5 text-[#6A008A] shrink-0 mt-0.5" />
          <div>
            <strong className="block text-xs font-extrabold text-gray-800 uppercase tracking-wide">Refinanciación de Contratos</strong>
            <p className="text-[11px] text-gray-500 font-medium">
              Permitir que el administrador supervisor refinancie de forma masiva cobros atrasados.
            </p>
          </div>
        </div>
        <PlatformToggle
          enabled={settings.allowRefinance}
          onToggle={() => onChange('allowRefinance', !settings.allowRefinance)}
        />
      </div>
    </motion.div>
  );
}
