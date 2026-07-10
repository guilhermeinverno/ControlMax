import { Camera, Trash2 } from 'lucide-react';
import type { useCustomerFormFieldSetters } from '../useCustomerFormFieldSetters';

interface CompanyListCreatePhotosTabProps {
  fields: ReturnType<typeof useCustomerFormFieldSetters>;
}

export function CompanyListCreatePhotosTab({ fields }: CompanyListCreatePhotosTabProps) {
  return (
    <div className="space-y-4 animate-fadeIn text-center">
      <div className="border-2 border-dashed border-gray-200 rounded-3xl p-8 flex flex-col items-center justify-center space-y-3 bg-gray-50/50 hover:bg-gray-50 transition-colors">
        <div className="p-3 bg-[#8CC63F]/10 rounded-2xl text-[#8CC63F]">
          <Camera className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-bold text-gray-700">Subir fotos de fachada del negocio / cliente</p>
          <p className="text-[10px] text-gray-400">Soporta PNG, JPG. Las imágenes se procesan localmente.</p>
        </div>
        <label className="bg-[#8CC63F] hover:bg-[#7BB52F] text-white text-xs font-bold py-2 px-4 rounded-xl cursor-pointer transition-colors shadow-sm">
          Seleccionar Archivo
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onloadend = () => {
                const base64String = reader.result as string;
                fields.setFormPhotos([...fields.formPhotos, base64String]);
              };
              reader.readAsDataURL(file);
            }}
            className="hidden"
          />
        </label>
      </div>

      <div className="space-y-3 text-left">
        <h4 className="text-sm font-bold text-gray-700 border-b border-gray-100 pb-1">Fotos Cargadas</h4>
        {fields.formPhotos.length === 0 ? (
          <div className="text-xs text-gray-400 italic text-center py-4">Ninguna foto cargada aún.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {fields.formPhotos.map((photo, idx) => (
              <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-xs group">
                <img src={photo} referrerPolicy="no-referrer" alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => fields.setFormPhotos(fields.formPhotos.filter((_, i) => i !== idx))}
                  className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600 text-white p-1.5 rounded-xl backdrop-blur-xs transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
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
