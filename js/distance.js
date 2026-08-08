/* ==========================================================
   CÁLCULO DE DISTANCIAS Y COSTO DE ENVÍO
   Vuelve al estilo original de motomoto: una sola tarifa de envío
   (SHIPPING en config.js) para todos los locales, redondeada al
   0.50 más cercano y con un mínimo garantizado — en vez de la
   tarifa por-local (envioBase/envioPorKm) del panel admin.
   ========================================================== */
import { SHIPPING, DISTANCE_MODE, GOOGLE_MAPS_API_KEY } from './config.js';
import { restaurants } from './data.js';
import { state } from './state.js';
import { roundToHalf } from './utils.js';

export function haversineKm(a, b) {
  const toRad = d => d * Math.PI / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) *
            Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

async function roadDistanceKm(a, b) {
  if (!GOOGLE_MAPS_API_KEY) throw new Error('Falta GOOGLE_MAPS_API_KEY');
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json` +
              `?origins=${a.lat},${a.lng}&destinations=${b.lat},${b.lng}` +
              `&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  const meters = data?.rows?.[0]?.elements?.[0]?.distance?.value;
  if (typeof meters !== 'number') throw new Error('Sin ruta');
  return meters / 1000;
}

export async function distanceKm(from, to) {
  if (DISTANCE_MODE === 'road' && GOOGLE_MAPS_API_KEY) {
    try { return await roadDistanceKm(from, to); }
    catch (e) { console.warn('Fallback a haversine:', e); return haversineKm(from, to); }
  }
  return haversineKm(from, to);
}

export async function recomputeAllDistances() {
  if (!state.userLocation) return;
  for (const r of restaurants) {
    if (r.lat == null || r.lng == null) continue;
    state.distanceCache[r.id] = await distanceKm(state.userLocation, { lat: r.lat, lng: r.lng });
  }
}

export function shippingFor(restaurantId) {
  const km = state.distanceCache[restaurantId];
  if (km == null) return null;
  const cost = SHIPPING.base + SHIPPING.perKm * km;
  const roundedCost = roundToHalf(cost);
  return Math.max(roundedCost, SHIPPING.min);
}
