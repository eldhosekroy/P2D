import { calculateDistance } from './haversine_calculator';
import { logger } from './logger';

const MAX_SPEED_KMH = 200; // Maximum allowed speed in km/h for GPS spoof detection

interface LocationData {
  lat: number;
  lng: number;
  timestamp: number; // Unix timestamp in milliseconds
}

export const validateGpsUpdate = (lastLocation: LocationData | null, newLocation: LocationData): {
  isSpoof: boolean;
  speedKmH?: number;
  distanceKm?: number;
} => {
  if (!lastLocation) {
    // No previous location to compare with, assume no spoofing for the first update
    return { isSpoof: false };
  }

  const distanceKm = calculateDistance(
    { latitude: lastLocation.lat, longitude: lastLocation.lng },
    { latitude: newLocation.lat, longitude: newLocation.lng }
  );

  const timeElapsedSeconds = (newLocation.timestamp - lastLocation.timestamp) / 1000;

  if (timeElapsedSeconds <= 0) {
    // Invalid time elapsed, or same timestamp, cannot calculate speed meaningfully.
    // Treat as non-spoof for now, but log a warning.
    logger.warn('Invalid or zero time elapsed for GPS update', { lastLocation, newLocation });
    return { isSpoof: false, distanceKm };
  }

  // Calculate speed in km/h
  const speedKmH = (distanceKm / timeElapsedSeconds) * 3600; // (km / s) * (3600 s / h)

  if (speedKmH > MAX_SPEED_KMH) {
    logger.warn('GPS spoofing detected', { driverId: 'unknown', speedKmH, distanceKm, timeElapsedSeconds });
    return { isSpoof: true, speedKmH, distanceKm };
  }

  return { isSpoof: false, speedKmH, distanceKm };
};
