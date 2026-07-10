import { FileText } from 'lucide-react';
import type { BusinessCenterUnit } from '../../../types/company';
import type { useCustomerCreateForm } from '../../../hooks/useCustomerCreateForm';
import { useCustomerFormFieldSetters } from './useCustomerFormFieldSetters';
import { CompanyListCreateBasicTab } from './create/CompanyListCreateBasicTab';
import { CompanyListCreateLocationsTab } from './create/CompanyListCreateLocationsTab';
import { CompanyListCreateReferencesTab } from './create/CompanyListCreateReferencesTab';
import { CompanyListCreatePhotosTab } from './create/CompanyListCreatePhotosTab';
import { CompanyListCreateTabBar } from './create/CompanyListCreateTabBar';

interface CompanyListCreateFormProps {
  createForm: ReturnType<typeof useCustomerCreateForm>;
  activeUnitsList: BusinessCenterUnit[];
  onCancel: () => void;
}

export function CompanyListCreateForm({ createForm, activeUnitsList, onCancel }: CompanyListCreateFormProps) {
  const fields = useCustomerFormFieldSetters(createForm);

  const tabContent = {
    basic: <CompanyListCreateBasicTab fields={fields} activeUnitsList={activeUnitsList} />,
    locations: <CompanyListCreateLocationsTab fields={fields} />,
    references: <CompanyListCreateReferencesTab fields={fields} />,
    photos: <CompanyListCreatePhotosTab fields={fields} />,
  }[fields.createActiveSubTab];

  return (
    <form onSubmit={fields.handleSubmit} className="space-y-4 max-w-4xl mx-auto bg-white rounded-3xl p-6 border border-gray-100">
      <h3 className="text-sm font-black text-[#6B21A8] uppercase tracking-wider border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-[#8CC63F]" />
        Ficha de Registro Operativo (Nuevo Cliente)
      </h3>

      <CompanyListCreateTabBar
        activeSubTab={fields.createActiveSubTab}
        setActiveSubTab={fields.setCreateActiveSubTab}
      />

      <div className="space-y-4">{tabContent}</div>

      <div className="flex justify-end gap-3.5 pt-6 border-t border-gray-100 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-5 py-2.5 rounded text-xs transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={fields.submitting}
          className="bg-[#6B21A8] hover:bg-[#52006A] text-white font-bold px-6 py-2.5 rounded text-xs transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
        >
          {fields.submitting ? 'Guardando...' : 'Crear nuevo cliente'}
        </button>
      </div>
    </form>
  );
}
