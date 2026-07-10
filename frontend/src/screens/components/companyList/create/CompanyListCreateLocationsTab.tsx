import { MapPin, Phone, Trash2 } from 'lucide-react';
import type { useCustomerFormFieldSetters } from '../useCustomerFormFieldSetters';

interface CompanyListCreateLocationsTabProps {
  fields: ReturnType<typeof useCustomerFormFieldSetters>;
}

export function CompanyListCreateLocationsTab({ fields }: CompanyListCreateLocationsTabProps) {
  return (
    <div className="space-y-4 animate-fadeIn">
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
                value={fields.createInputAddress}
                onChange={(e) => fields.setCreateInputAddress(e.target.value)}
                className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase font-black text-gray-400">Barrio</label>
                <input
                  type="text"
                  placeholder="Ej: Centro"
                  value={fields.createInputBarrio}
                  onChange={(e) => fields.setCreateInputBarrio(e.target.value)}
                  className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
                />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase font-black text-gray-400">Ciudad</label>
                <input
                  type="text"
                  placeholder="Ej: Brasilia"
                  value={fields.createInputCity}
                  onChange={(e) => fields.setCreateInputCity(e.target.value)}
                  className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!fields.createInputAddress.trim()) return;
              const newAddr = {
                id: Date.now().toString(),
                address: fields.createInputAddress.trim(),
                barrio: fields.createInputBarrio.trim(),
                city: fields.createInputCity.trim(),
              };
              fields.setFormAddresses([...fields.formAddresses, newAddr]);
              fields.setCreateInputAddress('');
              fields.setCreateInputBarrio('');
            }}
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
                value={fields.createInputPhone}
                onChange={(e) => fields.setCreateInputPhone(e.target.value)}
                className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!fields.createInputPhone.trim()) return;
              const newPhone = {
                id: Date.now().toString(),
                number: fields.createInputPhone.trim(),
              };
              fields.setFormPhones([...fields.formPhones, newPhone]);
              fields.setCreateInputPhone('');
            }}
            className="w-full bg-[#8CC63F] hover:bg-[#7BB52F] text-white font-bold p-2.5 rounded-lg text-xs transition-colors mt-2 cursor-pointer"
          >
            Añadir Teléfono
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-bold text-gray-700 border-b border-gray-100 pb-1">Direcciones Adicionales</h4>
        {fields.formAddresses.length === 0 ? (
          <div className="text-xs text-gray-400 italic">Ninguna dirección adicional agregada aún.</div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {fields.formAddresses.map((addr) => (
              <div key={addr.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="bg-[#8CC63F]/90 h-1.5 w-full" />
                <div className="p-3 flex justify-between items-start">
                  <div className="space-y-1 text-xs text-gray-700">
                    <div>
                      <span className="font-extrabold text-gray-500 uppercase text-[9px]">Dirección:</span> {addr.address}
                    </div>
                    {addr.barrio && (
                      <div>
                        <span className="font-extrabold text-gray-500 uppercase text-[9px]">Barrio:</span> {addr.barrio}
                      </div>
                    )}
                    <div>
                      <span className="font-extrabold text-gray-500 uppercase text-[9px]">Ciudad:</span> {addr.city}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => fields.setFormAddresses(fields.formAddresses.filter((item) => item.id !== addr.id))}
                    className="text-red-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded cursor-pointer"
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
        <h4 className="text-sm font-bold text-gray-700 border-b border-gray-100 pb-1">Teléfonos Adicionales</h4>
        {fields.formPhones.length === 0 ? (
          <div className="text-xs text-gray-400 italic">Ningún teléfono adicional agregado aún.</div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {fields.formPhones.map((phone) => (
              <div key={phone.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="bg-[#8CC63F]/90 h-1.5 w-full" />
                <div className="p-3 flex justify-between items-start">
                  <div className="space-y-1 text-xs text-gray-700">
                    <div>
                      <span className="font-extrabold text-gray-500 uppercase text-[9px]">Número:</span> {phone.number}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => fields.setFormPhones(fields.formPhones.filter((item) => item.id !== phone.id))}
                    className="text-red-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded cursor-pointer"
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
