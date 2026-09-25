import type { GeolocationErrorCode, GeolocationResult } from './types';

export function mapGeolocationError(error: GeolocationPositionError): GeolocationErrorCode {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'PERMISSION_DENIED';
    case error.POSITION_UNAVAILABLE:
      return 'POSITION_UNAVAILABLE';
    case error.TIMEOUT:
      return 'TIMEOUT';
    default:
      return 'UNKNOWN';
  }
}

export function getGeolocationErrorMessage(code: GeolocationErrorCode): string {
  switch (code) {
    case 'PERMISSION_DENIED':
      return 'Location permission was denied. You can select a nearby PHC manually.';
    case 'POSITION_UNAVAILABLE':
      return 'Unable to detect your GPS location. Please select a nearby PHC manually.';
    case 'TIMEOUT':
      return 'Location detection timed out. Showing nearest PHCs based on default region.';
    case 'OFFLINE':
      return 'You are offline. GPS coordinates will be saved locally.';
    default:
      return 'Unable to detect your location. Please select a nearby PHC manually.';
  }
}

export function requestCurrentPosition(timeoutMs = 8000): Promise<GeolocationResult> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject({ code: 'POSITION_UNAVAILABLE' as GeolocationErrorCode });
      return;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      reject({ code: 'OFFLINE' as GeolocationErrorCode });
      return;
    }

    // Try high accuracy first
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (_err1) => {
        // Fallback: try low accuracy (IP/Cell triangulation, works on Windows/macOS browsers)
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            });
          },
          (err2) => {
            reject({ code: mapGeolocationError(err2) });
          },
          {
            enableHighAccuracy: false,
            timeout: timeoutMs,
            maximumAge: 300000,
          }
        );
      },
      {
        enableHighAccuracy: true,
        timeout: Math.min(timeoutMs, 5000),
        maximumAge: 120000,
      }
    );
  });
}

export async function reverseGeocodeClient(
  latitude: number,
  longitude: number
): Promise<{ ok: true; data: import('./types').ReverseGeocodeResult } | { ok: false; error: string }> {
  try {
    const res = await fetch(
      `/api/geocode/reverse?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`
    );
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body.error || 'Reverse geocoding unavailable.' };
    }
    const data = await res.json();
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'Reverse geocoding unavailable.' };
  }
}

export async function searchLocationClient(
  query: string
): Promise<{ ok: true; results: Array<{ displayName: string; lat: number; lon: number; address: import('./types').ReverseGeocodeResult }> } | { ok: false; error: string }> {
  try {
    const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
      return { ok: false, error: 'Location search unavailable.' };
    }
    const data = await res.json();
    return { ok: true, results: data.results || [] };
  } catch {
    return { ok: false, error: 'Location search unavailable.' };
  }
}
