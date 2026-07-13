import { PlusCircle, Trash2 } from 'lucide-react';
import { FormField } from '../../../types';

interface FormsBuilderTabProps {
  newFormTitle: string;
  newFormDescription: string;
  builderFields: FormField[];
  fieldLabel: string;
  fieldType: FormField['type'];
  fieldRequired: boolean;
  fieldOptionsRaw: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onFieldLabelChange: (value: string) => void;
  onFieldTypeChange: (value: FormField['type']) => void;
  onFieldRequiredChange: (value: boolean) => void;
  onFieldOptionsChange: (value: string) => void;
  onAddField: () => void;
  onRemoveField: (index: number) => void;
  onSaveForm: () => void;
}

export function FormsBuilderTab({
  newFormTitle,
  newFormDescription,
  builderFields,
  fieldLabel,
  fieldType,
  fieldRequired,
  fieldOptionsRaw,
  onTitleChange,
  onDescriptionChange,
  onFieldLabelChange,
  onFieldTypeChange,
  onFieldRequiredChange,
  onFieldOptionsChange,
  onAddField,
  onRemoveField,
  onSaveForm,
}: FormsBuilderTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-5">
        <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide">Configuración del Formulario</h2>
        <div className="space-y-4">
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-700 mb-1">Título del Formulario *</label>
            <input
              type="text"
              value={newFormTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Ej. Control de Calidad Diaria, Check de Apertura"
              className="border border-gray-300 rounded p-2 text-sm text-gray-800 bg-white focus:outline-none focus:border-purple-600"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-700 mb-1">Descripción corta</label>
            <textarea
              rows={2}
              value={newFormDescription}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Instrucciones para el cobrador/auditor al completar la encuesta."
              className="border border-gray-300 rounded p-2 text-sm text-gray-800 bg-white focus:outline-none focus:border-purple-600"
            />
          </div>
        </div>

        <div className="border-t border-gray-200 pt-5 space-y-4">
          <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider">Agregar Campo Dinámico</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-600 mb-1">Etiqueta del Campo *</label>
              <input
                type="text"
                value={fieldLabel}
                onChange={(e) => onFieldLabelChange(e.target.value)}
                placeholder="Ej. ¿Caja cerrada?, Kilometraje, Observación"
                className="border border-gray-300 rounded p-2 text-sm text-gray-800 bg-white focus:outline-none focus:border-purple-600"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-600 mb-1">Tipo de Entrada</label>
              <select
                value={fieldType}
                onChange={(e) => onFieldTypeChange(e.target.value as FormField['type'])}
                className="border border-gray-300 rounded p-2 text-sm text-gray-800 bg-white focus:outline-none focus:border-purple-600 cursor-pointer"
              >
                <option value="text">Texto Corto</option>
                <option value="number">Número</option>
                <option value="select">Selección Múltiple (Desplegable)</option>
                <option value="checkbox">Verificación (Check/Sí/No)</option>
              </select>
            </div>
          </div>

          {fieldType === 'select' ? (
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-600 mb-1">
                Opciones del menú (separadas por comas) *
              </label>
              <input
                type="text"
                value={fieldOptionsRaw}
                onChange={(e) => onFieldOptionsChange(e.target.value)}
                placeholder="Ej. Excelente, Regular, Deficiente"
                className="border border-gray-300 rounded p-2 text-sm text-gray-800 bg-white focus:outline-none focus:border-purple-600"
              />
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="required-field"
              checked={fieldRequired}
              onChange={(e) => onFieldRequiredChange(e.target.checked)}
              className="w-4 h-4 rounded text-purple-700 focus:ring-purple-600"
            />
            <label htmlFor="required-field" className="text-xs font-bold text-gray-700 cursor-pointer">
              Marcar este campo como Obligatorio (*)
            </label>
          </div>

          <button
            type="button"
            onClick={onAddField}
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-purple-50 text-purple-700 hover:text-purple-800 border border-purple-200 font-bold py-2 px-4 rounded text-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Insertar Campo</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-col justify-between">
        <div className="space-y-4">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">
            Estructura del Formulario ({builderFields.length} campos)
          </h2>
          {builderFields.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              Agregue campos a la izquierda para diseñar la encuesta.
            </div>
          ) : (
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {builderFields.map((field, idx) => (
                <div
                  key={field.id}
                  className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-gray-800">
                      {field.label} {field.required ? <span className="text-red-500">*</span> : null}
                    </div>
                    <div className="text-[10px] text-gray-500 uppercase font-mono">
                      {field.type} {field.options ? `[${field.options.join(', ')}]` : ''}
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveField(idx)}
                    className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                    title="Eliminar campo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={onSaveForm}
          className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-3 px-4 rounded text-xs tracking-wider uppercase shadow transition-colors mt-6 cursor-pointer"
        >
          Publicar Formulario
        </button>
      </div>
    </div>
  );
}
