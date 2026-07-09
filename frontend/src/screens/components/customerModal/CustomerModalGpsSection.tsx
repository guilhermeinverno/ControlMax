import { MapPin } from 'lucide-react';
import { gpsLocationButtonLabel } from '../../../utils/statusLabels';
import { requestCustomerGeolocation } from './customerGeolocation';

interface CustomerModalGpsSectionProps {
  address: string;
  barrio: string;
  latitude: number | null;
  longitude: number | null;
  gettingLocation: boolean;
  onAddressChange: (value: string) => void;
  onBarrioChange: (value: string) => void;
  onLatitudeChange: (value: number | null) => void;
  onLongitudeChange: (value: number | null) => void;
  onGettingLocationChange: (value: boolean) => void;
}

export function CustomerModalGpsSection({
  address,
  barrio,
  latitude,
  longitude,
  gettingLocation,
  onAddressChange,
  onBarrioChange,
  onLatitudeChange,
  onLongitudeChange,
  onGettingLocationChange,
}: CustomerModalGpsSectionProps) {
  const hasCoordinates = latitude != null && longitude != null;

  const handleGetCurrentLocation = () => {
    requestCustomerGeolocation(
      address,
      barrio,
      (value) => onLatitudeChange(value),
      (value) => onLongitudeChange(value),
      onAddressChange,
      onBarrioChange,
      onGettingLocationChange,
    );
  };

  return (
    <div className="flex flex-col space-y-2">
      <label className="text-[10px] uppercase font-extrabold text-gray-500">Dirección</label>
      <input
        type="text"
        value={address}
        onChange={(e) => onAddressChange(e.target.value)}
        className="border border-gray-200 rounded-lg p-2.5 text-xs outline-none bg-[#F9FAFB] focus:border-[#8CC63F] w-full"
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-0.5">
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={gettingLocation}
          className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border shadow-sm ${
            hasCoordinates
              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
              : 'bg-[#8CC63F] text-white border-transparent hover:bg-[#7BB52F] active:scale-[0.98]'
          }`}
          title="Obter localização atual"
        >
          <MapPin className={`w-4 h-4 ${gettingLocation ? 'animate-bounce text-white' : 'text-current'}`} />
          {gpsLocationButtonLabel(
            gettingLocation,
            hasCoordinates,
            'Atualizar Localização GPS',
            'Adicionar Localização Atual',
          )}
        </button>

        {hasCoordinates && latitude != null && longitude != null && (
          <div className="flex-1 flex items-center justify-between px-3 py-1.5 bg-green-50 border border-green-100 rounded-xl text-[10px] text-green-800 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="font-extrabold uppercase text-[9px]">Coordenadas:</span>
              <span>{latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                onLatitudeChange(null);
                onLongitudeChange(null);
              }}
              className="text-red-500 hover:text-red-700 font-bold ml-2 cursor-pointer uppercase text-[9px] hover:underline"
            >
              Remover
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
