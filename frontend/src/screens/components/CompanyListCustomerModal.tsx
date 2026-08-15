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
  onSaveSuccess?: (customer: Customer) => void;
}

export function CustomerDetailModal({ customer, onClose, onSaveSuccess }: CustomerDetailModalProps) {
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
              onSaveSuccess={onSaveSuccess}
            />
          )}
          {activeSubTab === 'locations' && <CustomerModalLocationsTab customer={customer} />}
          {activeSubTab === 'references' && <CustomerModalReferencesTab customer={customer} />}
          {activeSubTab === 'sales' && <CustomerModalSalesTab customer={customer} />}
          {activeSubTab === 'photos' && <CustomerModalPhotosTab customer={customer} />}
        </div>


      </div>
    </div>
  );
}
