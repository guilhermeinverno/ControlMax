import { logFirestoreError } from '../utils/firestoreError';
import { booleanFieldDisplay } from '../utils/statusLabels';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { useTenant } from '../hooks/useTenant';
import { listViewBody } from '../utils/listViewBody';
import { FormField, FormDefinition, FormResponse } from '../types';
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
  User
} from 'lucide-react';



export function Forms() {
  const { tenantId, role, userName } = useTenant();

  // Role permissions
  const isAdminOrSupervisor = role === 'admin' || role === 'supervisor';

  // Tabs
  const [activeTab, setActiveTab] = useState<'forms' | 'responses' | 'builder'>('forms');

  // Loading & error states
  const [loadingForms, setLoadingForms] = useState<boolean>(true);
  const [loadingResponses, setLoadingResponses] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Firestore Data State
  const [formsList, setFormsList] = useState<FormDefinition[]>([]);
  const [responsesList, setResponsesList] = useState<FormResponse[]>([]);

  // Form Builder State
  const [newFormTitle, setNewFormTitle] = useState<string>('');
  const [newFormDescription, setNewFormDescription] = useState<string>('');
  const [builderFields, setBuilderFields] = useState<FormField[]>([]);
  
  // New Field Form State
  const [fieldLabel, setFieldLabel] = useState<string>('');
  const [fieldType, setFieldType] = useState<'text' | 'number' | 'select' | 'checkbox'>('text');
  const [fieldRequired, setFieldRequired] = useState<boolean>(false);
  const [fieldOptionsRaw, setFieldOptionsRaw] = useState<string>(''); // comma separated

  // Filling Form Modal State
  const [fillingForm, setFillingForm] = useState<FormDefinition | null>(null);
  const [fillingAnswers, setFillingAnswers] = useState<Record<string, unknown>>({});
  const [submittingResponse, setSubmittingResponse] = useState<boolean>(false);
  const [fillingError, setFillingError] = useState<string | null>(null);

  // Read available forms and responses in real time
  useEffect(() => {
    if (!tenantId) return;

    setLoadingForms(true);
    // Realtime snapshot for Forms
    const formsQuery = query(
      collection(db, 'forms'),
      where('tenantId', '==', tenantId)
    );

    const unsubscribeForms = onSnapshot(formsQuery, (snapshot) => {
      const loaded: FormDefinition[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title || 'Formulario sin título',
          description: data.description || '',
          fields: data.fields || [],
          tenantId: data.tenantId,
          createdBy: data.createdBy || 'Sistema',
          createdAt: data.createdAt
        };
      });
      setFormsList(loaded);
      setLoadingForms(false);
    }, (error) => {
      setErrorMsg('Error al cargar formularios.');
      try {
        logFirestoreError(error, 'list', 'forms', { label: 'Firestore Error in Forms', throwError: true, includeAuth: false });
      } catch (e) {}
      setLoadingForms(false);
    });

    // Realtime snapshot for Form Responses
    setLoadingResponses(true);
    const responsesQuery = query(
      collection(db, 'form_responses'),
      where('tenantId', '==', tenantId)
    );

    const unsubscribeResponses = onSnapshot(responsesQuery, (snapshot) => {
      const loaded: FormResponse[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          formId: data.formId || '',
          formTitle: data.formTitle || 'Formulario',
          answers: data.answers || {},
          tenantId: data.tenantId,
          submittedBy: data.submittedBy || 'Cobrador',
          createdAt: data.createdAt
        };
      });

      // Filter: collectors can only see their own submitted responses
      if (role === 'collector') {
        setResponsesList(loaded.filter(r => r.submittedBy === userName));
      } else {
        setResponsesList(loaded);
      }
      setLoadingResponses(false);
    }, (error) => {
      setErrorMsg('Error al cargar respuestas.');
      try {
        logFirestoreError(error, 'list', 'form_responses', { label: 'Firestore Error in Forms', throwError: true, includeAuth: false });
      } catch (e) {}
      setLoadingResponses(false);
    });

    return () => {
      unsubscribeForms();
      unsubscribeResponses();
    };
  }, [tenantId, role, userName]);

  // Form Builder: Add field helper
  const handleAddFieldToBuilder = () => {
    if (!fieldLabel.trim()) {
      alert('Por favor ingrese una etiqueta para el campo.');
      return;
    }

    // Generate clean unique ID slug
    const cleanId = fieldLabel
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[^a-z0-9]/g, '_')     // swap non-alphanumeric with underscore
      .replace(/_+/g, '_')            // collapse consecutive underscores
      .trim();

    // Check for duplicate slugs
    if (builderFields.some(f => f.id === cleanId)) {
      alert('Ya existe un campo similar o con la misma etiqueta.');
      return;
    }

    const options = fieldType === 'select'
      ? fieldOptionsRaw.split(',').map(o => o.trim()).filter(Boolean)
      : undefined;

    if (fieldType === 'select' && (!options || options.length === 0)) {
      alert('Debe ingresar al menos una opción para el menú desplegable.');
      return;
    }

    const newField: FormField = {
      id: cleanId,
      label: fieldLabel,
      type: fieldType,
      required: fieldRequired,
      options
    };

    setBuilderFields([...builderFields, newField]);
    
    // Reset field inputs
    setFieldLabel('');
    setFieldType('text');
    setFieldRequired(false);
    setFieldOptionsRaw('');
  };

  const handleRemoveFieldFromBuilder = (index: number) => {
    setBuilderFields(builderFields.filter((_, idx) => idx !== index));
  };

  // Save new form to Firestore
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

      const payload = {
        title: newFormTitle.trim(),
        description: newFormDescription.trim(),
        fields: builderFields,
        tenantId,
        createdBy: userName || 'Admin',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'forms'), payload);
      
      setSuccessMsg('Formulario creado exitosamente.');
      
      // Reset form builder states
      setNewFormTitle('');
      setNewFormDescription('');
      setBuilderFields([]);
      setActiveTab('forms');
    } catch (err) {
      setErrorMsg('Fallo al guardar el formulario.');
      try {
        logFirestoreError(err, 'write', 'forms', { label: 'Firestore Error in Forms', throwError: true, includeAuth: false });
      } catch (e) {}
    }
  };

  // Delete Form
  const handleDeleteForm = async (formId: string) => {
    if (!confirm('¿Está seguro de eliminar este formulario? Se perderá permanentemente.')) return;
    try {
      await deleteDoc(doc(db, 'forms', formId));
      setSuccessMsg('Formulario eliminado.');
    } catch (err) {
      setErrorMsg('No se pudo eliminar el formulario.');
      try {
        logFirestoreError(err, 'delete', `forms/${formId}`, { label: 'Firestore Error in Forms', throwError: true, includeAuth: false });
      } catch (e) {}
    }
  };

  // Modal Completion helpers
  const handleOpenFillingModal = (form: FormDefinition) => {
    setFillingForm(form);
    const initialAnswers: Record<string, unknown> = {};
    form.fields.forEach(f => {
      initialAnswers[f.id] = f.type === 'checkbox' ? false : '';
    });
    setFillingAnswers(initialAnswers);
    setFillingError(null);
  };

  const handleAnswerChange = (fieldId: string, value: string | number | boolean) => {
    setFillingAnswers(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmitResponse = async () => {
    if (!fillingForm) return;

    setFillingError(null);
    
    // Validate required fields
    for (const field of fillingForm.fields) {
      const val = fillingAnswers[field.id];
      if (field.required) {
        if (field.type === 'checkbox' && !val) {
          setFillingError(`El campo "${field.label}" es obligatorio.`);
          return;
        }
        if (field.type !== 'checkbox' && (val === undefined || val === null || String(val).trim() === '')) {
          setFillingError(`El campo "${field.label}" es obligatorio.`);
          return;
        }
      }
    }

    setSubmittingResponse(true);

    try {
      const responsePayload = {
        formId: fillingForm.id,
        formTitle: fillingForm.title,
        answers: fillingAnswers,
        tenantId,
        submittedBy: userName || 'Anónimo',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'form_responses'), responsePayload);
      
      setSuccessMsg(`Respuesta para "${fillingForm.title}" enviada con éxito.`);
      setFillingForm(null);
    } catch (err) {
      setFillingError('Fallo al enviar la respuesta del formulario.');
      try {
        logFirestoreError(err, 'write', 'form_responses', { label: 'Firestore Error in Forms', throwError: true, includeAuth: false });
      } catch (e) {}
    } finally {
      setSubmittingResponse(false);
    }
  };

  const formatResponseDate = (field: unknown) => {
    if (!field) return 'Reciente';
    let dateObj: Date;
    if (typeof field === 'object' && field !== null && 'toDate' in field && typeof (field as Record<string, unknown>).toDate === 'function') {
      dateObj = (field as { toDate: () => Date }).toDate();
    } else if (field instanceof Date) {
      dateObj = field;
    } else if (typeof field === 'object' && field !== null && 'seconds' in field) {
      dateObj = new Timestamp((field as Record<string, unknown>).seconds as number, (field as Record<string, unknown>).nanoseconds as number || 0).toDate();
    } else {
      dateObj = new Date(field as string | number);
    }
    return dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col space-y-6 w-full max-w-[1550px] mx-auto animate-fadeIn px-2 sm:px-4">
      
      {/* Title block */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-purple-700" />
          <span>Formularios y Auditorías</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Crea, administra y responde encuestas, checklists dinámicos y reportes de campo en tiempo real.
        </p>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-900 font-bold hover:underline">X</button>
        </div>
      )}

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-3.5 rounded text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-green-900 font-bold hover:underline">X</button>
        </div>
      )}

      {/* Tabs navigation */}
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
        
        {/* Only Admin & Supervisor can build forms */}
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

      {/* TAB: FORMS LIST */}
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
              No hay formularios creados para este canal. {isAdminOrSupervisor && '¡Crea uno nuevo usando la pestaña de arriba!'}
            </div>
          ),
            (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formsList.map(form => (
                <div key={form.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-white transition-all hover:shadow-md flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm leading-tight">{form.title}</h3>
                    <p className="text-xs text-gray-500 mt-1 leading-snug line-clamp-2">{form.description || 'Sin descripción.'}</p>
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
          ))}
        </div>
      )}

      {/* TAB: RESPONSES LIST */}
      {activeTab === 'responses' && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide">
                Historial de Respuestas Recibidas
              </h2>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {role === 'collector' ? 'Mostrando tus respuestas completadas' : 'Mostrando respuestas de todos los cobradores'}
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
              {responsesList.map(resp => (
                <div key={resp.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm">{resp.formTitle}</span>
                      <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded font-mono">
                        ID: {resp.id.substring(0, 8)}
                      </span>
                    </div>

                    {/* Render fields responses */}
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

                  {/* Metadata block */}
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
          ))}
        </div>
      )}

      {/* TAB: FORM BUILDER */}
      {activeTab === 'builder' && isAdminOrSupervisor && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Builder Controls */}
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

            {/* Field adder Section */}
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

              {/* If select type, configure options */}
              {fieldType === 'select' && (
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-600 mb-1">Opciones del menú (separadas por comas) *</label>
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

          {/* Form Preview Column */}
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
                    <div key={field.id} className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded text-xs">
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

      {/* MODAL: FILLING DYNAMIC FORM */}
      {fillingForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 shadow-xl rounded-lg w-full max-w-lg overflow-hidden animate-zoomIn flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-purple-700 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base leading-none">{fillingForm.title}</h3>
                <p className="text-[11px] text-purple-200 mt-1">{fillingForm.description || 'Por favor complete todos los datos'}</p>
              </div>
              <button 
                onClick={() => setFillingForm(null)}
                className="text-white hover:text-purple-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Inputs */}
            <div className="p-5 overflow-y-auto max-h-[500px] space-y-4">
              
              {fillingError && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{fillingError}</span>
                </div>
              )}

              {fillingForm.fields.map(field => {
                const isRequired = field.required;
                const value = fillingAnswers[field.id];
                const textValue =
                  typeof value === 'string' || typeof value === 'number' ? String(value) : '';

                return (
                  <div key={field.id} className="flex flex-col">
                    <label className="text-xs font-bold text-gray-700 mb-1 flex items-center">
                      <span>{field.label}</span>
                      {isRequired && <span className="text-red-500 ml-1">*</span>}
                    </label>

                    {/* TEXT FIELD */}
                    {field.type === 'text' && (
                      <input 
                        type="text"
                        value={textValue}
                        onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                        placeholder="Escriba aquí..."
                        className="border border-gray-300 rounded p-2 text-sm text-gray-800 bg-white focus:outline-none focus:border-purple-600"
                      />
                    )}

                    {/* NUMBER FIELD */}
                    {field.type === 'number' && (
                      <input 
                        type="number"
                        value={textValue}
                        onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                        placeholder="0"
                        className="border border-gray-300 rounded p-2 text-sm text-gray-800 bg-white focus:outline-none focus:border-purple-600"
                      />
                    )}

                    {/* SELECT FIELD */}
                    {field.type === 'select' && (
                      <select
                        value={textValue}
                        onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                        className="border border-gray-300 rounded p-2 text-sm text-gray-800 bg-white focus:outline-none focus:border-purple-600 cursor-pointer"
                      >
                        <option value="">Seleccione una opción...</option>
                        {field.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}

                    {/* CHECKBOX FIELD */}
                    {field.type === 'checkbox' && (
                      <div className="flex items-center gap-2 mt-1">
                        <input 
                          type="checkbox"
                          id={`check-${field.id}`}
                          checked={!!value}
                          onChange={(e) => handleAnswerChange(field.id, e.target.checked)}
                          className="w-4 h-4 rounded text-purple-700 focus:ring-purple-600 cursor-pointer"
                        />
                        <label htmlFor={`check-${field.id}`} className="text-xs text-gray-600 select-none cursor-pointer">
                          Acepto / Marcar como verificado
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}

            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 border-t border-gray-150 p-4 flex gap-3">
              <button
                onClick={() => setFillingForm(null)}
                className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-2.5 rounded text-xs cursor-pointer hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitResponse}
                disabled={submittingResponse}
                className="flex-1 bg-purple-700 hover:bg-purple-800 disabled:bg-purple-400 text-white font-bold py-2.5 rounded text-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                {submittingResponse ? (
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
      )}

    </div>
  );
}
