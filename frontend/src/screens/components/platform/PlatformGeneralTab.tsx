import { Mail, Megaphone, Phone, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import type { PlatformTabProps } from './platformShared';

export function PlatformGeneralTab({ settings, onChange }: PlatformTabProps) {
  return (
    <motion.div
      key="general"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-xs font-black text-[#6A008A] uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#8CC63F]" />
          Branding & Identidad Corporativa
        </h3>
        <p className="text-xs text-gray-500 font-medium">
          Personalice la firma, el logotipo de soporte y el nombre representativo que verán los operadores.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-[11px] font-black text-gray-600 mb-1.5 uppercase tracking-widest">
            Nombre de la Plataforma / Empresa *
          </label>
          <input
            type="text"
            required
            value={settings.platformName}
            onChange={(e) => onChange('platformName', e.target.value)}
            placeholder="Ej. ControlMax Nordeste"
            className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-semibold focus:border-[#6A008A] outline-none text-gray-800 shadow-xs"
          />
        </div>

        <div>
          <label className="block text-[11px] font-black text-gray-600 mb-1.5 uppercase tracking-widest">
            Slogan o Frase Descriptiva
          </label>
          <input
            type="text"
            value={settings.slogan}
            onChange={(e) => onChange('slogan', e.target.value)}
            placeholder="Ej. Eficacia y Control en Microfinanzas"
            className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-semibold focus:border-[#6A008A] outline-none text-gray-850 shadow-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-[11px] font-black text-gray-600 mb-1.5 uppercase tracking-widest">
            Teléfono de Soporte (WhatsApp) *
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={settings.supportPhone}
              onChange={(e) => onChange('supportPhone', e.target.value)}
              placeholder="Ej. +5511999999999"
              className="w-full border border-gray-300 rounded-xl pl-9.5 pr-3.5 py-2 text-xs font-semibold focus:border-[#6A008A] outline-none text-gray-800 shadow-xs font-mono"
            />
          </div>
          <span className="text-[10px] text-gray-400 mt-1 block">
            Usado para redirigir en el botón flotante del asistente. Formato internacional con código de país.
          </span>
        </div>

        <div>
          <label className="block text-[11px] font-black text-gray-600 mb-1.5 uppercase tracking-widest">
            Correo Electrónico de Contacto
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={settings.supportEmail}
              onChange={(e) => onChange('supportEmail', e.target.value)}
              placeholder="Ej. suporte@empresa.com"
              className="w-full border border-gray-300 rounded-xl pl-9.5 pr-3.5 py-2 text-xs font-semibold focus:border-[#6A008A] outline-none text-gray-800 shadow-xs"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-black text-gray-600 mb-1.5 uppercase tracking-widest">
          URL de Logotipo Corporativo (Opcional)
        </label>
        <input
          type="url"
          value={settings.logoUrl}
          onChange={(e) => onChange('logoUrl', e.target.value)}
          placeholder="https://su-plataforma.com/logo.png"
          className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-semibold focus:border-[#6A008A] outline-none text-gray-800 shadow-xs font-mono"
        />
        <span className="text-[10px] text-gray-400 mt-1 block">
          Introduzca una URL directa para reemplazar el logotipo por defecto del menú principal.
        </span>
      </div>

      <div className="bg-[#FAF5FF] border border-purple-200 rounded-xl p-4 flex gap-3 text-xs text-[#6A008A]">
        <Megaphone className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <strong className="block mb-0.5 uppercase tracking-wider text-[10px]">Anuncio Corporativo Integrado</strong>
          <p className="text-gray-650 leading-relaxed">
            El banner global configurado se mostrará para mantener al tanto de las novedades a todos los colaboradores con sesión activa.
          </p>
          <input
            type="text"
            value={settings.bannerMessage}
            onChange={(e) => onChange('bannerMessage', e.target.value)}
            placeholder="Ej. ¡Felicitaciones al equipo! Meta de recaudo superada ayer."
            className="w-full bg-white border border-purple-300 rounded-lg px-3 py-1.5 mt-2.5 outline-none focus:border-[#6A008A] text-xs font-bold text-gray-800"
          />
        </div>
      </div>
    </motion.div>
  );
}
