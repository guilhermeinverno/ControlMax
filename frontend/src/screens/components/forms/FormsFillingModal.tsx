import { Loader2, AlertCircle, X } from 'lucide-react';
import { FormDefinition } from '../../../types';
import { FormFieldInput } from './FormFieldInput';

interface FormsFillingModalProps {
  form: FormDefinition;
  answers: Record<string, unknown>;
  error: string | null;
  submitting: boolean;
  onClose: () => void;
  onAnswerChange: (fieldId: string, value: string | number | boolean) => void;
  onSubmit: () => void;
}

export function FormsFillingModal({
  form,
  answers,
  error,
  submitting,
  onClose,
  onAnswerChange,
  onSubmit,
}: FormsFillingModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 shadow-xl rounded-lg w-full max-w-lg overflow-hidden animate-zoomIn flex flex-col">
        <div className="bg-purple-700 text-white px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base leading-none">{form.title}</h3>
            <p className="text-[11px] text-purple-200 mt-1">
              {form.description || 'Por favor complete todos los datos'}
            </p>
          </div>
          <button onClick={onClose} className="text-white hover:text-purple-200 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[500px] space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {form.fields.map((field) => (
            <FormFieldInput
              key={field.id}
              field={field}
              value={answers[field.id]}
              onChange={onAnswerChange}
            />
          ))}
        </div>

        <div className="bg-gray-50 border-t border-gray-150 p-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-2.5 rounded text-xs cursor-pointer hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="flex-1 bg-purple-700 hover:bg-purple-800 disabled:bg-purple-400 text-white font-bold py-2.5 rounded text-xs cursor-pointer flex items-center justify-center gap-1.5"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <span>Enviar Formulario</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
