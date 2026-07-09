import { useEffect, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Customer } from '../../../types/company';
import { CustomerModalGpsSection } from './CustomerModalGpsSection';
import { CustomerDisplayName, CustomerWhatsappContact } from './types';

interface CustomerModalBasicTabProps {
  customer: Customer;
  onClose: () => void;
  onDisplayNameChange: (name: CustomerDisplayName) => void;
  onContactChange: (contact: CustomerWhatsappContact) => void;
}

export interface BasicFormFields {
  firstName: string;
  firstApellido: string;
  secondName: string;
  secondApellido: string;
  apodo: string;
  email: string;
  docType: string;
  docNumber: string;
  doc2: string;
  birthDate: string;
  address: string;
  barrio: string;
  phone: string;
  celularPrefix: string;
  celular: string;
  comment: string;
  actividad: string;
  active: boolean;
  latitude: number | null;
  longitude: number | null;
}

const EMPTY_BASIC_FORM: BasicFormFields = {
  firstName: '',
  firstApellido: '',
  secondName: '',
  secondApellido: '',
  apodo: '',
  email: '',
  docType: 'CPF',
  docNumber: '',
  doc2: '',
  birthDate: '',
  address: '',
  barrio: '',
  phone: '',
  celularPrefix: '55',
  celular: '',
  comment: '',
  actividad: 'Comercio',
  active: true,
  latitude: null,
  longitude: null,
};

export function readBasicFields(customer: Customer): BasicFormFields {
  return {
    ...EMPTY_BASIC_FORM,
    firstName: customer.name,
    firstApellido: customer.apellidos,
    secondName: customer.secondName,
    secondApellido: customer.secondApellidos,
    apodo: customer.apodo,
    email: customer.email,
    docType: customer.documentType,
    docNumber: customer.documentNumber,
    doc2: customer.document2,
    birthDate: customer.birthDate,
    address: customer.address,
    barrio: customer.barrio,
    phone: customer.phone,
    celularPrefix: customer.celularPrefix,
    celular: customer.celular,
    comment: customer.comentario,
    actividad: customer.actividadEconomica,
    active: customer.active !== false,
    latitude: customer.latitude ?? null,
    longitude: customer.longitude ?? null,
  };
}

function BasicTabNotification({ notification }: { notification: { type: 'success' | 'error'; message: string } }) {
  const className = notification.type === 'success'
    ? 'bg-green-100 text-green-800'
    : 'bg-red-100 text-red-800';

  return (
    <div className={`p-3 rounded-lg text-xs font-bold ${className}`}>
      {notification.message}
    </div>
  );
}

export function CustomerModalBasicTab({
  customer,
  onClose,
  onDisplayNameChange,
  onContactChange,
}: CustomerModalBasicTabProps) {
  const [form, setForm] = useState<BasicFormFields>(() => readBasicFields(customer));
  const [gettingLocation, setGettingLocation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const patchForm = (patch: Partial<BasicFormFields>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  useEffect(() => {
    setForm(readBasicFields(customer));
  }, [customer]);

  useEffect(() => {
    onDisplayNameChange({ first: form.firstName, last: form.firstApellido });
  }, [form.firstName, form.firstApellido, onDisplayNameChange]);

  useEffect(() => {
    onContactChange({ prefix: form.celularPrefix, number: form.celular });
  }, [form.celularPrefix, form.celular, onContactChange]);

  const handleSaveBasic = async () => {
    if (!customer.id) return;
    setSaving(true);
    setNotification(null);
    try {
      await updateDoc(doc(db, 'customers', customer.id), {
        name: form.firstName,
        apellidos: form.firstApellido,
        secondName: form.secondName,
        secondApellidos: form.secondApellido,
        apodo: form.apodo,
        email: form.email,
        documentType: form.docType,
        documentNumber: form.docNumber,
        document2: form.doc2,
        birthDate: form.birthDate,
        address: form.address,
        barrio: form.barrio,
        phone: form.phone,
        celularPrefix: form.celularPrefix,
        celular: form.celular,
        comentario: form.comment,
        actividadEconomica: form.actividad,
        active: form.active,
        latitude: form.latitude,
        longitude: form.longitude,
      });
      setNotification({ type: 'success', message: 'Datos básicos guardados correctamente.' });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: 'Error al actualizar los datos.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {notification && <BasicTabNotification notification={notification} />}

      <div className="grid grid-cols-2 gap-3.5">
        <div className="flex flex-col space-y-1">
          <label className="text-[10px] uppercase font-extrabold text-gray-500">Primer nombre *</label>
          <input
            type="text"
            value={form.firstName}
            onChange={(e) => patchForm({ firstName: e.target.value })}
            className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F]"
          />
        </div>
        <div className="flex flex-col space-y-1">
          <label className="text-[10px] uppercase font-extrabold text-gray-500">Segundo nombre</label>
          <input
            type="text"
            placeholder="Ingresar segundo nombre"
            value={form.secondName}
            onChange={(e) => patchForm({ secondName: e.target.value })}
            className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <div className="flex flex-col space-y-1">
          <label className="text-[10px] uppercase font-extrabold text-gray-500">Primer apellido *</label>
          <input
            type="text"
            value={form.firstApellido}
            onChange={(e) => patchForm({ firstApellido: e.target.value })}
            className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F]"
          />
        </div>
        <div className="flex flex-col space-y-1">
          <label className="text-[10px] uppercase font-extrabold text-gray-500">Segundo apellido</label>
          <input
            type="text"
            value={form.secondApellido}
            onChange={(e) => patchForm({ secondApellido: e.target.value })}
            className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F]"
          />
        </div>
      </div>

      <div className="flex flex-col space-y-1">
        <label className="text-[10px] uppercase font-extrabold text-gray-500">Apodo / Alias *</label>
        <input
          type="text"
          value={form.apodo}
          onChange={(e) => patchForm({ apodo: e.target.value })}
          className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F]"
        />
      </div>

      <div className="flex flex-col space-y-1">
        <label className="text-[10px] uppercase font-extrabold text-gray-500">E-Mail</label>
        <input
          type="email"
          placeholder="Ingresar e-mail"
          value={form.email}
          onChange={(e) => patchForm({ email: e.target.value })}
          className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F]"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col space-y-1 col-span-1">
          <label className="text-[10px] uppercase font-extrabold text-gray-500">Tipo Doc *</label>
          <select
            value={form.docType}
            onChange={(e) => patchForm({ docType: e.target.value })}
            className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-white focus:border-[#8CC63F]"
          >
            <option value="CPF">CPF</option>
            <option value="Cédula">Cédula</option>
            <option value="DNI">DNI</option>
            <option value="RUT">RUT</option>
          </select>
        </div>
        <div className="flex flex-col space-y-1 col-span-2">
          <label className="text-[10px] uppercase font-extrabold text-gray-500">Documento 1 *</label>
          <input
            type="text"
            value={form.docNumber}
            onChange={(e) => patchForm({ docNumber: e.target.value })}
            className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <div className="flex flex-col space-y-1">
          <label className="text-[10px] uppercase font-extrabold text-gray-500">Documento 2</label>
          <input
            type="text"
            placeholder="Ingresar documento"
            value={form.doc2}
            onChange={(e) => patchForm({ doc2: e.target.value })}
            className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F]"
          />
        </div>
        <div className="flex flex-col space-y-1">
          <label className="text-[10px] uppercase font-extrabold text-gray-500">Fecha de Nacimiento</label>
          <input
            type="date"
            value={form.birthDate}
            onChange={(e) => patchForm({ birthDate: e.target.value })}
            className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] text-gray-600 focus:border-[#8CC63F]"
          />
        </div>
      </div>

      <CustomerModalGpsSection
        address={form.address}
        barrio={form.barrio}
        latitude={form.latitude}
        longitude={form.longitude}
        gettingLocation={gettingLocation}
        onAddressChange={(value) => patchForm({ address: value })}
        onBarrioChange={(value) => patchForm({ barrio: value })}
        onLatitudeChange={(value) => patchForm({ latitude: value })}
        onLongitudeChange={(value) => patchForm({ longitude: value })}
        onGettingLocationChange={setGettingLocation}
      />

      <div className="grid grid-cols-2 gap-3.5">
        <div className="flex flex-col space-y-1">
          <label className="text-[10px] uppercase font-extrabold text-gray-500">Barrio</label>
          <input
            type="text"
            placeholder="Ingresar barrio"
            value={form.barrio}
            onChange={(e) => patchForm({ barrio: e.target.value })}
            className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F]"
          />
        </div>
        <div className="flex flex-col space-y-1">
          <label className="text-[10px] uppercase font-extrabold text-gray-500">Teléfono</label>
          <input
            type="text"
            placeholder="Ingresar teléfono"
            value={form.phone}
            onChange={(e) => patchForm({ phone: e.target.value })}
            className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F]"
          />
        </div>
      </div>

      <div className="flex flex-col space-y-1">
        <label className="text-[10px] uppercase font-extrabold text-gray-500">Teléfono Celular *</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={form.celularPrefix}
            onChange={(e) => patchForm({ celularPrefix: e.target.value })}
            className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] w-14 text-center focus:border-[#8CC63F]"
            placeholder="55"
          />
          <input
            type="text"
            value={form.celular}
            onChange={(e) => patchForm({ celular: e.target.value })}
            className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] flex-1 focus:border-[#8CC63F]"
            placeholder="Celular sin código de país"
          />
        </div>
      </div>

      <div className="flex flex-col space-y-1">
        <label className="text-[10px] uppercase font-extrabold text-gray-500">Actividad Económica</label>
        <select
          value={form.actividad}
          onChange={(e) => patchForm({ actividad: e.target.value })}
          className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-white focus:border-[#8CC63F]"
        >
          <option value="Comercio">Comercio Minorista / Tienda</option>
          <option value="Servicios">Servicios / Oficios</option>
          <option value="Producción">Producción / Manufactura</option>
          <option value="Otros">Otros</option>
        </select>
      </div>

      <div className="flex flex-col space-y-1">
        <label className="text-[10px] uppercase font-extrabold text-gray-500">Comentarios o Indicaciones</label>
        <textarea
          value={form.comment}
          onChange={(e) => patchForm({ comment: e.target.value })}
          className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] h-18 focus:border-[#8CC63F]"
        />
      </div>

      <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-gray-50/50">
        <span className="text-xs font-bold text-gray-700">Estado del Cliente: Activo</span>
        <div className="relative inline-block w-10 align-middle select-none transition duration-200 ease-in">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => patchForm({ active: e.target.checked })}
            className="sr-only"
            id="modalActive"
          />
          <label
            htmlFor="modalActive"
            className={`block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ${
              form.active ? 'bg-[#8CC63F]' : 'bg-gray-300'
            }`}
          >
            <span
              className={`block h-4 w-4 rounded-full bg-white shadow transform duration-200 ease-in-out mt-1 ${
                form.active ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSaveBasic}
          disabled={saving}
          className="px-5 py-2 text-xs font-bold text-white bg-[#8CC63F] hover:bg-[#7BB52F] rounded-lg transition-colors shadow-sm cursor-pointer flex items-center gap-1"
        >
          {saving ? 'Guardando...' : 'Guardar Ficha'}
        </button>
      </div>
    </div>
  );
}
