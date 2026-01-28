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