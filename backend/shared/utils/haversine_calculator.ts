interface LatLng {
  latitude: number;
  longitude: number;
}

// Radius of Earth in kilometers
const EARTH_RADIUS_KM = 6371;

export const calculateDistance = (coord1: LatLng, coord2: LatLng): number => {
  const toRadians = (deg: number) => deg * (Math.PI / 180);

  const lat1Rad = toRadians(coord1.latitude);
  const lon1Rad = toRadians(coord1.longitude);
  const lat2Rad = toRadians(coord2.latitude);
  const lon2Rad = toRadians(coord2.longitude);

  const deltaLat = lat2Rad - lat1Rad;
  const deltaLon = lon2Rad - lon1Rad;

  const a = 
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = EARTH_RADIUS_KM * c;
  return distance; // Distance in kilometers
};
