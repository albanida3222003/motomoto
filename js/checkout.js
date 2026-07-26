/* ==========================================================
   PROCESO DE CHECKOUT Y CONFIRMACIÓN DE PEDIDO (VÍA WHATSAPP)
   ========================================================== */
import { state } from './state.js';
import { restaurants } from './data.js';
import { MY_WHATSAPP_PHONE } from './config.js';
import { shippingFor } from './distance.js';
import { cartSubtotal, getShippingBreakdown, updateCartCount, updateCartTotals, closeCart } from './cart.js';
import { showToast } from './utils.js';
import { openMapPicker } from './map.js';
import { showRestaurants } from './render.js';

export function openCheckout() {
  if (state.cart.length === 0) return;

  if (!state.userLocation) {
    showToast('📍 Por favor, selecciona tu ubicación en el mapa primero');
    openMapPicker();
    return;
  }

  closeCart();

  const sub = cartSubtotal();
  const { totalShipping } = getShippingBreakdown();

  document.getElementById('mSubtotal').textContent = `S/ ${sub.toFixed(2)}`;
  document.getElementById('mShipping').textContent = `S/ ${totalShipping.toFixed(2)}`;
  document.getElementById('mTotal').textContent = `S/ ${(sub + totalShipping).toFixed(2)}`;

  updateShippingPreview();
  document.getElementById('checkoutModal').classList.add('open');
}

export function closeCheckout() {
  document.getElementById('checkoutModal').classList.remove('open');
}

export function updateShippingPreview() {
  const el = document.getElementById('shippingPreview');
  const { list, totalShipping } = getShippingBreakdown();
  if (state.cart.length === 0) { el.classList.remove('show'); return; }

  if (list.length === 1) {
    el.textContent = `Costo de envío: S/ ${totalShipping.toFixed(2)}`;
  } else {
    const textDetails = list.map(x => `${x.restaurant.name}: S/ ${(x.cost || 0).toFixed(2)}`).join(' + ');
    el.textContent = `Envíos (${list.length} locales): ${textDetails} = S/ ${totalShipping.toFixed(2)}`;
  }
  el.classList.add('show');
}

export function confirmOrder() {
  const addr = document.getElementById('addrInput').value.trim();
  const name = document.getElementById('nameInput').value.trim();
  const phone = document.getElementById('phoneInput').value.trim();

  const nameOk = name.length > 0;
  const phoneOk = /^\d{9}$/.test(phone);

  document.getElementById('nameErr').style.display = !nameOk ? 'block' : 'none';
  document.getElementById('phoneErr').style.display = !phoneOk ? 'block' : 'none';

  if (!nameOk || !phoneOk) return;

  // Validación amigable de ubicación/GPS
  if (!state.userLocation) {
    if (!addr || addr.length < 5) {
      const addrErr = document.getElementById('addrErr');
      addrErr.style.display = 'block';
      addrErr.textContent = '⚠️ Por favor, presiona "Obtener Ubicación" arriba o escribe tu dirección exacta con referencias.';
      showToast('📍 Necesitamos tu ubicación GPS para calcular el envío');
      document.getElementById('addrInput').focus();
      return;
    }
  }

  document.getElementById('addrErr').style.display = 'none';

  const sub = cartSubtotal();
  const { totalShipping } = getShippingBreakdown();
  const total = sub + totalShipping;

  const msg = buildWhatsappMessage({ name, phone, addr, sub, totalShipping, total });

  const waUrl = `https://api.whatsapp.com/send?phone=${MY_WHATSAPP_PHONE}&text=${encodeURIComponent(msg)}`;
  window.open(waUrl, '_blank');

  closeCheckout();

  const uniqueRestIds = [...new Set(state.cart.map(item => item.restaurantId))];
  document.getElementById('ticket').innerHTML = `
    <div><b>Locales pedidos:</b> ${uniqueRestIds.length}</div>
    <div><b>Cliente:</b> ${name}</div>
    <div><b>Total a pagar:</b> S/ ${total.toFixed(2)}</div>
    <p style="margin-top:10px; color:#1b6329; font-weight:bold;">¡Se ha abierto WhatsApp para enviar tu pedido!</p>`;
  document.getElementById('confirmModal').classList.add('open');
}

function buildWhatsappMessage({ name, phone, addr, sub, totalShipping, total }) {
  const uniqueRestIds = [...new Set(state.cart.map(item => item.restaurantId))];
  const listRestObjects = uniqueRestIds.map(id => restaurants.find(r => r.id === id));

  let msg = `*¡NUEVO PEDIDO EN SABORPUCALLPA!* 🛵💨\n\n`;

  msg += `👤 *DATOS DEL CLIENTE*\n`;
  msg += `• *Nombre:* ${name}\n`;
  msg += `• *Teléfono:* ${phone}\n`;
  msg += `• *Dirección / Ref:* ${addr || 'Indicada por GPS'}\n`;

  if (state.userLocation) {
    msg += `• *Ubicación Cliente (GPS):* https://maps.google.com/?q=${state.userLocation.lat},${state.userLocation.lng}\n`;
  } else {
    msg += `• *Ubicación GPS:* _No compartida (Ver dirección escrita arriba)_\n`;
  }

  msg += `\n🛒 *DETALLE DEL PEDIDO Y LOCALES*\n`;

  uniqueRestIds.forEach((restId, idx) => {
    const r = restaurants.find(x => x.id === restId);
    const shipCost = shippingFor(restId) || 0;

    msg += `\n📍 *RECOGIDA ${idx + 1}: ${r.name}*\n`;
    msg += `  • GPS Local: https://maps.google.com/?q=${r.lat},${r.lng}\n`;
    msg += `  • Teléfono: +${r.phone || 'N/A'}\n`;
    msg += `  • Envío local: S/ ${shipCost.toFixed(2)}\n`;
    msg += `  • Platos:\n`;

    const items = state.cart.filter(c => c.restaurantId === restId);
    items.forEach(c => {
      msg += `    - ${c.qty}x ${c.menuItem.name} (S/ ${(c.menuItem.price * c.qty).toFixed(2)})\n`;
    });
  });

  if (state.userLocation && listRestObjects.length > 0) {
    msg += `\n🗺️ *RUTA EN MAPA PARA EL DRIVER*\n`;
    const points = listRestObjects.map(r => `${r.lat},${r.lng}`);
    points.push(`${state.userLocation.lat},${state.userLocation.lng}`);
    const routeUrl = `https://www.google.com/maps/dir/${points.join('/')}`;
    msg += `• *Abrir Ruta en Google Maps:*\n${routeUrl}\n`;
  }

  msg += `\n💵 *RESUMEN TOTAL DE PAGO*\n`;
  msg += `• *Subtotal Platos:* S/ ${sub.toFixed(2)}\n`;
  if (uniqueRestIds.length > 1) {
    msg += `• *Total Envíos (${uniqueRestIds.length} locales):* S/ ${totalShipping.toFixed(2)}\n`;
  } else {
    msg += `• *Costo de Envío:* S/ ${totalShipping.toFixed(2)}\n`;
  }
  msg += `• *TOTAL A PAGAR:* S/ ${total.toFixed(2)}\n\n`;
  msg += `_Método: Pago contra entrega_`;

  return msg;
}

export function finishOrder() {
  state.cart = [];
  updateCartCount();
  updateCartTotals();
  document.getElementById('confirmModal').classList.remove('open');
  showRestaurants();
}
