import { ShieldAlert } from 'lucide-react';
import { Screen } from '../../../types';

interface PlatformUnauthorizedViewProps {
  onNavigate?: (screen: Screen) => void;
}

export function PlatformUnauthorizedView({ onNavigate }: PlatformUnauthorizedViewProps) {
  return (
    <div className="bg-white border border-red-200 rounded-xl p-8 max-w-lg mx-auto text-center shadow-md">
      <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4 animate-bounce" />
      <h3 className="text-base font-black text-red-600 uppercase tracking-wide">Acceso Restringido</h3>
      <p className="text-xs text-gray-650 mt-2">
        Lo sentimos, el panel de <strong>Gestión de la Plataforma</strong> está reservado únicamente para Administradores de Cuenta y propietarios de licencias SaaS.
      </p>
      <button
        onClick={() => onNavigate?.('dashboard')}
        className="mt-6 bg-gray-800 hover:bg-gray-900 text-white font-bold text-xs py-2 px-4 rounded-lg uppercase tracking-wider transition-all cursor-pointer"
      >
        Volver al Inicio
      </button>
    </div>
  );
}
