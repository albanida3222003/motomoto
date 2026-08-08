/* ==========================================================
   CONFIGURACIÓN GENERAL DE LA APP
   Todo lo que cambia entre entornos (precios de envío, claves
   de API, número de WhatsApp) vive aquí para editarse fácil.
   ========================================================== */

// Costo de envío: igual para todos los locales (estilo original de
// motomoto). Se calcula como base + perKm×distancia, redondeado al
// 0.50 más cercano, con un mínimo garantizado.
export const SHIPPING = {
  base: 2.0,   // S/ fijo
  perKm: 2.0,  // S/ por km
  min: 5.0     // mínimo
};

// 'haversine' (línea recta) o 'road' (distancia real, requiere API key)
export const DISTANCE_MODE = 'haversine';
export const GOOGLE_MAPS_API_KEY = '';

// Número de WhatsApp del negocio (con código de país, sin '+').
// Se usa solo como notificación extra: el pedido real se guarda en
// Firestore (colección "pedidos") y aparece al instante en /admin.
export const MY_WHATSAPP_PHONE = '51982780329';

// Centro de Pucallpa por defecto si no hay GPS activo
export const PUCALLPA_CENTER = { lat: -8.3791, lng: -74.5539 };
