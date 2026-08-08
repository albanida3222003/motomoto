/* ==========================================================
   GEOLOCALIZACIÓN DEL USUARIO
   ========================================================== */
import { state } from './state.js';
import { recomputeAllDistances } from './distance.js';
import { renderRestaurants } from './render.js';
import { updateCartTotals } from './cart.js';
import { updateShippingPreview } from './checkout.js';
import { openMapPicker } from './map.js';

function setBanner(text, type) {
  const banner = document.getElementById('locBanner');
  const textEl = document.getElementById('locBannerText');
  const oldBtn = document.getElementById('locBannerBtn');
  if (!banner) return;

  banner.className = 'loc-banner' + (type ? ' ' + type : '');
  banner.style.display = 'flex';

  // Limpiamos el texto y creamos los botones con addEventListener
  // (en vez de HTML con onclick inline, más fácil de mantener).
  textEl.textContent = text + ' ';

  const actions = document.createElement('div');
  actions.style.cssText = 'margin-top:6px; display:flex; gap:8px; flex-wrap:wrap;';

  const retryBtn = document.createElement('button');
  retryBtn.style.cssText = 'background:var(--leaf-dark); color:white; border:none; padding:4px 10px; border-radius:6px; font-size:12px; cursor:pointer;';
  retryBtn.textContent = type === 'err' ? 'Reintentar GPS' : 'Actualizar GPS';
  retryBtn.addEventListener('click', () => requestLocation(true));

  const mapBtn = document.createElement('button');
  mapBtn.style.cssText = 'background:var(--clay); color:white; border:none; padding:4px 10px; border-radius:6px; font-size:12px; cursor:pointer;';
  mapBtn.textContent = 'Elegir en mapa 🗺️';
  mapBtn.addEventListener('click', () => openMapPicker());

  actions.appendChild(retryBtn);
  actions.appendChild(mapBtn);
  textEl.appendChild(actions);

  if (oldBtn) oldBtn.style.display = 'none';
}

export function requestLocation(userInitiated) {
  if (!('geolocation' in navigator)) {
    setBanner('Tu navegador no soporta geolocalización. Ingresa la dirección al hacer checkout.', 'err');
    return;
  }
  setBanner('Solicitando tu ubicación…', '');
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      state.userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      state.distanceCache = {};
      setBanner(`Ubicación detectada (±${Math.round(pos.coords.accuracy)} m). Envío calculado según tu distancia.`, 'ok');
      await recomputeAllDistances();
      renderRestaurants();
      updateCartTotals();
      updateShippingPreview();
    },
    (err) => {
      const msg = err.code === 1
        ? 'Permiso de ubicación denegado. Activa el GPS o ingresa tu dirección manualmente.'
        : 'No pudimos obtener tu ubicación. Toca "Reintentar" o ingresa tu dirección.';
      setBanner(msg, 'err');
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
  );
}

export { setBanner };
