'use client';

import { useState, useCallback } from 'react';

export type GpsResult = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

export type GpsError = {
  code: number;
  message: string;
};

function getErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case GeolocationPositionError.PERMISSION_DENIED:
      return 'Location permission denied. Please allow location access to update job status.';
    case GeolocationPositionError.POSITION_UNAVAILABLE:
      return 'Location unavailable. Please check your device settings.';
    case GeolocationPositionError.TIMEOUT:
      return 'Location request timed out. Please try again.';
    default:
      return error.message || 'Failed to get location.';
  }
}

export function useGeolocation() {
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<GpsError | null>(null);

  const capturePosition = useCallback((): Promise<GpsResult> => {
    return new Promise<GpsResult>((resolve, reject) => {
      if (!navigator.geolocation) {
        const err: GpsError = {
          code: -1,
          message: 'Geolocation not supported by this browser',
        };
        setError(err);
        reject(err);
        return;
      }

      setCapturing(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCapturing(false);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (positionError) => {
          const message = getErrorMessage(positionError);
          const err: GpsError = { code: positionError.code, message };
          setCapturing(false);
          setError(err);
          reject(err);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000,
        }
      );
    });
  }, []);

  return { capturing, error, capturePosition };
}
