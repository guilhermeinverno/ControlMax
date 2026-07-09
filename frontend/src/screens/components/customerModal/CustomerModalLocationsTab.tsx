import { useEffect, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { MapPin, Phone, Trash2 } from 'lucide-react';
import { db } from '../../../lib/firebase';
import { Customer, CustomerAddress, CustomerPhone } from '../../../types/company';

interface CustomerModalLocationsTabProps {
  customer: Customer;
}

export function CustomerModalLocationsTab({ customer }: CustomerModalLocationsTabProps) {
  const [inputAddress, setInputAddress] = useState('');
  const [inputBarrio, setInputBarrio] = useState('');
  const [inputCity, setInputCity] = useState('Brasilia');
  const [inputPhone, setInputPhone] = useState('');
  const [addresses, setAddresses] = useState<CustomerAddress[]>(customer.addresses || []);
  const [phones, setPhones] = useState<CustomerPhone[]>(customer.phones || []);

  useEffect(() => {
    setAddresses(customer.addresses || []);
    setPhones(customer.phones || []);
  }, [customer]);

  const persistAddresses = async (updated: CustomerAddress[]) => {
    if (!customer.id) return;
    try {
      await updateDoc(doc(db, 'customers', customer.id), { addresses: updated });
    } catch (err) {
      console.error(err);
    }
  };

  const persistPhones = async (updated: CustomerPhone[]) => {
    if (!customer.id) return;
    try {
      await updateDoc(doc(db, 'customers', customer.id), { phones: updated });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddAddress = async () => {
    if (!inputAddress.trim() || !customer.id) return;
    const newAddr: CustomerAddress = {
      id: Date.now().toString(),
      address: inputAddress.trim(),
      barrio: inputBarrio.trim(),
      city: inputCity.trim(),
    };
    const updated = [...addresses, newAddr];
    setAddresses(updated);
    setInputAddress('');
    setInputBarrio('');
    await persistAddresses(updated);
  };

  const handleDeleteAddress = async (id: string) => {
    const updated = addresses.filter((item) => item.id !== id);
    setAddresses(updated);
    await persistAddresses(updated);
  };

  const handleAddPhone = async () => {
    if (!inputPhone.trim() || !customer.id) return;
    const newPhone: CustomerPhone = {
      id: Date.now().toString(),
      number: inputPhone.trim(),
    };
    const updated = [...phones, newPhone];
    setPhones(updated);
    setInputPhone('');
    await persistPhones(updated);
  };

  const handleDeletePhone = async (id: string) => {
    const updated = phones.filter((item) => item.id !== id);
    setPhones(updated);
    await persistPhones(updated);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-2xl space-y-3 border border-gray-100 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-gray-600 uppercase tracking-wider border-b border-gray-200 pb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#8CC63F]" />
              Añadir Dirección Adicional
            </h3>

            <div className="flex flex-col space-y-1">
              <label className="text-[10px] uppercase font-black text-gray-400">Dirección *</label>
              <input
                type="text"
                placeholder="Ej: Calle 10, Edificio Royal Suite 1202"
                value={inputAddress}
                onChange={(e) => setInputAddress(e.target.value)}
                className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase font-black text-gray-400">Barrio</label>
                <input
                  type="text"
                  placeholder="Ej: Centro"
                  value={inputBarrio}
                  onChange={(e) => setInputBarrio(e.target.value)}
                  className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
                />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase font-black text-gray-400">Ciudad</label>
                <input
                  type="text"
                  placeholder="Ej: Brasilia"
                  value={inputCity}
                  onChange={(e) => setInputCity(e.target.value)}
                  className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddAddress}
            className="w-full bg-[#8CC63F] hover:bg-[#7BB52F] text-white font-bold p-2.5 rounded-lg text-xs transition-colors mt-2 cursor-pointer"
          >
            Añadir Dirección
          </button>
        </div>

        <div className="bg-gray-50 p-4 rounded-2xl space-y-3 border border-gray-100 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-gray-600 uppercase tracking-wider border-b border-gray-200 pb-1.5 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-[#8CC63F]" />
              Añadir Teléfono Adicional
            </h3>

            <div className="flex flex-col space-y-1">
              <label className="text-[10px] uppercase font-black text-gray-400">Número de Teléfono *</label>
              <input
                type="tel"
                placeholder="Ej: +55 6191202335"
                value={inputPhone}
                onChange={(e) => setInputPhone(e.target.value)}
                className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddPhone}
            className="w-full bg-[#8CC63F] hover:bg-[#7BB52F] text-white font-bold p-2.5 rounded-lg text-xs transition-colors mt-2 cursor-pointer"
          >
            Añadir Teléfono
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-bold text-gray-700 border-b border-gray-100 pb-1">Direcciones</h4>
        {addresses.length === 0 ? (
          <div className="text-xs text-gray-400 italic">No hay direcciones adicionales registradas.</div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {addresses.map((addr) => (
              <div key={addr.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="bg-[#8CC63F]/90 h-1.5 w-full" />
                <div className="p-3 flex justify-between items-start">
                  <div className="space-y-1 text-xs text-gray-700">
                    <div><span className="font-extrabold text-gray-500 uppercase text-[9px]">Dirección:</span> {addr.address}</div>
                    {addr.barrio && <div><span className="font-extrabold text-gray-500 uppercase text-[9px]">Barrio:</span> {addr.barrio}</div>}
                    <div><span className="font-extrabold text-gray-500 uppercase text-[9px]">Ciudad:</span> {addr.city}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="text-red-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3 pt-2">
        <h4 className="text-sm font-bold text-gray-700 border-b border-gray-100 pb-1">Teléfonos</h4>
        {phones.length === 0 ? (
          <div className="text-xs text-gray-400 italic">No hay teléfonos adicionales registrados.</div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {phones.map((ph) => (
              <div key={ph.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="bg-[#8CC63F]/90 h-1.5 w-full" />
                <div className="p-3 flex justify-between items-start">
                  <div className="space-y-1 text-xs text-gray-700">
                    <div><span className="font-extrabold text-gray-500 uppercase text-[9px]">Número:</span> {ph.number}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeletePhone(ph.id)}
                    className="text-red-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
