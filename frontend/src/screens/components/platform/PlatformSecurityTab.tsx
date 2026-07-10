import { CheckSquare, Clock, HelpCircle, Lock, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { PlatformToggle, type PlatformTabProps } from './platformShared';

export function PlatformSecurityTab({ settings, onChange }: PlatformTabProps) {
  return (
    <motion.div
      key="security"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-xs font-black text-[#6A008A] uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <Lock className="w-4 h-4 text-[#8CC63F]" />
          Seguridad Operativa & Control Horario
        </h3>
        <p className="text-xs text-gray-500 font-medium">
          Configure las restricciones de seguridad para resguardar la caja y prevenir fraudes operacionales fuera de horarios comerciales.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-[11px] font-black text-gray-600 mb-1.5 uppercase tracking-widest">
            Inicio de Jornada Permitido (Hora)
          </label>
          <div className="relative">
            <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="time"
              value={settings.operatingHoursStart}
              onChange={(e) => onChange('operatingHoursStart', e.target.value)}
              className="w-full border border-gray-300 rounded-xl pl-9.5 pr-3.5 py-2 text-xs font-bold focus:border-[#6A008A] outline-none text-gray-800 shadow-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-black text-gray-600 mb-1.5 uppercase tracking-widest">
            Límite de Cierre de Jornada (Hora)
          </label>
          <div className="relative">
            <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="time"
              value={settings.operatingHoursEnd}
              onChange={(e) => onChange('operatingHoursEnd', e.target.value)}
              className="w-full border border-gray-300 rounded-xl pl-9.5 pr-3.5 py-2 text-xs font-bold focus:border-[#6A008A] outline-none text-gray-800 shadow-xs"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="border border-red-200 bg-red-50/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex gap-3">
            <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-xs font-extrabold text-red-700 uppercase tracking-wide">Modo de Bloqueo de Emergencia</strong>
              <p className="text-[11px] text-gray-500 font-medium">
                Bloquear temporalmente a todos los cobradores y vendedores para auditorías de caja repentinas.
              </p>
            </div>
          </div>
          <PlatformToggle
            enabled={settings.maintenanceMode}
            onToggle={() => onChange('maintenanceMode', !settings.maintenanceMode)}
            activeClass="bg-red-500"
          />
        </div>

        <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex gap-3">
            <HelpCircle className="w-5 h-5 text-[#6A008A] shrink-0 mt-0.5" />
            <div>
              <strong className="block text-xs font-extrabold text-gray-800 uppercase tracking-wide">Verificación de Dispositivo Requerida</strong>
              <p className="text-[11px] text-gray-500 font-medium">
                Restringir el acceso exclusivo al aplicativo únicamente a teléfonos y tablets registrados y homologados.
              </p>
            </div>
          </div>
          <PlatformToggle
            enabled={settings.requireDeviceVerification}
            onToggle={() => onChange('requireDeviceVerification', !settings.requireDeviceVerification)}
          />
        </div>

        <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex gap-3">
            <CheckSquare className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-xs font-extrabold text-gray-800 uppercase tracking-wide">Permitir Sincronización Offline de Recaudos</strong>
              <p className="text-[11px] text-gray-500 font-medium">
                Habilitar el almacenamiento temporal cifrado de recibos locales cuando no haya cobertura a internet.
              </p>
            </div>
          </div>
          <PlatformToggle
            enabled={settings.allowOfflineSync}
            onToggle={() => onChange('allowOfflineSync', !settings.allowOfflineSync)}
          />
        </div>
      </div>
    </motion.div>
  );
}
