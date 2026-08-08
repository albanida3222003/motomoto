/* ==========================================================
   PROCESO DE CHECKOUT Y CONFIRMACIÓN DE PEDIDO
   El pedido se guarda en Firestore (colección "pedidos", el mismo
   backend que usa /admin) para que aparezca al instante en el
   panel del negocio y quede disponible para los drivers. Además
   se abre WhatsApp como aviso rápido, igual que antes.
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
    const textDetails = list.map(x => `${x.restaurant ? x.restaurant.name : 'Local'}: S/ ${(x.cost || 0).toFixed(2)}`).join(' + ');
    el.textContent = `Envíos (${list.length} locales): ${textDetails} = S/ ${totalShipping.toFixed(2)}`;
  }
  el.classList.add('show');
}

export async function confirmOrder() {
  const addr = document.getElementById('addrInput').value.trim();
  const name = document.getElementById('nameInput').value.trim();
  const phone = document.getElementById('phoneInput').value.trim();

  const nameOk = name.length > 0;
  const phoneOk = /^\d{9}$/.test(phone);

  document.getElementById('nameErr').style.display = !nameOk ? 'block' : 'none';
  document.getElementById('phoneErr').style.display = !phoneOk ? 'block' : 'none';

  if (!nameOk || !phoneOk) return;

  if (!state.userLocation) {
    const addrErr = document.getElementById('addrErr');
    addrErr.style.display = 'block';
    addrErr.textContent = '⚠️ Necesitamos tu ubicación para calcular el envío. Usa el mapa o el botón "Usar mi ubicación actual".';
    showToast('📍 Necesitamos tu ubicación GPS para calcular el envío');
    return;
  }
  document.getElementById('addrErr').style.display = 'none';

  const sub = cartSubtotal();
  const { list, totalShipping } = getShippingBreakdown();
  const total = sub + totalShipping;

  const btn = document.getElementById('checkoutConfirmBtn');
  btn.disabled = true;
  const originalLabel = btn.textContent;
  btn.textContent = 'Enviando...';

  let orderId = null;
  try {
    orderId = await guardarPedidoEnFirestore({ name, phone, addr, sub, totalShipping, total, list });
  } catch (err) {
    console.error('Error al guardar el pedido:', err);
    showToast('⚠️ No se pudo registrar el pedido, intenta de nuevo');
    btn.disabled = false;
    btn.textContent = originalLabel;
    return;
  }

  const msg = buildWhatsappMessage({ name, phone, addr, sub, totalShipping, total, orderId });
  const waUrl = `https://api.whatsapp.com/send?phone=${MY_WHATSAPP_PHONE}&text=${encodeURIComponent(msg)}`;
  window.open(waUrl, '_blank');

  btn.disabled = false;
  btn.textContent = originalLabel;
  closeCheckout();

  const uniqueRestIds = [...new Set(state.cart.map(item => item.restaurantId))];
  document.getElementById('ticket').innerHTML = `
    <div><b>N.° de pedido:</b> ${orderId ? orderId.slice(0, 8) : '—'}</div>
    <div><b>Locales pedidos:</b> ${uniqueRestIds.length}</div>
    <div><b>Cliente:</b> ${name}</div>
    <div><b>Total a pagar:</b> S/ ${total.toFixed(2)}</div>
    <p style="margin-top:10px; color:var(--leaf-dark); font-weight:bold;">¡Pedido registrado! Se ha abierto WhatsApp para confirmar la entrega.</p>`;
  document.getElementById('confirmModal').classList.add('open');
}

// Guarda el pedido en la misma colección/estructura que usa el panel admin
// (js/pedidos.js -> guardarPedido), para que aparezca en tiempo real ahí.
async function guardarPedidoEnFirestore({ name, phone, addr, sub, totalShipping, list }) {
  await motomotoAuthReady;

  const items = state.cart.map(c => ({
    localId: c.restaurantId,
    localNombre: restaurants.find(r => r.id === c.restaurantId)?.name || '',
    menuId: c.menuItem.id,
    nombre: c.menuItem.name,
    imagen: c.menuItem.img || null,
    cantidad: c.qty,
    precioUnitario: c.unitPrice,
    opciones: c.opciones || [],
    subtotalItem: Math.round(c.unitPrice * c.qty * 100) / 100
  }));

  const envioDetalle = list.map(x => ({
    localId: x.restaurant?.id,
    nombre: x.restaurant?.name || '',
    km: x.km != null ? Math.round(x.km * 100) / 100 : null,
    costo: x.cost || 0
  }));

  const docRef = await db.collection(COL.PEDIDOS).add({
    cliente: {
      nombre: name,
      telefono: phone,
      direccion: addr || '',
      lat: state.userLocation.lat,
      lng: state.userLocation.lng
    },
    items,
    localesIds: [...new Set(items.map(it => it.localId))],
    localesNombres: [...new Set(items.map(it => it.localNombre))],
    subtotal: Math.round(sub * 100) / 100,
    envio: Math.round(totalShipping * 100) / 100,
    envioDetalle,
    total: Math.round((sub + totalShipping) * 100) / 100,
    estado: 'pendiente',
    driverId: null,
    driverNombre: null,
    seguimiento: { llegadaLocal: null, recogioProducto: null, llegadaUbicacion: null, entregado: null },
    origen: 'web',
    creadoEn: firebase.firestore.FieldValue.serverTimestamp()
  });

  return docRef.id;
}

function buildWhatsappMessage({ name, phone, addr, sub, totalShipping, total, orderId }) {
  const uniqueRestIds = [...new Set(state.cart.map(item => item.restaurantId))];
  const listRestObjects = uniqueRestIds.map(id => restaurants.find(r => r.id === id)).filter(Boolean);

  let msg = `*¡NUEVO PEDIDO EN MOTO MOTO!* 🛵💨\n\n`;
  if (orderId) msg += `*N.° de pedido:* ${orderId.slice(0, 8)}\n\n`;

  msg += `👤 *DATOS DEL CLIENTE*\n`;
  msg += `• *Nombre:* ${name}\n`;
  msg += `• *Teléfono:* ${phone}\n`;
  msg += `• *Dirección / Ref:* ${addr || 'Indicada por GPS'}\n`;

  if (state.userLocation) {
    msg += `• *Ubicación Cliente (GPS):* https://maps.google.com/?q=${state.userLocation.lat},${state.userLocation.lng}\n`;
  }

  msg += `\n🛒 *DETALLE DEL PEDIDO Y LOCALES*\n`;

  uniqueRestIds.forEach((restId, idx) => {
    const r = restaurants.find(x => x.id === restId);
    if (!r) return;
    const shipCost = shippingFor(restId) || 0;

    msg += `\n📍 *RECOGIDA ${idx + 1}: ${r.name}*\n`;
    if (r.lat != null && r.lng != null) msg += `  • GPS Local: https://maps.google.com/?q=${r.lat},${r.lng}\n`;
    msg += `  • Teléfono: +${r.phone || 'N/A'}\n`;
    msg += `  • Envío local: S/ ${shipCost.toFixed(2)}\n`;
    msg += `  • Platos:\n`;

    const items = state.cart.filter(c => c.restaurantId === restId);
    items.forEach(c => {
      const opts = (c.opciones || []).map(o => `${o.grupo}: ${o.seleccion.join(', ')}`).join('; ');
      msg += `    - ${c.qty}x ${c.menuItem.name}${opts ? ` (${opts})` : ''} (S/ ${(c.unitPrice * c.qty).toFixed(2)})\n`;
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
