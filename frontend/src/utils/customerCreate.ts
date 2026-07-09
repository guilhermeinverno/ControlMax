import { addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  BusinessCenter,
  Customer,
  CustomerAddress,
  CustomerPhone,
  CustomerReference,
} from '../types/company';

export interface CustomerFormValues {
  formUnitId: string;
  formCity: string;
  formName: string;
  formSecondName: string;
  formApellidos: string;
  formSecondApellidos: string;
  formApodo: string;
  formEmail: string;
  formDocType: string;
  formDocNumber: string;
  formDoc2: string;
  formBirthDate: string;
  formAddress: string;
  formBarrio: string;
  formPhone: string;
  formCelularPrefix: string;
  formCelular: string;
  formComentario: string;
  formActividad: string;
  formActive: boolean;
  formLatitude: number | null;
  formLongitude: number | null;
  formAddresses: CustomerAddress[];
  formPhones: CustomerPhone[];
  formReferencesList: CustomerReference[];
  formPhotos: string[];
}

export function validateCustomerForm(values: CustomerFormValues): string | null {
  if (
    !values.formUnitId ||
    !values.formCity ||
    !values.formName ||
    !values.formApellidos ||
    !values.formDocNumber ||
    !values.formAddress ||
    !values.formCelular
  ) {
    return 'Por favor complete todos los campos obligatorios (*)';
  }

  return null;
}

export function buildCustomerPayload(
  values: CustomerFormValues,
  tenantId: string,
  selectedCnId: string,
  centers: BusinessCenter[],
): Customer {
  const currentCenter = centers.find((center) => center.id === selectedCnId);
  const currentUnit = currentCenter?.linkedUnits.find((unit) => unit.id === values.formUnitId);
  const unitName = currentUnit ? currentUnit.name : 'Ruta/Unidad Desconocida';

  return {
    tenantId,
    unitId: values.formUnitId,
    unitName,
    businessCenterId: selectedCnId,
    city: values.formCity,
    name: values.formName,
    secondName: values.formSecondName || '',
    apellidos: values.formApellidos,
    secondApellidos: values.formSecondApellidos || '',
    apodo: values.formApodo || '',
    email: values.formEmail || '',
    documentType: values.formDocType,
    documentNumber: values.formDocNumber,
    document2: values.formDoc2 || '',
    birthDate: values.formBirthDate || '',
    address: values.formAddress,
    barrio: values.formBarrio || '',
    phone: values.formPhone || '',
    celularPrefix: values.formCelularPrefix || '55',
    celular: values.formCelular,
    comentario: values.formComentario || '',
    actividadEconomica: values.formActividad,
    active: values.formActive,
    addresses: values.formAddresses,
    phones: values.formPhones,
    references: values.formReferencesList,
    photos: values.formPhotos,
    latitude: values.formLatitude,
    longitude: values.formLongitude,
    createdAt: new Date().toISOString(),
  };
}

export async function persistCustomer(customer: Customer): Promise<void> {
  await addDoc(collection(db, 'customers'), customer);
}

export const INITIAL_CUSTOMER_FORM: CustomerFormValues = {
  formUnitId: '',
  formCity: '',
  formName: '',
  formSecondName: '',
  formApellidos: '',
  formSecondApellidos: '',
  formApodo: '',
  formEmail: '',
  formDocType: 'CPF',
  formDocNumber: '',
  formDoc2: '',
  formBirthDate: '',
  formAddress: '',
  formBarrio: '',
  formPhone: '',
  formCelularPrefix: '55',
  formCelular: '',
  formComentario: '',
  formActividad: 'Comercio',
  formActive: true,
  formLatitude: null,
  formLongitude: null,
  formAddresses: [],
  formPhones: [],
  formReferencesList: [],
  formPhotos: [],
};
