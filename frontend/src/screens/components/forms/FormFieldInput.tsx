import { FormField } from '../../../types';

interface FormFieldInputProps {
  field: FormField;
  value: unknown;
  onChange: (fieldId: string, value: string | number | boolean) => void;
}

export function FormFieldInput({ field, value, onChange }: FormFieldInputProps) {
  const textValue = typeof value === 'string' || typeof value === 'number' ? String(value) : '';

  return (
    <div className="flex flex-col">
      <label className="text-xs font-bold text-gray-700 mb-1 flex items-center">
        <span>{field.label}</span>
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {field.type === 'text' && (
        <input
          type="text"
          value={textValue}
          onChange={(e) => onChange(field.id, e.target.value)}
          placeholder="Escriba aquí..."
          className="border border-gray-300 rounded p-2 text-sm text-gray-800 bg-white focus:outline-none focus:border-purple-600"
        />
      )}

      {field.type === 'number' && (
        <input
          type="number"
          value={textValue}
          onChange={(e) => onChange(field.id, e.target.value)}
          placeholder="0"
          className="border border-gray-300 rounded p-2 text-sm text-gray-800 bg-white focus:outline-none focus:border-purple-600"
        />
      )}

      {field.type === 'select' && (
        <select
          value={textValue}
          onChange={(e) => onChange(field.id, e.target.value)}
          className="border border-gray-300 rounded p-2 text-sm text-gray-800 bg-white focus:outline-none focus:border-purple-600 cursor-pointer"
        >
          <option value="">Seleccione una opción...</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}

      {field.type === 'checkbox' && (
        <div className="flex items-center gap-2 mt-1">
          <input
            type="checkbox"
            id={`check-${field.id}`}
            checked={!!value}
            onChange={(e) => onChange(field.id, e.target.checked)}
            className="w-4 h-4 rounded text-purple-700 focus:ring-purple-600 cursor-pointer"
          />
          <label htmlFor={`check-${field.id}`} className="text-xs text-gray-600 select-none cursor-pointer">
            Acepto / Marcar como verificado
          </label>
        </div>
      )}
    </div>
  );
}
