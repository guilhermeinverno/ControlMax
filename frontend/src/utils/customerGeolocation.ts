import { getBrowserPosition } from './geolocation';

function geolocationErrorMessage(error: GeolocationPositionError): string {
  if (error.code === error.PERMISSION_DENIED) {
    return 'Permissão de localização negada. Por favor, ative as permissões de localização no seu navegador.';
  }
  return 'Não foi possível obter a sua localização atual.';
}

interface ReverseGeocodeFields {
  currentAddress: string;
  currentBarrio: string;
  currentCity?: string;
  setAddress: (value: string) => void;
  setBarrio: (value: string) => void;
  setCity?: (value: string) => void;
}

function applyBarrioFromAddress(
  address: Record<string, string>,
  currentBarrio: string,
  setBarrio: (value: string) => void,
): void {
  if (currentBarrio) return;

  if (address.suburb) {
    setBarrio(address.suburb);
    return;
  }

  if (address.neighbourhood) {
    setBarrio(address.neighbourhood);
  }
}

function applyCityFromAddress(
  address: Record<string, string>,
  currentCity: string | undefined,
  setCity?: (value: string) => void,
): void {
  if (!setCity || currentCity) return;

  if (address.city) {
    setCity(address.city);
    return;
  }

  if (address.town) {
    setCity(address.town);
  }
}

async function applyReverseGeocode(lat: number, lng: number, fields: ReverseGeocodeFields): Promise<void> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
    if (!res.ok) return;

    const data = await res.json();
    if (!data?.display_name) return;

    if (!fields.currentAddress) {
      fields.setAddress(data.display_name);
    }

    if (data.address) {
      applyBarrioFromAddress(data.address, fields.currentBarrio, fields.setBarrio);
      applyCityFromAddress(data.address, fields.currentCity, fields.setCity);
    }
  } catch (err) {
    console.warn('Note: Reverse geocoding failed (non-blocking, GPS coordinates were set successfully):', err);
  }
}

interface RequestGeolocationOptions extends ReverseGeocodeFields {
  setLatitude: (value: number) => void;
  setLongitude: (value: number) => void;
  setGettingLocation: (value: boolean) => void;
  logContext?: string;
}

function geolocationLogLabel(logContext?: string): string {
  return logContext ? ' (' + logContext + ')' : '';
}

export function requestGeolocationWithReverseGeocode(options: RequestGeolocationOptions): void {
  options.setGettingLocation(true);

  getBrowserPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      options.setLatitude(latitude);
      options.setLongitude(longitude);
      options.setGettingLocation(false);
      await applyReverseGeocode(latitude, longitude, options);
    },
    (error) => {
      const label = geolocationLogLabel(options.logContext);
      console.error('Error getting location' + label + ':', error);
      alert(geolocationErrorMessage(error));
      options.setGettingLocation(false);
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
  );
}
