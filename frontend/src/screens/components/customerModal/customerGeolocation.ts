import { requestGeolocationWithReverseGeocode } from '../../../utils/customerGeolocation';

export function requestCustomerGeolocation(
  currentAddress: string,
  currentBarrio: string,
  setLatitude: (value: number) => void,
  setLongitude: (value: number) => void,
  setAddress: (value: string) => void,
  setBarrio: (value: string) => void,
  setGettingLocation: (value: boolean) => void,
): void {
  requestGeolocationWithReverseGeocode({
    currentAddress,
    currentBarrio,
    setLatitude,
    setLongitude,
    setAddress,
    setBarrio,
    setGettingLocation,
    logContext: 'modal',
  });
}
