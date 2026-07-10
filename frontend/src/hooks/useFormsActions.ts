import { useCallback, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FormDefinition, FormField } from '../types';
import {
  buildFormField,
  buildInitialAnswers,
  validateRequiredAnswers,
} from '../utils/formsHelpers';
import { logFirestoreError, type FirestoreOperationType } from '../utils/firestoreError';

interface UseFormsActionsOptions {
  tenantId?: string;
  userName: string;
}

export function useFormsActions({ tenantId, userName }: UseFormsActionsOptions) {
  const [activeTab, setActiveTab] = useState<'forms' | 'responses' | 'builder'>('forms');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  const logFormsError = useCallback((err: unknown, operation: FirestoreOperationType, path: string) => {
    try {
      logFirestoreError(err, operation, path, {
        label: 'Firestore Error in Forms',
        throwError: true,
        includeAuth: false,
      });
    } catch {
      // logged
    }
  }, []);

  const resetBuilderFieldInputs = () => {
    setFieldLabel('');
    setFieldType('text');
    setFieldRequired(false);
    setFieldOptionsRaw('');
  };

  const handleAddFieldToBuilder = () => {
    const result = buildFormField(fieldLabel, fieldType, fieldRequired, fieldOptionsRaw, builderFields);
    if (result.error) {
      alert(result.error);
      return;
    }
    if (!result.field) return;

    setBuilderFields([...builderFields, result.field]);
    resetBuilderFieldInputs();
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
      logFormsError(err, 'write', 'forms');
    }
  };

  const handleDeleteForm = async (formId: string) => {
    if (!confirm('¿Está seguro de eliminar este formulario? Se perderá permanentemente.')) return;
    try {
      await deleteDoc(doc(db, 'forms', formId));
      setSuccessMsg('Formulario eliminado.');
    } catch (err) {
      setErrorMsg('No se pudo eliminar el formulario.');
      logFormsError(err, 'delete', `forms/${formId}`);
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
      logFormsError(err, 'write', 'form_responses');
    } finally {
      setSubmittingResponse(false);
    }
  };

  return {
    activeTab,
    setActiveTab,
    errorMsg,
    setErrorMsg,
    successMsg,
    setSuccessMsg,
    newFormTitle,
    setNewFormTitle,
    newFormDescription,
    setNewFormDescription,
    builderFields,
    fieldLabel,
    setFieldLabel,
    fieldType,
    setFieldType,
    fieldRequired,
    setFieldRequired,
    fieldOptionsRaw,
    setFieldOptionsRaw,
    fillingForm,
    setFillingForm,
    fillingAnswers,
    submittingResponse,
    fillingError,
    handleAddFieldToBuilder,
    handleRemoveFieldFromBuilder,
    handleSaveForm,
    handleDeleteForm,
    handleOpenFillingModal,
    handleAnswerChange,
    handleSubmitResponse,
  };
}
