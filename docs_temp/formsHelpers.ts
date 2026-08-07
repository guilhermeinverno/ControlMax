import { Timestamp } from 'firebase/firestore';
import { FormDefinition, FormField, FormResponse } from '../types';

export function mapFormDoc(id: string, data: Record<string, unknown>): FormDefinition {
  return {
    id,
    title: (data.title as string) || 'Formulario sin título',
    description: (data.description as string) || '',
    fields: (data.fields as FormField[]) || [],
    tenantId: data.tenantId as string,
    createdBy: (data.createdBy as string) || 'Sistema',
    createdAt: (data.createdAt as Timestamp | null) ?? null,
  };
}

export function mapResponseDoc(id: string, data: Record<string, unknown>): FormResponse {
  return {
    id,
    formId: (data.formId as string) || '',
    formTitle: (data.formTitle as string) || 'Formulario',
    answers: (data.answers as Record<string, unknown>) || {},
    tenantId: data.tenantId as string,
    submittedBy: (data.submittedBy as string) || 'Cobrador',
    createdAt: (data.createdAt as Timestamp | null) ?? null,
  };
}

export function slugifyFieldLabel(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .trim();
}

export function buildFormField(
  label: string,
  type: FormField['type'],
  required: boolean,
  optionsRaw: string,
  existingFields: FormField[]
): { field?: FormField; error?: string } {
  if (!label.trim()) {
    return { error: 'Por favor ingrese una etiqueta para el campo.' };
  }

  const cleanId = slugifyFieldLabel(label);
  if (existingFields.some((f) => f.id === cleanId)) {
    return { error: 'Ya existe un campo similar o con la misma etiqueta.' };
  }

  const options =
    type === 'select' ? optionsRaw.split(',').map((o) => o.trim()).filter(Boolean) : undefined;

  if (type === 'select' && (!options || options.length === 0)) {
    return { error: 'Debe ingresar al menos una opción para el menú desplegable.' };
  }

  return {
    field: { id: cleanId, label, type, required, options },
  };
}

export function validateRequiredAnswers(
  fields: FormField[],
  answers: Record<string, unknown>
): string | null {
  for (const field of fields) {
    if (!field.required) continue;

    const val = answers[field.id];
    if (field.type === 'checkbox' && !val) {
      return `El campo "${field.label}" es obligatorio.`;
    }
    if (field.type !== 'checkbox' && (val === undefined || val === null || String(val).trim() === '')) {
      return `El campo "${field.label}" es obligatorio.`;
    }
  }
  return null;
}

export function buildInitialAnswers(form: FormDefinition): Record<string, unknown> {
  const initialAnswers: Record<string, unknown> = {};
  form.fields.forEach((field) => {
    initialAnswers[field.id] = field.type === 'checkbox' ? false : '';
  });
  return initialAnswers;
}

export function formatResponseDate(field: unknown): string {
  if (!field) return 'Reciente';

  let dateObj: Date;
  if (
    typeof field === 'object' &&
    field !== null &&
    'toDate' in field &&
    typeof (field as Record<string, unknown>).toDate === 'function'
  ) {
    dateObj = (field as { toDate: () => Date }).toDate();
  } else if (field instanceof Date) {
    dateObj = field;
  } else if (typeof field === 'object' && field !== null && 'seconds' in field) {
    const record = field as Record<string, unknown>;
    dateObj = new Timestamp(record.seconds as number, (record.nanoseconds as number) || 0).toDate();
  } else {
    dateObj = new Date(field as string | number);
  }

  return (
    dateObj.toLocaleDateString() +
    ' ' +
    dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
}
