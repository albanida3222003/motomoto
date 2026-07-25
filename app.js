/* ==========================================================
   CONFIGURACIÓN
   ========================================================== */
const SHIPPING = {
  base: 2.0,   // S/ fijo
  perKm: 2.0,  // S/ por km
  min: 5.0     // mínimo
};

const DISTANCE_MODE = 'haversine'; // 'haversine' o 'road'
const GOOGLE_MAPS_API_KEY = '';

// Configuración de tu número de WhatsApp
const MY_WHATSAPP_PHONE = '51982780329'; 

/* ==========================================================
   NUEVO: CATEGORÍAS Y ESTADO DE FILTRADO
   ========================================================== */
const categories = [
  { id: 'all', name: 'Todos', icon: '🍽️' },
  { id: 'amazonica', name: 'Amazónica', icon: '🍃' },
  { id: 'marino', name: 'Marinos', icon: '🐙' },
  { id: 'broster', name: 'Broster', icon: '🍗' },
  { id: 'polleria', name: 'Pollería', icon: '🐔' },
  { id: 'bebidas', name: 'Bebidas', icon: '🧃' }
];

let selectedCategory = 'all';

// Banners de Promociones (imágenes publicitarias)
const promotions = [
  {
    id: 'p1',
    img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600', // Reemplazarás con tus URLs de promos
    restaurantId: 'r1'
  },
  {
    id: 'p2',
    img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600',
    restaurantId: 'r2'
  }
];

/* ==========================================================
   SIMULACIÓN DE BASE DE DATOS (CON CATEGORÍAS)
   ========================================================== */
const restaurants = [
  {
    id: 'r1',
    name: 'El Aguajal',
    category: 'amazonica', // 👈 Categoría asignada
    desc: 'Cocina amazónica tradicional',
    phone: '51987654321',
    rating: 4.8,
    time: '25-35 min',
    img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600',
    lat: -8.3791,
    lng: -74.5539,
    menu: [
      { id: 'm1', name: 'Juane de gallina', desc: 'Arroz con gallina envuelto en hoja de bijao', price: 18, img: 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=300' },
      { id: 'm2', name: 'Tacacho con cecina', desc: 'Plátano asado con cecina ahumada', price: 22, img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300' },
      { id: 'm3', name: 'Inchicapi', desc: 'Sopa espesa de gallina con maní', price: 15, img: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=300' }
    ]
  },
  {
    id: 'r2',
    name: 'Chifa Amazónico',
    category: 'amazonica',
    desc: 'Fusión oriental y selvática',
    phone: '51987654321',
    rating: 4.6,
    time: '30-40 min',
    img: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600',
    lat: -8.3850,
    lng: -74.5480,
    menu: [
      { id: 'm4', name: 'Arroz chaufa de paiche', desc: 'Chaufa con pescado amazónico', price: 20, img: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300' },
      { id: 'm5', name: 'Wantán frito', desc: '8 unidades con salsa agridulce', price: 14, img: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=300' }
    ]
  },
  {
    id: 'r3',
    name: 'Parrilla del Ucayali',
    category: 'broster',
    desc: 'Carnes y anticuchos a la brasa',
    phone: '51987654321',
    rating: 4.7,
    time: '35-45 min',
    img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600',
    lat: -8.3720,
    lng: -74.5600,
    menu: [
      { id: 'm6', name: 'Anticucho de corazón', desc: '3 palitos con papa y choclo', price: 16, img: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=300' },
      { id: 'm7', name: 'Parrilla mixta', desc: 'Res, pollo y chorizo para 2', price: 45, img: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=300' }
    ]
  },
  {
    id: 'r4',
    name: 'Jugos y Frutas del Río',
    category: 'bebidas',
    desc: 'Jugos naturales de la selva',
    phone: '51987654321',
    rating: 4.9,
    time: '15-25 min',
    img: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=600',
    lat: -8.3810,
    lng: -74.5510,
    menu: [
      { id: 'm8', name: 'Jugo de camu camu', desc: 'Vaso grande 500ml', price: 8, img: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=300' },
      { id: 'm9', name: 'Refresco de aguaje', desc: 'Vaso grande 500ml', price: 7, img: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=300' }
    ]
  }
];

/* ==========================================================
   ESTADO GLOBAL
   ========================================================== */
let cart = []; 
let currentRestaurantId = null;
let userLocation = null; 
let distanceCache = {}; 

/* ==========================================================
   GEOLOCALIZACIÓN
   ========================================================== */
function setBanner(text, type) {
  const b = document.getElementById('locBanner');
  const t = document.getElementById('locBannerText');
  const btn = document.getElementById('locBannerBtn');
  if(!b) return;
  b.className = 'loc-banner' + (type ? ' ' + type : '');
  t.textContent = text;
  btn.style.display = type === 'ok' ? 'none' : 'inline-block';
  btn.textContent = type === 'err' ? 'Reintentar' : 'Actualizar';
  b.style.display = 'flex';
}

function requestLocation(userInitiated) {
  if (!('geolocation' in navigator)) {
    setBanner('Tu navegador no soporta geolocalización. Ingresa la dirección al hacer checkout.', 'err');
    return;
  }
  setBanner('Solicitando tu ubicación…', '');
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      distanceCache = {};
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

/* ==========================================================
   CÁLCULO DE DISTANCIAS
   ========================================================== */
function haversineKm(a, b) {
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

async function distanceKm(from, to) {
  if (DISTANCE_MODE === 'road' && GOOGLE_MAPS_API_KEY) {
    try { return await roadDistanceKm(from, to); }
    catch (e) { console.warn('Fallback a haversine:', e); return haversineKm(from, to); }
  }
  return haversineKm(from, to);
}

async function recomputeAllDistances() {
  if (!userLocation) return;
  for (const r of restaurants) {
    distanceCache[r.id] = await distanceKm(userLocation, { lat: r.lat, lng: r.lng });
  }
}

function shippingFor(restaurantId) {
  const km = distanceCache[restaurantId];
  if (km == null) return null;
  const cost = SHIPPING.base + SHIPPING.perKm * km;
  return Math.max(cost, SHIPPING.min);
}

/* ==========================================================
   NUEVO: DIBUJAR Y FILTRAR CATEGORÍAS
   ========================================================== */
function renderCategories() {
  const container = document.getElementById('categoriesContainer');
  if (!container) return;
  container.innerHTML = '';
  
  categories.forEach(cat => {
    const item = document.createElement('div');
    item.className = `cat-item ${cat.id === selectedCategory ? 'active' : ''}`;
    item.onclick = () => filterByCategory(cat.id);
    item.innerHTML = `
      <div class="cat-icon-box">${cat.icon}</div>
      <div class="cat-label">${cat.name}</div>
    `;
    container.appendChild(item);
  });
}

function renderPromotions() {
  const container = document.getElementById('promosCarousel');
  if (!container) return;
  container.innerHTML = '';

  promotions.forEach(p => {
    const card = document.createElement('div');
    card.className = 'promo-card';
    card.onclick = () => {
      if(p.restaurantId) openMenu(p.restaurantId);
    };
    card.innerHTML = `<img src="${p.img}" alt="Promoción">`;
    container.appendChild(card);
  });
}

// Función para desplazar el carrusel con las flechas < y >
function scrollPromos(direction) {
  const container = document.getElementById('promosCarousel');
  if (!container) return;
  const scrollAmount = 300; // Distancia del desplazamiento
  container.scrollBy({
    left: direction * scrollAmount,
    behavior: 'smooth'
  });
}

function filterByCategory(catId) {
  selectedCategory = catId;
  renderCategories();
  renderRestaurants();
}

/* ==========================================================
   RENDERIZADO DE COMPONENTES
   ========================================================== */
function renderRestaurants() {
  const q = (document.getElementById('searchInput').value || '').toLowerCase().trim();
  const grid = document.getElementById('restaurantsGrid');
  grid.innerHTML = '';

  const filtered = restaurants.filter(r => {
    // 1. Filtrado por categoría
    const matchCategory = (selectedCategory === 'all' || r.category === selectedCategory);
    
    // 2. Coincidencia en datos del restaurante (nombre o descripción)
    const matchRest = r.name.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q);

    // 3. NUEVO: Coincidencia en alguno de los platillos del menú (nombre o descripción)
    const matchMenu = r.menu.some(m => 
      m.name.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q)
    );

    // Si coincide el restaurante O coincide algún plato de su menú, se muestra
    const matchQuery = !q || matchRest || matchMenu;

    return matchCategory && matchQuery;
  });

  if (filtered.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:30px; color:#8a7256;">No se encontraron restaurantes o platillos que coincidan.</div>';
    return;
  }

  filtered.forEach(r => {
    const km = distanceCache[r.id];
    const ship = shippingFor(r.id);
    const card = document.createElement('div');
    card.className = 'rest-card';
    card.onclick = () => openMenu(r.id);
    card.innerHTML = `
      <div class="rest-img" style="background-image:url('${r.img}')"></div>
      <div class="rest-body">
        <div class="rest-top">
          <div class="rest-title">${r.name}</div>
          <div class="rest-rating">★ ${r.rating}</div>
        </div>
        <div class="rest-desc">${r.desc}</div>
        <div class="rest-meta">
          <span>⏱ ${r.time}</span>
          ${km != null ? `<span class="rest-dist">📍 ${km.toFixed(1)} km</span>` : `<span>📍 —</span>`}
          ${ship != null ? `<span class="rest-ship">🛵 S/ ${ship.toFixed(2)}</span>` : ''}
        </div>
      </div>`;
    grid.appendChild(card);
  });
}

function openMenu(id) {
  // Dentro de openMenu(id):
  const servSec = document.querySelector('.services-section');
  const promoSec = document.querySelector('.promos-section');
  if(servSec) servSec.style.display = 'none';
  if(promoSec) promoSec.style.display = 'none';

  currentRestaurantId = id;
  const r = restaurants.find(x => x.id === id);
  document.getElementById('restaurantsSection').style.display = 'none';
  const catSec = document.querySelector('.categories-section');
  if(catSec) catSec.style.display = 'none';
  
  document.getElementById('menuSection').style.display = 'block';
  document.getElementById('menuTitle').textContent = r.name;
  const list = document.getElementById('menuList');
  list.innerHTML = '';
  r.menu.forEach(m => {
    const el = document.createElement('div');
    el.className = 'menu-item';
    el.innerHTML = `
      <img src="${m.img}" alt="${m.name}">
      <div class="menu-item-info">
        <div class="menu-item-name">${m.name}</div>
        <div class="menu-item-desc">${m.desc}</div>
        <div class="menu-item-price">S/ ${m.price.toFixed(2)}</div>
      </div>
      <button class="add-btn" onclick="addToCart('${r.id}','${m.id}')">Agregar</button>`;
    list.appendChild(el);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showRestaurants() {
  // Dentro de showRestaurants():
  const servSec = document.querySelector('.services-section');
  const promoSec = document.querySelector('.promos-section');
  if(servSec) servSec.style.display = 'block';
  if(promoSec) promoSec.style.display = 'block';
  
  document.getElementById('menuSection').style.display = 'none';
  const catSec = document.querySelector('.categories-section');
  if(catSec) catSec.style.display = 'block';
  document.getElementById('restaurantsSection').style.display = 'block';
}

/* ==========================================================
   GESTIÓN DEL CARRITO
   ========================================================== */
function addToCart(restId, menuId) {
  const r = restaurants.find(x => x.id === restId);
  const m = r.menu.find(x => x.id === menuId);
  const existing = cart.find(c => c.menuItem.id === menuId);
  if (existing) existing.qty++;
  else cart.push({ menuItem: m, qty: 1, restaurantId: restId });
  updateCartCount(true);
  updateCartTotals();
  showToast(`${m.name} agregado`);
}

function updateCartCount(bump) {
  const n = cart.reduce((s, c) => s + c.qty, 0);
  const el = document.getElementById('cartCount');
  el.textContent = n;
  if (bump) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
}

function cartSubtotal() { return cart.reduce((s, c) => s + c.menuItem.price * c.qty, 0); }

function currentShipping() {
  if (cart.length === 0) return 0;
  const restId = cart[0].restaurantId;
  const s = shippingFor(restId);
  return s == null ? null : s;
}

function updateCartTotals() {
  const sub = cartSubtotal();
  const ship = currentShipping();
  document.getElementById('cartSubtotal').textContent = `S/ ${sub.toFixed(2)}`;
  document.getElementById('cartShipping').textContent =
    ship == null ? 'Comparte tu ubicación' : `S/ ${ship.toFixed(2)}`;
  document.getElementById('cartTotal').textContent =
    `S/ ${(sub + (ship || 0)).toFixed(2)}`;
  document.getElementById('checkoutBtn').disabled = cart.length === 0;
  renderCartBody();
}

function renderCartBody() {
  const body = document.getElementById('cartBody');
  if (cart.length === 0) {
    body.innerHTML = '<div class="empty-cart">Tu pedido está vacío</div>';
    return;
  }
  body.innerHTML = '';
  cart.forEach((c, i) => {
    const row = document.createElement('div');
    row.className = 'cart-row';
    row.innerHTML = `
      <img src="${c.menuItem.img}">
      <div class="cart-row-info">
        <div class="cart-row-name">${c.menuItem.name}</div>
        <div class="cart-row-unit">S/ ${c.menuItem.price.toFixed(2)}</div>
      </div>
      <div class="cart-row-actions">
        <button onclick="changeQty(${i},-1)">−</button>
        <span>${c.qty}</span>
        <button onclick="changeQty(${i},1)">+</button>
        <button class="remove-x" onclick="removeItem(${i})">✕</button>
      </div>`;
    body.appendChild(row);
  });
}

function changeQty(i, d) {
  cart[i].qty += d;
  if (cart[i].qty <= 0) cart.splice(i, 1);
  updateCartCount(); updateCartTotals();
}

function removeItem(i) { cart.splice(i, 1); updateCartCount(); updateCartTotals(); }
function openCart() { document.getElementById('overlay').classList.add('open'); document.getElementById('drawer').classList.add('open'); }
function closeCart() { document.getElementById('overlay').classList.remove('open'); document.getElementById('drawer').classList.remove('open'); }

/* ==========================================================
   PROCESO DE CHECKOUT Y CONFIRMACIÓN
   ========================================================== */
function openCheckout() {
  if (cart.length === 0) return;
  closeCart();
  updateShippingPreview();
  document.getElementById('mSubtotal').textContent = `S/ ${cartSubtotal().toFixed(2)}`;
  const ship = currentShipping() || 0;
  document.getElementById('mShipping').textContent = `S/ ${ship.toFixed(2)}`;
  document.getElementById('mTotal').textContent = `S/ ${(cartSubtotal() + ship).toFixed(2)}`;
  document.getElementById('checkoutModal').classList.add('open');
}

function closeCheckout() { document.getElementById('checkoutModal').classList.remove('open'); }

function updateShippingPreview() {
  const el = document.getElementById('shippingPreview');
  const ship = currentShipping();
  if (cart.length === 0 || ship == null) { el.classList.remove('show'); return; }
  el.textContent = `Costo de envío: S/ ${ship.toFixed(2)}`;
  el.classList.add('show');
}

function confirmOrder() {
  const addr = document.getElementById('addrInput').value.trim();
  const name = document.getElementById('nameInput').value.trim();
  const phone = document.getElementById('phoneInput').value.trim();
  
  document.getElementById('addrErr').style.display = (!addr && !userLocation) ? 'block' : 'none';
  document.getElementById('nameErr').style.display = !name ? 'block' : 'none';
  const phoneOk = /^\d{9}$/.test(phone);
  document.getElementById('phoneErr').style.display = !phoneOk ? 'block' : 'none';
  
  if ((!addr && !userLocation) || !name || !phoneOk) return;

  const sub = cartSubtotal();
  const ship = currentShipping() || 0;
  const total = sub + ship;
  const r = restaurants.find(x => x.id === cart[0].restaurantId);

  let itemsText = '';
  cart.forEach(c => {
    itemsText += `  • ${c.qty}x ${c.menuItem.name} (S/ ${(c.menuItem.price * c.qty).toFixed(2)})\n`;
  });

  let msg = `*¡NUEVO PEDIDO EN SABORPUCALLPA!* 🛵💨\n\n`;
  
  msg += `🏪 *DATOS DEL RESTAURANTE*\n`;
  msg += `• *Nombre:* ${r.name}\n`;
  msg += `• *Teléfono:* +${r.phone || 'No especificado'}\n`;
  msg += `• *Ubicación Local:* https://maps.google.com/?q=${r.lat},${r.lng}\n\n`;

  msg += `👤 *DATOS DEL CLIENTE*\n`;
  msg += `• *Nombre:* ${name}\n`;
  msg += `• *Teléfono:* ${phone}\n`;
  msg += `• *Dirección:* ${addr || 'Indicada por GPS'}\n`;

  if (userLocation) {
    const routeUrl = `https://www.google.com/maps/dir/?api=1&origin=${r.lat},${r.lng}&destination=${userLocation.lat},${userLocation.lng}&travelmode=driving`;
    msg += `• *Ubicación Cliente:* https://maps.google.com/?q=${userLocation.lat},${userLocation.lng}\n`;
    msg += `🗺️ *RUTA EN GOOGLE MAPS:* ${routeUrl}\n`;
  }
  
  msg += `\n🛒 *DETALLE DEL PEDIDO*\n${itemsText}\n`;
  msg += `💵 *RESUMEN DE PAGO*\n`;
  msg += `• *Subtotal:* S/ ${sub.toFixed(2)}\n`;
  msg += `• *Envío:* S/ ${ship.toFixed(2)}\n`;
  msg += `• *TOTAL A PAGAR:* S/ ${total.toFixed(2)}\n\n`;
  msg += `_Método: Pago contra entrega_`;

  const waUrl = `https://api.whatsapp.com/send?phone=${MY_WHATSAPP_PHONE}&text=${encodeURIComponent(msg)}`;
  window.open(waUrl, '_blank');

  closeCheckout();
  document.getElementById('ticket').innerHTML = `
    <div><b>Restaurante:</b> ${r.name}</div>
    <div><b>Cliente:</b> ${name}</div>
    <div><b>Total:</b> S/ ${total.toFixed(2)}</div>
    <p style="margin-top:10px; color:var(--leaf-dark); font-weight:bold;">¡Se ha abierto WhatsApp para enviar tu pedido!</p>`;
  document.getElementById('confirmModal').classList.add('open');
}

function finishOrder() {
  cart = [];
  updateCartCount();
  updateCartTotals();
  document.getElementById('confirmModal').classList.remove('open');
  showRestaurants();
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast._to);
  showToast._to = setTimeout(() => t.classList.remove('show'), 1800);
}

/* ==========================================================
   INICIALIZACIÓN
   ========================================================== */
// Al final del archivo app.js:
renderCategories();
renderPromotions(); // 👈 AGREGAR ESTA LÍNEA
renderRestaurants();
updateCartTotals();
requestLocation(false);