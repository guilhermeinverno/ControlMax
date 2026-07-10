import { logFirestoreError } from '../utils/firestoreError';
import { booleanFieldDisplay } from '../utils/statusLabels';
import { useState, useCallback } from 'react';
import { db } from '../lib/firebase';
import { addDoc, collection, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useTenant } from '../hooks/useTenant';
import { useFormsData } from '../hooks/useFormsData';
import { listViewBody } from '../utils/listViewBody';
import { FormDefinition, FormField } from '../types';
import {
  buildFormField,
  buildInitialAnswers,
  formatResponseDate,
  validateRequiredAnswers,
} from '../utils/formsHelpers';
import { FormsFillingModal } from './components/forms/FormsFillingModal';
import {
  ClipboardList,
  Plus,
  Trash2,
  CheckSquare,
  FileText,
  Loader2,
  AlertCircle,
  X,
  PlusCircle,
  CheckCircle2,
  Calendar,
  User,
} from 'lucide-react';

export function Forms() {
  const { tenantId, role, userName } = useTenant();
  const isAdminOrSupervisor = role === 'admin' || role === 'supervisor';

  const [activeTab, setActiveTab] = useState<'forms' | 'responses' | 'builder'>('forms');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleDataError = useCallback((message: string) => setErrorMsg(message), []);
  const { formsList, responsesList, loadingForms, loadingResponses } = useFormsData({
    tenantId,
    role,
    userName,
    onError: handleDataError,
  });

  const [newFormTitle, setNewFormTitle] = useState('');
  const [newFormDescription, setNewFormDescription] = useState('');
  const [builderFields, setBuilderFields] = useState<FormField[]>([]);
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState<FormField['type']>('text');
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldOptionsRaw, setFieldOptionsRaw] = useState('');

  const [fillingForm, setFillingForm] = useState<FormDefinition | null>(null);
  const [fillingAnswers, setFillingAnswers] = useState<Record<string, unknown>>({});
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [fillingError, setFillingError] = useState<string | null>(null);

  const handleAddFieldToBuilder = () => {
    const result = buildFormField(fieldLabel, fieldType, fieldRequired, fieldOptionsRaw, builderFields);
    if (result.error) {
      alert(result.error);
      return;
    }
    if (!result.field) return;

    setBuilderFields([...builderFields, result.field]);
    setFieldLabel('');
    setFieldType('text');
    setFieldRequired(false);
    setFieldOptionsRaw('');
  };

  const handleRemoveFieldFromBuilder = (index: number) => {
    setBuilderFields(builderFields.filter((_, idx) => idx !== index));
  };

  const handleSaveForm = async () => {
    if (!newFormTitle.trim()) {
      setErrorMsg('El título del formulario es obligatorio.');
      return;
    }
    if (builderFields.length === 0) {
      setErrorMsg('Debe agregar al menos un campo al formulario.');
      return;
    }

    try {
      setErrorMsg(null);
      setSuccessMsg(null);
      await addDoc(collection(db, 'forms'), {
        title: newFormTitle.trim(),
        description: newFormDescription.trim(),
        fields: builderFields,
        tenantId,
        createdBy: userName || 'Admin',
        createdAt: serverTimestamp(),
      });
      setSuccessMsg('Formulario creado exitosamente.');
      setNewFormTitle('');
      setNewFormDescription('');
      setBuilderFields([]);
      setActiveTab('forms');
    } catch (err) {
      setErrorMsg('Fallo al guardar el formulario.');
      try {
        logFirestoreError(err, 'write', 'forms', {
          label: 'Firestore Error in Forms',
          throwError: true,
          includeAuth: false,
        });
      } catch {
        // logged
      }
    }
  };

  const handleDeleteForm = async (formId: string) => {
    if (!confirm('¿Está seguro de eliminar este formulario? Se perderá permanentemente.')) return;
    try {
      await deleteDoc(doc(db, 'forms', formId));
      setSuccessMsg('Formulario eliminado.');
    } catch (err) {
      setErrorMsg('No se pudo eliminar el formulario.');
      try {
        logFirestoreError(err, 'delete', `forms/${formId}`, {
          label: 'Firestore Error in Forms',
          throwError: true,
          includeAuth: false,
        });
      } catch {
        // logged
      }
    }
  };

  const handleOpenFillingModal = (form: FormDefinition) => {
    setFillingForm(form);
    setFillingAnswers(buildInitialAnswers(form));
    setFillingError(null);
  };

  const handleAnswerChange = (fieldId: string, value: string | number | boolean) => {
    setFillingAnswers((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmitResponse = async () => {
    if (!fillingForm) return;

    const validationError = validateRequiredAnswers(fillingForm.fields, fillingAnswers);
    if (validationError) {
      setFillingError(validationError);
      return;
    }

    setFillingError(null);
    setSubmittingResponse(true);

    try {
      await addDoc(collection(db, 'form_responses'), {
        formId: fillingForm.id,
        formTitle: fillingForm.title,
        answers: fillingAnswers,
        tenantId,
        submittedBy: userName || 'Anónimo',
        createdAt: serverTimestamp(),
      });
      setSuccessMsg(`Respuesta para "${fillingForm.title}" enviada con éxito.`);
      setFillingForm(null);
    } catch (err) {
      setFillingError('Fallo al enviar la respuesta del formulario.');
      try {
        logFirestoreError(err, 'write', 'form_responses', {
          label: 'Firestore Error in Forms',
          throwError: true,
          includeAuth: false,
        });
      } catch {
        // logged
      }
    } finally {
      setSubmittingResponse(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6 w-full max-w-[1550px] mx-auto animate-fadeIn px-2 sm:px-4">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-purple-700" />
          <span>Formularios y Auditorías</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Crea, administra y responde encuestas, checklists dinámicos y reportes de campo en tiempo real.
        </p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-900 font-bold hover:underline">
            X
          </button>
        </div>
      )}

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-3.5 rounded text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-green-900 font-bold hover:underline">
            X
          </button>
        </div>
      )}

      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('forms')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
            activeTab === 'forms'
              ? 'border-purple-700 text-purple-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Formularios</span>
        </button>
        <button
          onClick={() => setActiveTab('responses')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
            activeTab === 'responses'
              ? 'border-purple-700 text-purple-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Respuestas</span>
        </button>
        {isAdminOrSupervisor && (
          <button
            onClick={() => setActiveTab('builder')}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
              activeTab === 'builder'
                ? 'border-purple-700 text-purple-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Criar Formulário</span>
          </button>
        )}
      </div>

      {activeTab === 'forms' && (
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
                        onClick={() => handleOpenFillingModal(form)}
                        className="flex-1 bg-purple-700 hover:bg-purple-800 text-white text-center font-bold py-1.5 px-3 rounded text-[11px] transition-colors cursor-pointer"
                      >
                        Responder
                      </button>
                      {isAdminOrSupervisor && (
                        <button
                          onClick={() => handleDeleteForm(form.id)}
                          className="p-1.5 border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 rounded transition-colors cursor-pointer"
                          title="Eliminar Formulario"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {activeTab === 'responses' && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide">
                Historial de Respuestas Recibidas
              </h2>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {role === 'collector'
                  ? 'Mostrando tus respuestas completadas'
                  : 'Mostrando respuestas de todos los cobradores'}
              </p>
            </div>
            <p className="text-[11px] text-gray-400">Total: {responsesList.length}</p>
          </div>

          {listViewBody(
            loadingResponses,
            responsesList.length,
            (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-700 mb-2" />
                <p className="text-xs text-gray-400">Buscando envíos...</p>
              </div>
            ),
            (
              <div className="text-center py-12 text-gray-400 text-xs">
                Ninguna respuesta registrada hasta el momento.
              </div>
            ),
            (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {responsesList.map((resp) => (
                  <div
                    key={resp.id}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex flex-col md:flex-row justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">{resp.formTitle}</span>
                        <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded font-mono">
                          ID: {resp.id.substring(0, 8)}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                        {Object.entries(resp.answers).map(([key, value]) => (
                          <div key={key} className="bg-white p-2 rounded border border-gray-150 text-xs">
                            <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wide">
                              {key.replace(/_/g, ' ')}
                            </span>
                            <span className="font-semibold text-gray-800">
                              {typeof value === 'boolean' ? booleanFieldDisplay(value) : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="md:border-l md:border-gray-200 md:pl-4 flex flex-col justify-center text-xs text-gray-500 space-y-1.5 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-purple-600" />
                        <span className="font-medium text-gray-700">{resp.submittedBy}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-purple-600" />
                        <span className="font-mono text-[11px]">{formatResponseDate(resp.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {activeTab === 'builder' && isAdminOrSupervisor && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-5">
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide">Configuración del Formulario</h2>
            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-700 mb-1">Título del Formulario *</label>
                <input
                  type="text"
                  value={newFormTitle}
                  onChange={(e) => setNewFormTitle(e.target.value)}
                  placeholder="Ej. Control de Calidad Diaria, Check de Apertura"
                  className="border border-gray-300 rounded p-2 text-sm text-gray-800 bg-white focus:outline-none focus:border-purple-600"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-700 mb-1">Descripción corta</label>
                <textarea
                  rows={2}
                  value={newFormDescription}
                  onChange={(e) => setNewFormDescription(e.target.value)}
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
                    onChange={(e) => setFieldLabel(e.target.value)}
                    placeholder="Ej. ¿Caja cerrada?, Kilometraje, Observación"
                    className="border border-gray-300 rounded p-2 text-sm text-gray-800 bg-white focus:outline-none focus:border-purple-600"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-600 mb-1">Tipo de Entrada</label>
                  <select
                    value={fieldType}
                    onChange={(e) => setFieldType(e.target.value as FormField['type'])}
                    className="border border-gray-300 rounded p-2 text-sm text-gray-800 bg-white focus:outline-none focus:border-purple-600 cursor-pointer"
                  >
                    <option value="text">Texto Corto</option>
                    <option value="number">Número</option>
                    <option value="select">Selección Múltiple (Desplegable)</option>
                    <option value="checkbox">Verificación (Check/Sí/No)</option>
                  </select>
                </div>
              </div>

              {fieldType === 'select' && (
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-600 mb-1">
                    Opciones del menú (separadas por comas) *
                  </label>
                  <input
                    type="text"
                    value={fieldOptionsRaw}
                    onChange={(e) => setFieldOptionsRaw(e.target.value)}
                    placeholder="Ej. Excelente, Regular, Deficiente"
                    className="border border-gray-300 rounded p-2 text-sm text-gray-800 bg-white focus:outline-none focus:border-purple-600"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="required-field"
                  checked={fieldRequired}
                  onChange={(e) => setFieldRequired(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-700 focus:ring-purple-600"
                />
                <label htmlFor="required-field" className="text-xs font-bold text-gray-700 cursor-pointer">
                  Marcar este campo como Obligatorio (*)
                </label>
              </div>

              <button
                type="button"
                onClick={handleAddFieldToBuilder}
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
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </div>
                        <div className="text-[10px] text-gray-500 uppercase font-mono">
                          {field.type} {field.options && `[${field.options.join(', ')}]`}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveFieldFromBuilder(idx)}
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
              onClick={handleSaveForm}
              className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-3 px-4 rounded text-xs tracking-wider uppercase shadow transition-colors mt-6 cursor-pointer"
            >
              Publicar Formulario
            </button>
          </div>
        </div>
      )}

      {fillingForm && (
        <FormsFillingModal
          form={fillingForm}
          answers={fillingAnswers}
          error={fillingError}
          submitting={submittingResponse}
          onClose={() => setFillingForm(null)}
          onAnswerChange={handleAnswerChange}
          onSubmit={handleSubmitResponse}
        />
      )}
    </div>
  );
}
