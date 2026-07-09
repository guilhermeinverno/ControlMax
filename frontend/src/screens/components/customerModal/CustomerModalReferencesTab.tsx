import { useEffect, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { Trash2 } from 'lucide-react';
import { db } from '../../../lib/firebase';
import { Customer, CustomerReference } from '../../../types/company';

interface CustomerModalReferencesTabProps {
  customer: Customer;
}

export function CustomerModalReferencesTab({ customer }: CustomerModalReferencesTabProps) {
  const [refList, setRefList] = useState<CustomerReference[]>(customer.references || []);
  const [refName, setRefName] = useState('');
  const [refCountry, setRefCountry] = useState('SIN PAÍS');
  const [refState, setRefState] = useState('');
  const [refCity, setRefCity] = useState('');
  const [refAddress, setRefAddress] = useState('');
  const [refPhone, setRefPhone] = useState('');
  const [refCelular, setRefCelular] = useState('');
  const [refComment, setRefComment] = useState('');

  useEffect(() => {
    setRefList(customer.references || []);
  }, [customer]);

  const persistReferences = async (updated: CustomerReference[]) => {
    if (!customer.id) return;
    try {
      await updateDoc(doc(db, 'customers', customer.id), { references: updated });
    } catch (err) {
      console.error(err);
    }
  };

  const resetReferenceForm = () => {
    setRefName('');
    setRefState('');
    setRefCity('');
    setRefAddress('');
    setRefPhone('');
    setRefCelular('');
    setRefComment('');
  };

  const handleAddReference = async () => {
    if (!refName.trim() || !refCelular.trim() || !customer.id) return;
    const newRef: CustomerReference = {
      id: Date.now().toString(),
      name: refName.trim(),
      country: refCountry,
      state: refState.trim(),
      city: refCity.trim(),
      address: refAddress.trim(),
      phone: refPhone.trim(),
      celular: refCelular.trim(),
      comment: refComment.trim(),
    };
    const updated = [...refList, newRef];
    setRefList(updated);
    resetReferenceForm();
    await persistReferences(updated);
  };

  const handleDeleteReference = async (id: string) => {
    const updated = refList.filter((item) => item.id !== id);
    setRefList(updated);
    await persistReferences(updated);
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-2xl space-y-3 border border-gray-100">
        <h3 className="text-xs font-extrabold text-gray-600 uppercase tracking-wider">Añadir Referencia Familiar o Comercial</h3>

        <div className="flex flex-col space-y-1">
          <label className="text-[10px] uppercase font-black text-gray-400">Nombre Completo *</label>
          <input
            type="text"
            placeholder="Nombre de la referencia"
            value={refName}
            onChange={(e) => setRefName(e.target.value)}
            className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] uppercase font-black text-gray-400">País</label>
            <select
              value={refCountry}
              onChange={(e) => setRefCountry(e.target.value)}
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
              value={refState}
              onChange={(e) => setRefState(e.target.value)}
              className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] uppercase font-black text-gray-400">Ciudad</label>
            <input
              type="text"
              placeholder="Ciudad"
              value={refCity}
              onChange={(e) => setRefCity(e.target.value)}
              className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
            />
          </div>
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-[10px] uppercase font-black text-gray-400">Dirección Completa *</label>
          <input
            type="text"
            placeholder="Calle, número, depto"
            value={refAddress}
            onChange={(e) => setRefAddress(e.target.value)}
            className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] uppercase font-black text-gray-400">Teléfono Fijo</label>
            <input
              type="tel"
              placeholder="Fijo u alternativo"
              value={refPhone}
              onChange={(e) => setRefPhone(e.target.value)}
              className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] uppercase font-black text-gray-400">Celular *</label>
            <input
              type="tel"
              placeholder="Celular con código"
              value={refCelular}
              onChange={(e) => setRefCelular(e.target.value)}
              className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
            />
          </div>
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-[10px] uppercase font-black text-gray-400">Comentarios / Relación *</label>
          <input
            type="text"
            placeholder="Ej: Madre, Hermano, Socio comercial..."
            value={refComment}
            onChange={(e) => setRefComment(e.target.value)}
            className="border border-gray-200 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#8CC63F]"
          />
        </div>

        <button
          type="button"
          onClick={handleAddReference}
          className="w-full bg-[#8CC63F] hover:bg-[#7BB52F] text-white font-bold p-2.5 rounded-lg text-xs transition-colors cursor-pointer"
        >
          Guardar Referencia
        </button>
      </div>

      <div className="space-y-3 pt-2">
        <h4 className="text-sm font-bold text-gray-700 border-b border-gray-100 pb-1">Referencias Guardadas</h4>
        {refList.length === 0 ? (
          <div className="text-xs text-gray-400 italic text-center py-4">No hay referencias registradas para este cliente.</div>
        ) : (
          <div className="space-y-3">
            {refList.map((ref) => (
              <div key={ref.id} className="border border-gray-200 rounded-2xl p-4 bg-white shadow-sm flex justify-between items-start">
                <div className="space-y-1.5 text-xs text-gray-700 flex-1">
                  <div className="font-bold text-[#6B21A8] text-sm">{ref.name}</div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Relación/Comentarios: {ref.comment}</div>
                  <div className="grid grid-cols-2 gap-1 pt-1 text-[11px] border-t border-gray-50">
                    <div><span className="font-extrabold text-gray-400">Celular:</span> {ref.celular}</div>
                    {ref.phone && <div><span className="font-extrabold text-gray-400">Fijo:</span> {ref.phone}</div>}
                  </div>
                  <div className="text-[11px]">
                    <span className="font-extrabold text-gray-400">Ubicación:</span> {ref.address} ({ref.city || 'Sin ciudad'}, {ref.country})
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteReference(ref.id)}
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
