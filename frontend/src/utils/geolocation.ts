/** Solicita posição do navegador — recurso intencional para mapas e cadastro de clientes. */
export function getBrowserPosition(
  onSuccess: PositionCallback,
  onError?: PositionErrorCallback,
  options?: PositionOptions
): void {
  if (!navigator.geolocation) {
    onError?.({
      code: 2,
      message: 'Geolocalização não suportada neste navegador.',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    });
    return;
  }
  navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
}

/** Observa posição do navegador em tempo real (mapas de cobradores). */
export function watchBrowserPosition(
  onSuccess: PositionCallback,
  onError?: PositionErrorCallback,
  options?: PositionOptions
): number {
  return navigator.geolocation.watchPosition(onSuccess, onError, options);
}

export function clearBrowserPositionWatch(watchId: number): void {
  navigator.geolocation.clearWatch(watchId);
}
