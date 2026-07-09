import { useEffect, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { Camera, X } from 'lucide-react';
import type { HtmlInputChangeEvent } from '../../../types/reactEvents';
import { db } from '../../../lib/firebase';
import { Customer } from '../../../types/company';
import { DEMO_PHOTOS } from './demoData';

interface CustomerModalPhotosTabProps {
  customer: Customer;
}

export function CustomerModalPhotosTab({ customer }: CustomerModalPhotosTabProps) {
  const [photos, setPhotos] = useState<string[]>(customer.photos || []);

  useEffect(() => {
    setPhotos(customer.photos || []);
  }, [customer]);

  const photosToDisplay = photos.length > 0 ? photos : DEMO_PHOTOS;

  const persistPhotos = async (updated: string[]) => {
    if (!customer.id) return;
    try {
      await updateDoc(doc(db, 'customers', customer.id), { photos: updated });
    } catch (err) {
      console.error(err);
    }
  };

  const handlePhotoUpload = (e: HtmlInputChangeEvent) => {
    const file = e.target.files?.[0];
    if (!file || !customer.id) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const updated = [...photos, base64String];
      setPhotos(updated);
      await persistPhotos(updated);
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = async (photo: string) => {
    const updated = photos.filter((item) => item !== photo);
    setPhotos(updated);
    await persistPhotos(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
        <h3 className="text-sm font-bold text-gray-700">Fotos del Cliente / Casa</h3>
        <label className="bg-[#6B21A8] hover:bg-[#52006A] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5">
          <Camera className="w-4 h-4" />
          <span>Subir Foto</span>
          <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
        </label>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wide">Fotos principales</h4>
        <div className="grid grid-cols-3 gap-3">
          {photosToDisplay.map((photo) => (
            <div key={photo} className="relative aspect-square border border-gray-100 rounded-2xl overflow-hidden bg-gray-50 shadow-xs group">
              <img
                src={photo}
                alt="Foto do cliente"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <button
                type="button"
                onClick={() => handleDeletePhoto(photo)}
                className="absolute top-1.5 right-1.5 bg-white text-gray-600 hover:text-red-500 rounded-full p-1 shadow-sm transition-transform scale-90 group-hover:scale-100 cursor-pointer"
                title="Eliminar foto"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wide">Todas las fotos</h4>
        {photosToDisplay.length === 0 ? (
          <div className="text-xs text-gray-400 italic py-6 text-center">No hay fotos guardadas en el expediente del cliente.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {photosToDisplay.map((photo) => (
              <div key={photo} className="aspect-video border border-gray-100 rounded-2xl overflow-hidden bg-gray-50 shadow-xs">
                <img
                  src={photo}
                  alt="Foto do expediente"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
