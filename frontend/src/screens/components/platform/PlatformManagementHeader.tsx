import { RefreshCw, Save, Sliders } from 'lucide-react';

interface PlatformManagementHeaderProps {
  saving: boolean;
  onSave: () => void;
}

export function PlatformManagementHeader({ saving, onSave }: PlatformManagementHeaderProps) {
  return (
    <div className="bg-[#6A008A] p-5 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#52006A] shadow-inner relative overflow-hidden">
      <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute left-1/3 bottom-0 translate-y-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

      <div className="flex items-start gap-3.5 relative z-10">
        <div className="bg-white/10 p-2.5 rounded-xl border border-white/20">
          <Sliders className="w-6 h-6 text-[#8CC63F]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black uppercase tracking-wider text-white">Gestión de la Plataforma</h2>
            <span className="bg-[#8CC63F] text-[#4A0063] font-black text-[9px] px-2 py-0.5 rounded-full border border-white/20 uppercase tracking-widest">
              Admin Console
            </span>
          </div>
          <p className="text-xs text-purple-100/90 mt-1 font-medium">
            Ajustes globales de marca, topes de operación, módulos del ecosistema e índices de seguridad de su empresa.
          </p>
        </div>
      </div>

      <button
        onClick={onSave}
        disabled={saving}
        className="bg-[#8CC63F] hover:bg-[#7cb337] active:scale-98 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all uppercase tracking-wider shrink-0 relative z-10 cursor-pointer disabled:opacity-50 border border-white/10"
      >
        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        <span>Guardar Configuración</span>
      </button>
    </div>
  );
}
