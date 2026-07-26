/* ==========================================================
   SELECTOR DE UBICACIÓN EN MAPA INTERACTIVO (LEAFLET.JS)
   ========================================================== */
import { state } from './state.js';
import { PUCALLPA_CENTER } from './config.js';
import { recomputeAllDistances } from './distance.js';
import { renderRestaurants } from './render.js';
import { updateCartTotals } from './cart.js';
import { updateShippingPreview } from './checkout.js';
import { showToast } from './utils.js';
import { setBanner } from './geolocation.js';

export function openMapPicker() {
  const modal = document.getElementById('mapModal');
  if (!modal) return;
  modal.classList.add('open');

  // Retardo para asegurar que el contenedor del mapa ya existe en el DOM
  // antes de que Leaflet intente medirlo.
  setTimeout(() => {
    const initialLat = state.userLocation ? state.userLocation.lat : PUCALLPA_CENTER.lat;
    const initialLng = state.userLocation ? state.userLocation.lng : PUCALLPA_CENTER.lng;

    if (!state.mapInstance) {
      state.mapInstance = L.map('interactiveMap').setView([initialLat, initialLng], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(state.mapInstance);

      state.mapMarker = L.marker([initialLat, initialLng], { draggable: true }).addTo(state.mapInstance);

      state.mapMarker.on('dragend', function () {
        const pos = state.mapMarker.getLatLng();
        updateTempCoords(pos.lat, pos.lng);
      });

      state.mapInstance.on('click', function (e) {
        state.mapMarker.setLatLng(e.latlng);
        updateTempCoords(e.latlng.lat, e.latlng.lng);
      });
    } else {
      state.mapInstance.setView([initialLat, initialLng], 15);
      state.mapMarker.setLatLng([initialLat, initialLng]);
      state.mapInstance.invalidateSize();
    }

    updateTempCoords(initialLat, initialLng);
  }, 250);
}

function updateTempCoords(lat, lng) {
  state.tempSelectedCoords = { lat, lng };
  const txt = document.getElementById('selectedCoordsText');
  if (txt) {
    txt.textContent = `📍 Ubicación fijada: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

export function confirmMapLocation() {
  if (state.tempSelectedCoords) {
    state.userLocation = { ...state.tempSelectedCoords };
    state.distanceCache = {}; // Limpiar caché para recalcular los envíos

    setBanner('📍 Ubicación confirmada manualmente en el mapa.', 'ok');

    recomputeAllDistances().then(() => {
      renderRestaurants();
      updateCartTotals();
      updateShippingPreview();
    });

    showToast('📍 Ubicación guardada con éxito');
  }
  closeMapModal();
}

export function closeMapModal() {
  const modal = document.getElementById('mapModal');
  if (modal) modal.classList.remove('open');
}
