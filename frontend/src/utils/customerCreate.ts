import { doc, getDoc, setDoc, collection } from 'firebase/firestore';
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
  const hasName = Boolean(values.formName?.trim());
  const hasPhone = Boolean(values.formCelular?.trim() || values.formPhone?.trim());
  const hasLocation = Boolean(values.formAddress?.trim() || values.formCity?.trim());
  const hasPhoto = Boolean(values.formPhotos && values.formPhotos.length > 0);

  if (!hasName || !hasPhone || !hasLocation || !hasPhoto) {
    return 'Por favor preencha os 4 campos obrigatórios: Nome, Telefone, Localização e envie uma Imagem.';
  }

  return null;
}

export function buildCustomerPayload(
  values: CustomerFormValues,
  tenantId: string,
  selectedCnId: string,
  centers: BusinessCenter[],
): Customer {
  const currentCenter = centers.find((center) => center.id === selectedCnId) || centers[0];
  const defaultUnit = currentCenter?.linkedUnits?.[0];
  const effectiveUnitId = values.formUnitId || defaultUnit?.id || 'unit_ceu_azul_gringo';
  const effectiveUnitName = currentCenter?.linkedUnits?.find((u) => u.id === effectiveUnitId)?.name || defaultUnit?.name || 'Unidade Padrão';

  return {
    tenantId,
    unitId: effectiveUnitId,
    unitName: effectiveUnitName,
    businessCenterId: selectedCnId || currentCenter?.id || '',
    city: values.formCity || 'Brasilia',
    name: values.formName.trim(),
    secondName: values.formSecondName || '',
    apellidos: values.formApellidos || '',
    secondApellidos: values.formSecondApellidos || '',
    apodo: values.formApodo || values.formName.trim(),
    email: values.formEmail || '',
    documentType: values.formDocType || 'OUTROS',
    documentNumber: values.formDocNumber || 'S/N',
    document2: values.formDoc2 || '',
    birthDate: values.formBirthDate || '',
    address: values.formAddress || values.formCity || 'Localização Padrão',
    barrio: values.formBarrio || '',
    phone: values.formPhone || values.formCelular || '',
    celularPrefix: values.formCelularPrefix || '55',
    celular: values.formCelular || values.formPhone || '',
    comentario: values.formComentario || '',
    actividadEconomica: values.formActividad || 'Geral',
    active: values.formActive ?? true,
    addresses: values.formAddresses?.length ? values.formAddresses : [{
      id: 'addr-1',
      address: values.formAddress || 'Localização Padrão',
      barrio: values.formBarrio || '',
      city: values.formCity || 'Brasilia'
    }],
    phones: values.formPhones?.length ? values.formPhones : [{
      id: 'phone-1',
      number: values.formCelular || values.formPhone || ''
    }],
    references: values.formReferencesList || [],
    photos: values.formPhotos || [],
    latitude: values.formLatitude,
    longitude: values.formLongitude,
    createdAt: new Date().toISOString(),
  };
}

export async function generateNumericCustomerId(): Promise<string> {
  let isUnique = false;
  let newId = '';
  while (!isUnique) {
    // Generate a 10-digit numeric ID
    newId = (Math.floor(Math.random() * 9000000000) + 1000000000).toString();
    const docRef = doc(db, 'customers', newId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      isUnique = true;
    }
  }
  return newId;
}

export async function persistCustomer(customer: Customer): Promise<void> {
  const newId = await generateNumericCustomerId();
  await setDoc(doc(db, 'customers', newId), customer);
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
