import { Trash2 } from 'lucide-react';
import type { useCustomerFormFieldSetters } from '../useCustomerFormFieldSetters';

interface CompanyListCreateReferencesTabProps {
  fields: ReturnType<typeof useCustomerFormFieldSetters>;
}

export function CompanyListCreateReferencesTab({ fields }: CompanyListCreateReferencesTabProps) {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-gray-50 p-4 rounded-2xl space-y-3 border border-gray-100">
        <h3 className="text-xs font-extrabold text-gray-600 uppercase tracking-wider">
          Añadir Referencia Familiar o Comercial
        </h3>

        <div className="flex flex-col space-y-1">
          <label className="text-[10px] uppercase font-black text-gray-400">Nombre Completo *</label>
          <input
            type="text"
            placeholder="Nombre de la referencia"
            value={fields.createRefName}
            onChange={(e) => fields.setCreateRefName(e.target.value)}
            className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] uppercase font-black text-gray-400">País</label>
            <select
              value={fields.createRefCountry}
              onChange={(e) => fields.setCreateRefCountry(e.target.value)}
              className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
            >
              <option value="SIN PAÍS">SIN PAÍS</option>
              <option value="Brasil">Brasil</option>
              <option value="Colombia">Colombia</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] uppercase font-black text-gray-400">Estado</label>
            <input
              type="text"
              placeholder="Estado/Prov"
              value={fields.createRefState}
              onChange={(e) => fields.setCreateRefState(e.target.value)}
              className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] uppercase font-black text-gray-400">Ciudad</label>
            <input
              type="text"
              placeholder="Ciudad"
              value={fields.createRefCity}
              onChange={(e) => fields.setCreateRefCity(e.target.value)}
              className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
            />
          </div>
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-[10px] uppercase font-black text-gray-400">Dirección Completa *</label>
          <input
            type="text"
            placeholder="Calle, número, depto"
            value={fields.createRefAddress}
            onChange={(e) => fields.setCreateRefAddress(e.target.value)}
            className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] uppercase font-black text-gray-400">Teléfono Fijo</label>
            <input
              type="tel"
              placeholder="Fijo u alternativo"
              value={fields.createRefPhone}
              onChange={(e) => fields.setCreateRefPhone(e.target.value)}
              className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] uppercase font-black text-gray-400">Celular *</label>
            <input
              type="tel"
              placeholder="Celular con código"
              value={fields.createRefCelular}
              onChange={(e) => fields.setCreateRefCelular(e.target.value)}
              className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
            />
          </div>
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-[10px] uppercase font-black text-gray-400">Comentarios / Relación *</label>
          <input
            type="text"
            placeholder="Ej: Madre, Hermano, Socio comercial..."
            value={fields.createRefComment}
            onChange={(e) => fields.setCreateRefComment(e.target.value)}
            className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            if (!fields.createRefName.trim() || !fields.createRefCelular.trim()) return;
            const newRef = {
              id: Date.now().toString(),
              name: fields.createRefName.trim(),
              country: fields.createRefCountry,
              state: fields.createRefState.trim(),
              city: fields.createRefCity.trim(),
              address: fields.createRefAddress.trim(),
              phone: fields.createRefPhone.trim(),
              celular: fields.createRefCelular.trim(),
              comment: fields.createRefComment.trim(),
            };
            fields.setFormReferencesList([...fields.formReferencesList, newRef]);
            fields.setCreateRefName('');
            fields.setCreateRefState('');
            fields.setCreateRefCity('');
            fields.setCreateRefAddress('');
            fields.setCreateRefPhone('');
            fields.setCreateRefCelular('');
            fields.setCreateRefComment('');
          }}
          className="w-full bg-[#8CC63F] hover:bg-[#7BB52F] text-white font-bold p-2.5 rounded-lg text-xs transition-colors cursor-pointer"
        >
          Añadir Referencia
        </button>
      </div>

      <div className="space-y-3 pt-2">
        <h4 className="text-sm font-bold text-gray-700 border-b border-gray-100 pb-1">Referencias Agregadas</h4>
        {fields.formReferencesList.length === 0 ? (
          <div className="text-xs text-gray-400 italic text-center py-4">Ninguna referencia agregada aún.</div>
        ) : (
          <div className="space-y-3">
            {fields.formReferencesList.map((ref) => (
              <div key={ref.id} className="border border-gray-200 rounded-2xl p-4 bg-white shadow-sm flex justify-between items-start">
                <div className="space-y-1.5 text-xs text-gray-700 flex-1">
                  <div className="font-bold text-[#6B21A8] text-sm">{ref.name}</div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">
                    Relación/Comentarios: {ref.comment}
                  </div>
                  <div className="grid grid-cols-2 gap-1 pt-1 text-[11px] border-t border-gray-50">
                    <div>
                      <span className="font-extrabold text-gray-400">Celular:</span> {ref.celular}
                    </div>
                    {ref.phone && (
                      <div>
                        <span className="font-extrabold text-gray-400">Fijo:</span> {ref.phone}
                      </div>
                    )}
                  </div>
                  <div className="text-[11px]">
                    <span className="font-extrabold text-gray-400">Ubicación:</span> {ref.address} ({ref.city || 'Sin ciudad'},{' '}
                    {ref.country})
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => fields.setFormReferencesList(fields.formReferencesList.filter((item) => item.id !== ref.id))}
                  className="text-red-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded shrink-0 ml-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
