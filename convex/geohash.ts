// Geohash Base32 alphabet
const B32 = "0123456789bcdefghjkmnpqrstuvwxyz";

export function encodeGeohash(lat: number, lng: number, precision: number): string {
  let minLat = -90, maxLat = 90;
  let minLng = -180, maxLng = 180;
  let hash = "";
  let bit = 0, ch = 0, even = true;

  while (hash.length < precision) {
    if (even) {
      let mid = (minLng + maxLng) / 2;
      if (lng > mid) { ch |= 1 << (4 - bit); minLng = mid; }
      else maxLng = mid;
    } else {
      let mid = (minLat + maxLat) / 2;
      if (lat > mid) { ch |= 1 << (4 - bit); minLat = mid; }
      else maxLat = mid;
    }
    even = !even;
    if (bit < 4) bit++;
    else {
      hash += B32[ch];
      bit = 0; ch = 0;
    }
  }
  return hash;
}

/**
 * Get all neighboring geohashes for a given geohash
 * Returns 8 neighbors (N, NE, E, SE, S, SW, W, NW) + center
 */
export function getGeohashNeighbors(geohash: string): string[] {
  const neighbors = new Set<string>();
  neighbors.add(geohash); // Include center
  
  const precision = geohash.length;
  
  // Decode the geohash to get lat/lng bounds
  const { lat: [minLat, maxLat], lng: [minLng, maxLng] } = decodeGeohash(geohash);
  
  // Calculate the step size for this precision
  const latStep = (maxLat - minLat);
  const lngStep = (maxLng - minLng);
  
  // Generate neighbor centers
  for (let latOffset = -1; latOffset <= 1; latOffset++) {
    for (let lngOffset = -1; lngOffset <= 1; lngOffset++) {
      if (latOffset === 0 && lngOffset === 0) continue; // Skip center
      
      const neighborLat = minLat + latStep * 0.5 + latStep * latOffset;
      const neighborLng = minLng + lngStep * 0.5 + lngStep * lngOffset;
      
      // Handle longitude wraparound
      const wrappedLng = ((neighborLng + 180) % 360 + 360) % 360 - 180;
      
      // Handle latitude bounds
      const wrappedLat = Math.max(-90, Math.min(90, neighborLat));
      
      neighbors.add(encodeGeohash(wrappedLat, wrappedLng, precision));
    }
  }
  
  return Array.from(neighbors);
}

/**
 * Decode geohash to get lat/lng bounds
 */
function decodeGeohash(geohash: string): { lat: [number, number], lng: [number, number] } {
  let minLat = -90, maxLat = 90;
  let minLng = -180, maxLng = 180;
  let even = true;

  for (let i = 0; i < geohash.length; i++) {
    const c = geohash[i];
    const cd = B32.indexOf(c);
    
    for (let j = 0; j < 5; j++) {
      const mask = 16 >> j; // 16, 8, 4, 2, 1
      if (even) {
        const mid = (minLng + maxLng) / 2;
        if (cd & mask) {
          minLng = mid;
        } else {
          maxLng = mid;
        }
      } else {
        const mid = (minLat + maxLat) / 2;
        if (cd & mask) {
          minLat = mid;
        } else {
          maxLat = mid;
        }
      }
      even = !even;
    }
  }

  return {
    lat: [minLat, maxLat],
    lng: [minLng, maxLng]
  };
}