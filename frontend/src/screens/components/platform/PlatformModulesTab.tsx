import { AppWindow, DollarSign, Info, Map, MessageSquare, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { PlatformToggle, type PlatformTabProps } from './platformShared';

export function PlatformModulesTab({ settings, onChange }: PlatformTabProps) {
  return (
    <motion.div
      key="modules"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-xs font-black text-[#6A008A] uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <AppWindow className="w-4 h-4 text-[#8CC63F]" />
          Gestión de Módulos & Integraciones
        </h3>
        <p className="text-xs text-gray-500 font-medium">
          Habilite o restrinja módulos del sistema según el flujo y las prioridades comerciales de su equipo.
        </p>
      </div>

      <div className="space-y-4">
        <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:bg-gray-50/50 transition-all">
          <div className="flex gap-3">
            <Map className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-xs font-extrabold text-gray-800 uppercase tracking-wide">Módulo de Mapas y Geolocalización</strong>
              <p className="text-[11px] text-gray-500 font-medium">
                Seguimiento cartográfico en tiempo real de los cobradores e impresión de rutas comerciales.
              </p>
            </div>
          </div>
          <PlatformToggle enabled={settings.enableMap} onToggle={() => onChange('enableMap', !settings.enableMap)} />
        </div>

        <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:bg-gray-50/50 transition-all">
          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-xs font-extrabold text-gray-800 uppercase tracking-wide">Módulo de Seguros Obligatorios</strong>
              <p className="text-[11px] text-gray-500 font-medium">
                Gestión y recaudo de pólizas de deudores para mitigar el riesgo de incumplimiento por fallecimiento.
              </p>
            </div>
          </div>
          <PlatformToggle
            enabled={settings.enableInsurance}
            onToggle={() => onChange('enableInsurance', !settings.enableInsurance)}
          />
        </div>

        <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:bg-gray-50/50 transition-all">
          <div className="flex gap-3">
            <DollarSign className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-xs font-extrabold text-gray-800 uppercase tracking-wide">Módulo de Finanzas y Tesorería Central</strong>
              <p className="text-[11px] text-gray-500 font-medium">
                Auditoría de activos circulantes, caja menor y transferencias interbancarias en el panel.
              </p>
            </div>
          </div>
          <PlatformToggle enabled={settings.enableFinance} onToggle={() => onChange('enableFinance', !settings.enableFinance)} />
        </div>

        <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:bg-gray-50/50 transition-all">
          <div className="flex gap-3">
            <MessageSquare className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-xs font-extrabold text-gray-800 uppercase tracking-wide">Alertas de Notificaciones por WhatsApp</strong>
              <p className="text-[11px] text-gray-500 font-medium">
                Envío automático de recibo digital al cliente inmediatamente después del registro de su pago.
              </p>
            </div>
          </div>
          <PlatformToggle
            enabled={settings.enableWhatsAppAlerts}
            onToggle={() => onChange('enableWhatsAppAlerts', !settings.enableWhatsAppAlerts)}
          />
        </div>
      </div>

      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-gray-650 flex gap-2">
        <Info className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
        <span>
          La inhabilitación de un módulo lo ocultará automáticamente del menú general para todos los operadores de menor rango. Sus registros existentes permanecerán seguros e inalterados en la base de datos Firestore.
        </span>
      </div>
    </motion.div>
  );
}
