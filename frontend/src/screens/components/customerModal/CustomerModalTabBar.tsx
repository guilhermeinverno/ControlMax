import { Banknote, FileText, Image, MapPin, User } from 'lucide-react';
import { CustomerModalSubTab } from './types';

const TAB_ITEMS: Array<{ id: CustomerModalSubTab; title: string; Icon: typeof FileText }> = [
  { id: 'basic', title: 'Ficha Básica', Icon: FileText },
  { id: 'locations', title: 'Direcciones y Teléfonos', Icon: MapPin },
  { id: 'references', title: 'Referencias', Icon: User },
  { id: 'sales', title: 'Ventas y Pagos', Icon: Banknote },
  { id: 'photos', title: 'Fotos', Icon: Image },
];

interface CustomerModalTabBarProps {
  activeSubTab: CustomerModalSubTab;
  onChange: (tab: CustomerModalSubTab) => void;
}

export function CustomerModalTabBar({ activeSubTab, onChange }: CustomerModalTabBarProps) {
  return (
    <div className="flex justify-around items-center px-4 py-2 bg-gray-50/50 border-b border-gray-100">
      {TAB_ITEMS.map(({ id, title, Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`p-3 rounded-2xl transition-all cursor-pointer ${
            activeSubTab === id
              ? 'bg-[#8CC63F] text-white shadow-sm'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50'
          }`}
          title={title}
        >
          <Icon className="w-5.5 h-5.5" />
        </button>
      ))}
    </div>
  );
}
