/* ==========================================================
   ESTADO GLOBAL DE LA APP
   Un único objeto mutable compartido entre módulos. Como los
   módulos ES importan una referencia al mismo objeto, mutar
   sus propiedades (state.cart.push(...)) se refleja en todos
   los archivos que lo importan, sin necesidad de getters/setters.
   ========================================================== */

export const state = {
  cart: [],                 // [{ menuItem, qty, restaurantId }]
  currentRestaurantId: null,
  userLocation: null,       // { lat, lng } | null
  distanceCache: {},        // { [restaurantId]: km }
  selectedCategory: 'all',

  // Estado del selector de mapa (Leaflet)
  mapInstance: null,
  mapMarker: null,
  tempSelectedCoords: null
};
