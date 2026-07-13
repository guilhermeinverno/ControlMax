import { Loader2, Trash2 } from 'lucide-react';
import { FormDefinition } from '../../../types';
import { listViewBody } from '../../../utils/listViewBody';

interface FormsListTabProps {
  formsList: FormDefinition[];
  loadingForms: boolean;
  isAdminOrSupervisor: boolean;
  onOpenFilling: (form: FormDefinition) => void;
  onDeleteForm: (formId: string) => void;
}

export function FormsListTab({
  formsList,
  loadingForms,
  isAdminOrSupervisor,
  onOpenFilling,
  onDeleteForm,
}: FormsListTabProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide">Formularios Disponibles</h2>
        <p className="text-[11px] text-gray-400">Total: {formsList.length}</p>
      </div>

      {listViewBody(
        loadingForms,
        formsList.length,
        (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-700 mb-2" />
            <p className="text-xs text-gray-400">Sincronizando encuestas...</p>
          </div>
        ),
        (
          <div className="text-center py-12 text-gray-400 text-xs">
            No hay formularios creados para este canal.{' '}
            {isAdminOrSupervisor && '¡Crea uno nuevo usando la pestaña de arriba!'}
          </div>
        ),
        (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {formsList.map((form) => (
              <div
                key={form.id}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-white transition-all hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-bold text-gray-900 text-sm leading-tight">{form.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 leading-snug line-clamp-2">
                    {form.description || 'Sin descripción.'}
                  </p>
                  <div className="text-[10px] text-purple-700 font-bold mt-2.5 bg-purple-50 px-2 py-0.5 rounded w-fit">
                    {form.fields.length} campos de entrada
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-gray-150">
                  <button
                    onClick={() => onOpenFilling(form)}
                    className="flex-1 bg-purple-700 hover:bg-purple-800 text-white text-center font-bold py-1.5 px-3 rounded text-[11px] transition-colors cursor-pointer"
                  >
                    Responder
                  </button>
                  {isAdminOrSupervisor ? (
                    <button
                      onClick={() => onDeleteForm(form.id)}
                      className="p-1.5 border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 rounded transition-colors cursor-pointer"
                      title="Eliminar Formulario"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
