import { FileText, Image, MapPin, User } from 'lucide-react';

interface CompanyListCreateTabBarProps {
  activeSubTab: 'basic' | 'locations' | 'references' | 'photos';
  setActiveSubTab: (tab: 'basic' | 'locations' | 'references' | 'photos') => void;
}

export function CompanyListCreateTabBar({ activeSubTab, setActiveSubTab }: CompanyListCreateTabBarProps) {
  return (
    <div className="flex justify-around items-center px-4 py-2 bg-gray-50/50 border border-gray-100 rounded-2xl mb-6">
      <button
        type="button"
        onClick={() => setActiveSubTab('basic')}
        className={`p-3 rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 ${
          activeSubTab === 'basic'
            ? 'bg-[#8CC63F] text-white shadow-sm font-bold text-xs px-4'
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 text-xs'
        }`}
        title="Datos Básicos"
      >
        <FileText className="w-5 h-5" />
        <span className="hidden sm:inline">Datos Básicos</span>
      </button>

      <button
        type="button"
        onClick={() => setActiveSubTab('locations')}
        className={`p-3 rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 ${
          activeSubTab === 'locations'
            ? 'bg-[#8CC63F] text-white shadow-sm font-bold text-xs px-4'
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 text-xs'
        }`}
        title="Ubicaciones y Teléfonos"
      >
        <MapPin className="w-5 h-5" />
        <span className="hidden sm:inline">Adicionales</span>
      </button>

      <button
        type="button"
        onClick={() => setActiveSubTab('references')}
        className={`p-3 rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 ${
          activeSubTab === 'references'
            ? 'bg-[#8CC63F] text-white shadow-sm font-bold text-xs px-4'
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 text-xs'
        }`}
        title="Referencias"
      >
        <User className="w-5 h-5" />
        <span className="hidden sm:inline">Referencias</span>
      </button>

      <button
        type="button"
        onClick={() => setActiveSubTab('photos')}
        className={`p-3 rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 ${
          activeSubTab === 'photos'
            ? 'bg-[#8CC63F] text-white shadow-sm font-bold text-xs px-4'
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 text-xs'
        }`}
        title="Fotos"
      >
        <Image className="w-5 h-5" />
        <span className="hidden sm:inline">Fotos</span>
      </button>
    </div>
  );
}
