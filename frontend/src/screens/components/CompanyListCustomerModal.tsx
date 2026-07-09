import { useState } from 'react';
import { X } from 'lucide-react';
import { Customer } from '../../types/company';
import { CustomerModalBasicTab } from './customerModal/CustomerModalBasicTab';
import { CustomerModalLocationsTab } from './customerModal/CustomerModalLocationsTab';
import { CustomerModalPhotosTab } from './customerModal/CustomerModalPhotosTab';
import { CustomerModalReferencesTab } from './customerModal/CustomerModalReferencesTab';
import { CustomerModalSalesTab } from './customerModal/CustomerModalSalesTab';
import { CustomerModalTabBar } from './customerModal/CustomerModalTabBar';
import { CustomerDisplayName, CustomerModalSubTab, CustomerWhatsappContact } from './customerModal/types';

interface CustomerDetailModalProps {
  customer: Customer;
  onClose: () => void;
}

export function CustomerDetailModal({ customer, onClose }: CustomerDetailModalProps) {
  const [activeSubTab, setActiveSubTab] = useState<CustomerModalSubTab>('basic');
  const [displayName, setDisplayName] = useState<CustomerDisplayName>({
    first: customer.name || 'cliente',
    last: customer.apellidos || '',
  });
  const [whatsappContact, setWhatsappContact] = useState<CustomerWhatsappContact>({
    prefix: customer.celularPrefix || '55',
    number: customer.celular || '',
  });

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full hover:bg-gray-100 z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-6 pt-6 pb-2 text-left">
          <h2 className="text-2xl font-light tracking-wide text-gray-800 lowercase first-letter:uppercase">
            {displayName.first || 'cliente'} {displayName.last}
          </h2>
        </div>

        <CustomerModalTabBar activeSubTab={activeSubTab} onChange={setActiveSubTab} />

        <div className="p-6 overflow-y-auto flex-1 space-y-4 max-h-[60vh] text-left">
          {activeSubTab === 'basic' && (
            <CustomerModalBasicTab
              customer={customer}
              onClose={onClose}
              onDisplayNameChange={setDisplayName}
              onContactChange={setWhatsappContact}
            />
          )}
          {activeSubTab === 'locations' && <CustomerModalLocationsTab customer={customer} />}
          {activeSubTab === 'references' && <CustomerModalReferencesTab customer={customer} />}
          {activeSubTab === 'sales' && <CustomerModalSalesTab customer={customer} />}
          {activeSubTab === 'photos' && <CustomerModalPhotosTab customer={customer} />}
        </div>

        {whatsappContact.number && (
          <a
            href={`https://wa.me/${whatsappContact.prefix + whatsappContact.number.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 md:absolute md:bottom-6 md:right-6 bg-[#25D366] hover:bg-[#20ba5a] text-white p-3.5 rounded-full shadow-lg transition-transform hover:scale-110 z-50 flex items-center justify-center cursor-pointer"
            title="Contactar por WhatsApp"
          >
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.45 5.167 0 9.378-4.21 9.38-9.384.002-2.507-.972-4.866-2.74-6.637C16.145 2.813 13.79 1.838 11.3 1.837c-5.18 0-9.4 4.21-9.403 9.383-.001 1.622.42 3.209 1.218 4.606L2.116 21.6l5.962-1.562c1.373.748 2.871 1.139 4.398 1.14h.01zm11.233-6.233c-.312-.156-1.848-.91-2.133-1.014-.286-.104-.494-.156-.701.156-.207.312-.804.104-.986.312-.18.207-.364.228-.675.072-.312-.156-1.316-.484-2.507-1.547-.927-.827-1.553-1.849-1.735-2.16-.182-.312-.02-.48.136-.635.14-.14.312-.364.468-.546.156-.182.208-.312.312-.52.104-.207.052-.39-.026-.546-.078-.156-.7-.156-.96-.468-.255-.312-.47-.234-.64-.234-.17 0-.364-.02-.56-.02-.196 0-.515.072-.784.364-.27.292-1.026 1.001-1.026 2.441 0 1.44 1.047 2.829 1.192 3.024.145.195 2.058 3.14 4.985 4.402.696.3 1.239.479 1.663.613.7.223 1.338.192 1.843.117.563-.085 1.728-.707 1.972-1.391.243-.684.243-1.27.17-1.391-.073-.12-.27-.193-.582-.349z" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}
