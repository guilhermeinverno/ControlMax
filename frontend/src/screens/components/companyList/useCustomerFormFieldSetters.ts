import type { useCustomerCreateForm } from '../../../hooks/useCustomerCreateForm';

export function useCustomerFormFieldSetters(createForm: ReturnType<typeof useCustomerCreateForm>) {
  const { form, updateForm } = createForm;

  return {
    ...createForm,
    ...form,
    setFormUnitId: (value: string) => updateForm({ formUnitId: value }),
    setFormCity: (value: string) => updateForm({ formCity: value }),
    setFormName: (value: string) => updateForm({ formName: value }),
    setFormSecondName: (value: string) => updateForm({ formSecondName: value }),
    setFormApellidos: (value: string) => updateForm({ formApellidos: value }),
    setFormSecondApellidos: (value: string) => updateForm({ formSecondApellidos: value }),
    setFormApodo: (value: string) => updateForm({ formApodo: value }),
    setFormEmail: (value: string) => updateForm({ formEmail: value }),
    setFormDocType: (value: string) => updateForm({ formDocType: value }),
    setFormDocNumber: (value: string) => updateForm({ formDocNumber: value }),
    setFormDoc2: (value: string) => updateForm({ formDoc2: value }),
    setFormBirthDate: (value: string) => updateForm({ formBirthDate: value }),
    setFormAddress: (value: string) => updateForm({ formAddress: value }),
    setFormBarrio: (value: string) => updateForm({ formBarrio: value }),
    setFormPhone: (value: string) => updateForm({ formPhone: value }),
    setFormCelularPrefix: (value: string) => updateForm({ formCelularPrefix: value }),
    setFormCelular: (value: string) => updateForm({ formCelular: value }),
    setFormComentario: (value: string) => updateForm({ formComentario: value }),
    setFormActividad: (value: string) => updateForm({ formActividad: value }),
    setFormActive: (value: boolean) => updateForm({ formActive: value }),
    setFormLatitude: (value: number | null) => updateForm({ formLatitude: value }),
    setFormLongitude: (value: number | null) => updateForm({ formLongitude: value }),
    setFormAddresses: (value: typeof form.formAddresses) => updateForm({ formAddresses: value }),
    setFormPhones: (value: typeof form.formPhones) => updateForm({ formPhones: value }),
    setFormReferencesList: (value: typeof form.formReferencesList) => updateForm({ formReferencesList: value }),
    setFormPhotos: (value: typeof form.formPhotos) => updateForm({ formPhotos: value }),
  };
}
