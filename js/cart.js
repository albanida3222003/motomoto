/* ==========================================================
   GESTIÓN DEL CARRITO (SOPORTA MULTI-RESTAURANTE)
   ========================================================== */
import { state } from './state.js';
import { restaurants } from './data.js';
import { shippingFor } from './distance.js';
import { showToast } from './utils.js';

export function addToCart(restId, menuId) {
  const r = restaurants.find(x => x.id === restId);
  const m = r.menu.find(x => x.id === menuId);
  const existing = state.cart.find(c => c.menuItem.id === menuId);
  if (existing) existing.qty++;
  else state.cart.push({ menuItem: m, qty: 1, restaurantId: restId });
  updateCartCount(true);
  updateCartTotals();
  showToast(`${m.name} agregado`);
}

export function updateCartCount(bump) {
  const n = state.cart.reduce((s, c) => s + c.qty, 0);
  const el = document.getElementById('cartCount');
  el.textContent = n;
  if (bump) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
}

export function cartSubtotal() {
  return state.cart.reduce((s, c) => s + c.menuItem.price * c.qty, 0);
}

// Calcula el desglose de envíos por restaurante (un pedido puede incluir
// platos de varios locales a la vez).
export function getShippingBreakdown() {
  if (state.cart.length === 0) return { list: [], totalShipping: 0 };

  const uniqueRestIds = [...new Set(state.cart.map(item => item.restaurantId))];
  let totalShipping = 0;
  const list = [];

  uniqueRestIds.forEach(restId => {
    const r = restaurants.find(x => x.id === restId);
    const shipCost = shippingFor(restId);
    const cost = shipCost == null ? 0 : shipCost;
    totalShipping += cost;
    list.push({ restaurant: r, cost: shipCost });
  });

  return { list, totalShipping };
}

export function updateCartTotals() {
  const sub = cartSubtotal();
  const { list, totalShipping } = getShippingBreakdown();

  document.getElementById('cartSubtotal').textContent = `S/ ${sub.toFixed(2)}`;

  const shipEl = document.getElementById('cartShipping');
  if (list.length === 0) {
    shipEl.textContent = 'S/ 0.00';
  } else if (list.some(item => item.cost == null)) {
    shipEl.textContent = 'Comparte tu ubicación';
  } else if (list.length === 1) {
    shipEl.textContent = `S/ ${totalShipping.toFixed(2)}`;
  } else {
    shipEl.textContent = `S/ ${totalShipping.toFixed(2)} (${list.length} locales)`;
  }

  const hasMissingLoc = list.some(item => item.cost == null);
  const total = sub + (hasMissingLoc ? 0 : totalShipping);

  document.getElementById('cartTotal').textContent = `S/ ${total.toFixed(2)}`;
  document.getElementById('checkoutBtn').disabled = state.cart.length === 0;
  renderCartBody();
}

function renderCartBody() {
  const body = document.getElementById('cartBody');
  if (state.cart.length === 0) {
    body.innerHTML = '<div class="empty-cart">Tu pedido está vacío</div>';
    return;
  }
  body.innerHTML = '';

  const uniqueRestIds = [...new Set(state.cart.map(item => item.restaurantId))];

  uniqueRestIds.forEach(restId => {
    const r = restaurants.find(x => x.id === restId);
    const ship = shippingFor(restId);

    const restHeader = document.createElement('div');
    restHeader.style.cssText = 'font-weight:bold; font-size:12px; color:#1b6329; margin:12px 0 6px 0; border-bottom:1px solid #eee; padding-bottom:4px; display:flex; justify-content:space-between;';
    restHeader.innerHTML = `
      <span>🏪 ${r.name}</span>
      <span>Delivery: ${ship != null ? 'S/ ' + ship.toFixed(2) : '—'}</span>
    `;
    body.appendChild(restHeader);

    const items = state.cart.filter(c => c.restaurantId === restId);
    items.forEach(c => {
      const realIndex = state.cart.indexOf(c);
      const row = document.createElement('div');
      row.className = 'cart-row';
      row.innerHTML = `
        <img src="${c.menuItem.img}">
        <div class="cart-row-info">
          <div class="cart-row-name">${c.menuItem.name}</div>
          <div class="cart-row-unit">S/ ${c.menuItem.price.toFixed(2)}</div>
        </div>
        <div class="cart-row-actions">
          <button class="qty-minus">−</button>
          <span>${c.qty}</span>
          <button class="qty-plus">+</button>
          <button class="remove-x">✕</button>
        </div>`;
      row.querySelector('.qty-minus').addEventListener('click', () => changeQty(realIndex, -1));
      row.querySelector('.qty-plus').addEventListener('click', () => changeQty(realIndex, 1));
      row.querySelector('.remove-x').addEventListener('click', () => removeItem(realIndex));
      body.appendChild(row);
    });
  });
}

export function changeQty(i, d) {
  state.cart[i].qty += d;
  if (state.cart[i].qty <= 0) state.cart.splice(i, 1);
  updateCartCount();
  updateCartTotals();
}

export function removeItem(i) {
  state.cart.splice(i, 1);
  updateCartCount();
  updateCartTotals();
}

export function openCart() {
  document.getElementById('overlay').classList.add('open');
  document.getElementById('drawer').classList.add('open');
}

export function closeCart() {
  document.getElementById('overlay').classList.remove('open');
  document.getElementById('drawer').classList.remove('open');
}
