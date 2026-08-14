/* ==========================================================
   THEME TOGGLE
   (En memoria durante la sesión. Si quieres que el modo
   elegido se recuerde entre visitas una vez publicado en
   GitHub Pages, guarda/lee el valor con localStorage ahí.)
========================================================== */
const root = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');
const logoImg = document.getElementById('logo-img');
const heroRider = document.getElementById('hero-rider');
const footerLogo = document.querySelector('.footer-logo');

function applyTheme(theme){
  root.setAttribute('data-theme', theme);
  const logoSrc = theme === 'dark' ? 'assets/logo-dark.png' : 'assets/logo-light.png';
  logoImg.src = logoSrc;
  heroRider.src = logoSrc;
  if(footerLogo) footerLogo.src = logoSrc;
}

const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
applyTheme(prefersDark ? 'dark' : 'light');

themeToggle.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
});

/* ==========================================================
   SCROLL REVEAL
========================================================== */
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      entry.target.classList.add('in-view');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealEls.forEach(el => io.observe(el));

/* ==========================================================
   PROMO CAROUSEL (banners de ofertas)
   Reemplaza este arreglo con una consulta a Supabase, ej:
   const { data } = await supabase.from('promos').select('*')
========================================================== */
const promos = [
  {
    badge:'🍕 Especial martes', title:'Pizza Italiana', subtitle:'2×1 todos los martes',
    desc:'Las mejores pizzas artesanales de Miraflores llegan a tu puerta.', cta:'Ver pizzerías',
    image:'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=75&auto=format&fit=crop',
    gradient:'linear-gradient(120deg,#4B32C3,#8C5CFF)'
  },
  {
    badge:'🍣 Solo hoy', title:'Sushi Bar', subtitle:'3×2 en rolls California',
    desc:'Frescura japonesa directo a tu mesa, sin salir de casa.', cta:'Ver sushi bars',
    image:'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=500&q=75&auto=format&fit=crop',
    gradient:'linear-gradient(120deg,#0B6E8F,#3B2FD1)'
  },
  {
    badge:'🔥 Oferta del día', title:'Pollo a la Brasa', subtitle:'20% off en combos familiares',
    desc:'El sabor criollo de siempre, más rápido que nunca.', cta:'Ver pollerías',
    image:'https://images.unsplash.com/photo-1562967914-608f82629710?w=500&q=75&auto=format&fit=crop',
    gradient:'linear-gradient(120deg,#C1440E,#FF7A29)'
  }
];

const promoTrack = document.getElementById('promo-track');
const promoDots = document.getElementById('promo-dots');
promoTrack.innerHTML = promos.map((p, i) => `
  <div class="promo-slide${i===0 ? ' active' : ''}" style="background:${p.gradient};">
    <span class="promo-deco d1"></span>
    <span class="promo-deco d2"></span>
    <div class="promo-copy">
      <span class="promo-badge">${p.badge}</span>
      <h3>${p.title}</h3>
      <p class="promo-subtitle">${p.subtitle}</p>
      <p>${p.desc}</p>
      <button class="btn promo-cta" type="button">${p.cta}</button>
    </div>
    <div class="promo-media">
      <img src="${p.image}" alt="${p.title}" loading="lazy" onerror="this.style.display='none'">
    </div>
  </div>
`).join('');
promoDots.innerHTML = promos.map((_, i) => `<button class="promo-dot${i===0 ? ' active' : ''}" data-i="${i}" aria-label="Ir a promo ${i+1}"></button>`).join('');

let promoIndex = 0;
const promoSlides = () => document.querySelectorAll('.promo-slide');
const promoDotEls = () => document.querySelectorAll('.promo-dot');

function goToPromo(i){
  const slides = promoSlides(), dots = promoDotEls();
  promoIndex = (i + slides.length) % slides.length;
  slides.forEach((s, idx) => s.classList.toggle('active', idx === promoIndex));
  dots.forEach((d, idx) => d.classList.toggle('active', idx === promoIndex));
}
document.getElementById('promo-prev').addEventListener('click', () => { goToPromo(promoIndex - 1); resetPromoAutoplay(); });
document.getElementById('promo-next').addEventListener('click', () => { goToPromo(promoIndex + 1); resetPromoAutoplay(); });
promoDots.addEventListener('click', (e) => {
  const dot = e.target.closest('.promo-dot');
  if(!dot) return;
  goToPromo(Number(dot.dataset.i));
  resetPromoAutoplay();
});

let promoAutoplay;
function resetPromoAutoplay(){
  clearInterval(promoAutoplay);
  promoAutoplay = setInterval(() => goToPromo(promoIndex + 1), 5000);
}
resetPromoAutoplay();
const promoCarouselEl = document.getElementById('promo-carousel');
promoCarouselEl.addEventListener('mouseenter', () => clearInterval(promoAutoplay));
promoCarouselEl.addEventListener('mouseleave', resetPromoAutoplay);

/* ==========================================================
   CATEGORÍAS — flechas de desplazamiento + estado activo
========================================================== */
const chipRow = document.getElementById('chip-row');
document.getElementById('cat-prev').addEventListener('click', () => chipRow.scrollBy({ left:-220, behavior:'smooth' }));
document.getElementById('cat-next').addEventListener('click', () => chipRow.scrollBy({ left:220, behavior:'smooth' }));
chipRow.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if(!chip) return;
  chipRow.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  chip.scrollIntoView({ behavior:'smooth', inline:'center', block:'nearest' });
  activeCategory = chip.dataset.cat;
  renderRestaurantGrid();
  document.getElementById('featured')?.scrollIntoView({ behavior:'smooth', block:'start' });
});

/* ==========================================================
   FEATURED RESTAURANTS (datos de ejemplo)
   Reemplaza este arreglo con una consulta a Supabase, ej:
   const { data } = await supabase.from('restaurants').select('*')
========================================================== */
const restaurants = [
  {
    id:'burguesia', name:'La Burguesía', sub:'Hamburguesas • Papas Fritas', badge:{type:'off', label:'20% OFF'},
    cats:['hamburguesas','bebidas'],
    tags:['Favorito del barrio','Nuevo'], rating:'4.8', reviews:342, time:'25-35 min', min:'S/ 20',
    lat:-8.3791, lng:-74.5539, address:'Jr. Tarapacá, cerca a la Plaza de Armas',
    image:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=75&auto=format&fit=crop',
    dishes:[
      { id:'d1', category:'Comidas', name:'Clásica MotoMoto', desc:'Carne, queso cheddar, lechuga y salsa especial.', price:18.90, rating:4.5, reviews:9, image:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=70&auto=format&fit=crop' },
      { id:'d2', category:'Comidas', name:'Doble Bacon', desc:'Doble carne, bacon crocante y queso.', price:24.50, rating:4.5, reviews:137, image:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=70&auto=format&fit=crop' },
      { id:'d3', category:'Acompañamientos', name:'Papas Fritas', desc:'Porción grande con salsas a elección.', price:9.90, rating:3.9, reviews:107, image:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=70&auto=format&fit=crop' },
      { id:'d4', category:'Comidas', name:'Chicken Crispy', desc:'Pollo crocante, mayo picante y pepinillos.', price:19.90, rating:4.1, reviews:137, image:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=70&auto=format&fit=crop' },
      { id:'d5', category:'Bebidas', name:'Chicha Morada 1/2L', desc:'Preparada al día, bien helada.', price:6.00, rating:5.0, reviews:117, image:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=70&auto=format&fit=crop' },
      { id:'d6', category:'Bebidas', name:'Gaseosa 500ml', desc:'Inca Kola, Coca-Cola o Sprite.', price:5.00, rating:4.9, reviews:173, image:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=70&auto=format&fit=crop' }
    ]
  },
  {
    id:'sakura', name:'Sakura Sushi Bar', sub:'Sushi • Japonesa', badge:{type:'feat', label:'Muy pedido'},
    cats:['sushi','bebidas'],
    tags:['Top rated'], rating:'4.9', reviews:518, time:'30-45 min', min:'S/ 35',
    lat:-8.3819, lng:-74.5468, address:'Malecón Grau, frente al río Ucayali',
    image:'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=500&q=75&auto=format&fit=crop',
    dishes:[
      { id:'d1', category:'Rolls', name:'Roll California x10', desc:'Palta, kanikama y queso crema.', price:22.00, rating:4.7, reviews:25, image:'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=200&q=70&auto=format&fit=crop' },
      { id:'d2', category:'Rolls', name:'Roll Acevichado x10', desc:'Langostino, palta y toque acevichado.', price:26.00, rating:4.4, reviews:93, image:'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=200&q=70&auto=format&fit=crop' },
      { id:'d3', category:'Sashimi', name:'Sashimi Salmón (10 pzs)', desc:'Corte fresco del día.', price:32.00, rating:4.4, reviews:34, image:'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=200&q=70&auto=format&fit=crop' },
      { id:'d4', category:'Entradas', name:'Gyozas de Cerdo', desc:'6 unidades con salsa ponzu.', price:15.00, rating:3.8, reviews:29, image:'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=200&q=70&auto=format&fit=crop' },
      { id:'d5', category:'Bebidas', name:'Ramune Original', desc:'Gaseosa japonesa, bien helada.', price:8.00, rating:4.8, reviews:14, image:'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=200&q=70&auto=format&fit=crop' }
    ]
  },
  {
    id:'napoli', name:'Bella Napoli', sub:'Pizzas • Italiana', badge:{type:'combo', label:'2×1 martes'},
    cats:['pizzas','postres','bebidas'],
    tags:['Artesanal'], rating:'4.6', reviews:289, time:'20-30 min', min:'S/ 25',
    lat:-8.3690, lng:-74.5570, address:'Av. Centenario, San Fernando',
    image:'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=75&auto=format&fit=crop',
    dishes:[
      { id:'d1', category:'Pizzas', name:'Pizza Margarita', desc:'Salsa de tomate, mozzarella y albahaca.', price:28.00, rating:4.0, reviews:49, image:'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&q=70&auto=format&fit=crop' },
      { id:'d2', category:'Pizzas', name:'Pizza Pepperoni', desc:'Doble pepperoni y mozzarella.', price:32.00, rating:4.1, reviews:58, image:'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&q=70&auto=format&fit=crop' },
      { id:'d3', category:'Pastas', name:'Fettuccine Alfredo', desc:'Pasta fresca en salsa cremosa.', price:24.00, rating:4.5, reviews:106, image:'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&q=70&auto=format&fit=crop' },
      { id:'d4', category:'Postres', name:'Tiramisú', desc:'Postre clásico italiano casero.', price:14.00, rating:3.8, reviews:177, image:'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&q=70&auto=format&fit=crop' },
      { id:'d5', category:'Bebidas', name:'Limonada Frozen', desc:'Limonada frappé bien fría.', price:9.00, rating:4.4, reviews:166, image:'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&q=70&auto=format&fit=crop' }
    ]
  },
  {
    id:'gallo', name:'Pollería El Gallo', sub:'Pollo a la Brasa • Criolla', badge:{type:'feat', label:'Destacado'},
    cats:['pollo','bebidas'],
    tags:['Clásico limeño'], rating:'4.7', reviews:631, time:'35-50 min', min:'S/ 30',
    lat:-8.3540, lng:-74.5732, address:'Av. Yarinacocha, Puerto Callao',
    image:'https://images.unsplash.com/photo-1562967914-608f82629710?w=500&q=75&auto=format&fit=crop',
    dishes:[
      { id:'d1', category:'Comidas', name:'1/4 Pollo + Papas', desc:'Con ensalada y cremas de la casa.', price:19.00, rating:5.0, reviews:105, image:'https://images.unsplash.com/photo-1562967914-608f82629710?w=200&q=70&auto=format&fit=crop' },
      { id:'d2', category:'Comidas', name:'Pollo Entero Familiar', desc:'Pollo entero, papas y ensalada grande.', price:58.00, rating:3.8, reviews:166, image:'https://images.unsplash.com/photo-1562967914-608f82629710?w=200&q=70&auto=format&fit=crop' },
      { id:'d3', category:'Comidas', name:'Anticuchos (2 unid.)', desc:'Corazón a la brasa con papa y choclo.', price:16.00, rating:4.4, reviews:95, image:'https://images.unsplash.com/photo-1562967914-608f82629710?w=200&q=70&auto=format&fit=crop' },
      { id:'d4', category:'Bebidas', name:'Chicha Morada 1L', desc:'Preparada al día, bien helada.', price:8.00, rating:4.3, reviews:151, image:'https://images.unsplash.com/photo-1562967914-608f82629710?w=200&q=70&auto=format&fit=crop' },
      { id:'d5', category:'Bebidas', name:'Inca Kola 1.5L', desc:'Bien fría, para compartir.', price:10.00, rating:4.0, reviews:17, image:'https://images.unsplash.com/photo-1562967914-608f82629710?w=200&q=70&auto=format&fit=crop' }
    ]
  },
  {
    id:'dulcevida', name:'Dulce Vida', sub:'Postres • Pastelería', badge:null,
    cats:['postres','bebidas'],
    tags:['Instagrameable','Nuevo'], rating:'4.5', reviews:120, time:'20-30 min', min:'S/ 15',
    lat:-8.3852, lng:-74.5493, address:'Jr. Sáenz Peña, cerca al Coliseo Regional',
    image:'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=500&q=75&auto=format&fit=crop',
    dishes:[
      { id:'d1', category:'Postres', name:'Cheesecake de Fresa', desc:'Porción individual, base de galleta.', price:12.50, rating:4.4, reviews:8, image:'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=200&q=70&auto=format&fit=crop' },
      { id:'d2', category:'Postres', name:'Brownie con Helado', desc:'Brownie tibio con bola de vainilla.', price:14.00, rating:4.1, reviews:163, image:'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=200&q=70&auto=format&fit=crop' },
      { id:'d3', category:'Postres', name:'Torta de Chocolate (porción)', desc:'Bizcocho húmedo, ganache de chocolate.', price:11.00, rating:5.0, reviews:33, image:'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=200&q=70&auto=format&fit=crop' },
      { id:'d4', category:'Helados', name:'Helado Artesanal (2 bolas)', desc:'A elección: vainilla, chocolate o lúcuma.', price:10.00, rating:4.0, reviews:20, image:'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=200&q=70&auto=format&fit=crop' },
      { id:'d5', category:'Frappés', name:'Frappé de Café', desc:'Café helado batido con crema.', price:13.00, rating:4.2, reviews:65, image:'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=200&q=70&auto=format&fit=crop' },
      { id:'d6', category:'Frappés', name:'Frappé de Fresa', desc:'Fresa natural batida con hielo.', price:13.00, rating:4.1, reviews:58, image:'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=200&q=70&auto=format&fit=crop' }
    ]
  },
  {
    id:'greenbowl', name:'Green Bowl', sub:'Saludable • Bowls', badge:null,
    cats:['saludable','bebidas'],
    tags:['Fit','Vegetariano'], rating:'4.6', reviews:98, time:'15-25 min', min:'S/ 18',
    lat:-8.3742, lng:-74.5721, address:'Av. Aviación, cerca al aeropuerto',
    image:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=75&auto=format&fit=crop',
    dishes:[
      { id:'d1', category:'Comidas', name:'Bowl Poke de Atún', desc:'Atún fresco, palta, arroz y vegetales.', price:23.00, rating:4.7, reviews:110, image:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&q=70&auto=format&fit=crop' },
      { id:'d2', category:'Comidas', name:'Bowl Quinua & Pollo', desc:'Quinua, pollo grillado y vegetales de estación.', price:21.00, rating:3.8, reviews:51, image:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&q=70&auto=format&fit=crop' },
      { id:'d3', category:'Comidas', name:'Wrap Vegetariano', desc:'Hummus, vegetales frescos y palta.', price:17.00, rating:4.3, reviews:78, image:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&q=70&auto=format&fit=crop' },
      { id:'d4', category:'Bebidas', name:'Jugo Verde Detox', desc:'Apio, piña, espinaca y limón.', price:9.00, rating:3.9, reviews:133, image:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&q=70&auto=format&fit=crop' },
      { id:'d5', category:'Bebidas', name:'Limonada de Hierbabuena', desc:'Refrescante, endulzada con miel.', price:8.00, rating:4.4, reviews:131, image:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&q=70&auto=format&fit=crop' }
    ]
  }
];

/* ==========================================================
   UBICACIÓN Y CÁLCULO DE ENVÍO
   Fórmula: S/ 3.00 por km de distancia entre el
   local y el cliente, con un mínimo de S/ 6.00 por pedido.
   Para producción: guarda la ubicación del cliente y recalcula
   esto en el backend antes de cobrar, nunca confíes solo en el
   cálculo hecho en el navegador.
========================================================== */
const PUCALLPA_CENTER = { lat:-8.3791, lng:-74.5539 }; // Plaza de Armas, usado como fallback si no comparten GPS

// Direcciones guardadas del cliente — en producción esto vive en tu backend (p.ej. Supabase),
// ligado a su cuenta, en vez de en memoria del navegador.
let savedAddresses = [
  { id: 1, label:'Casa', address:'San Fernando Mz. 14 - Lt. 5, Pucallpa', addressNote:'', reference:'', lat:-8.3729, lng:-74.5697 }
];
let activeAddressId = 1;
let addrIdSeq = 2;

let customerLocation = { lat: savedAddresses[0].lat, lng: savedAddresses[0].lng };
let locationIsPrecise = false;

function haversineKm(lat1, lon1, lat2, lon2){
  const toRad = deg => deg * Math.PI / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
function calcDeliveryFee(km){
  const raw = 3 * km;
  // Redondeo al 0.1 más cercano y mínimo de S/ 6.00 por pedido.
  return Math.max(6, Math.round(raw * 10) / 10);
}
function updateAllFees(){
  restaurants.forEach(r => {
    const km = haversineKm(customerLocation.lat, customerLocation.lng, r.lat, r.lng);
    r.distanceKm = Math.round(km * 10) / 10;
    r.feeValue = calcDeliveryFee(km);
    r.fee = `S/ ${r.feeValue.toFixed(1)}`;
  });
}
updateAllFees(); // primer cálculo con la dirección guardada, para que los precios salgan ni bien carga la página


const grid = document.getElementById('restaurant-grid');
let activeCategory = 'todos';
function renderRestaurantGrid(){
  const list = activeCategory === 'todos'
    ? restaurants
    : restaurants.filter(r => (r.cats || []).includes(activeCategory));

  if(list.length === 0){
    grid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:40px 10px; color:var(--text-soft);">
        <p style="font-size:1rem; margin:0 0 4px;">Todavía no tenemos locales en esta categoría por aquí 🛵</p>
        <p style="font-size:.85rem; margin:0;">Prueba con otra categoría o revisa "Todos".</p>
      </div>`;
    return;
  }

  grid.innerHTML = list.map((r, i) => `
    <div class="r-card" data-rid="${r.id}" style="cursor:pointer;">
      <div class="r-thumb">
        <img src="${r.image}" alt="${r.name}" loading="lazy" onerror="this.style.display='none'">
        ${r.badge ? `<span class="r-badge ${r.badge.type}">${r.badge.label}</span>` : ''}
        <button class="r-fav" data-i="${i}" type="button" aria-label="Guardar en favoritos">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-6.7-4.35-9.3-8.1C.8 9.8 1.9 6 5.3 5c2-.6 3.9.2 5 1.8L12 8.5l1.7-1.7c1.1-1.6 3-2.4 5-1.8 3.4 1 4.5 4.8 2.6 7.9C18.7 16.65 12 21 12 21z"/></svg>
        </button>
      </div>
      <div class="r-body">
        <h3>${r.name}</h3>
        <p class="r-sub">${r.sub}</p>
        <div class="r-tags">${r.tags.map(t => `<span class="r-tag">${t}</span>`).join('')}</div>
        <div class="r-meta">
          <span class="rating">★ ${r.rating} <span style="color:var(--text-soft); font-weight:600;">(${r.reviews})</span></span>
          <span class="m-item">⏱ ${r.time}</span>
          <span class="m-item">📍 ${r.distanceKm} km</span>
          <span class="m-item">🛵 ${r.fee}</span>
          <span class="m-item">Mín. ${r.min}</span>
        </div>
      </div>
    </div>
  `).join('');
}
renderRestaurantGrid();
grid.addEventListener('click', (e) => {
  const fav = e.target.closest('.r-fav');
  if(fav){ fav.classList.toggle('active'); return; }
  const card = e.target.closest('.r-card');
  if(!card) return;
  openMenu(card.dataset.rid);
});

/* ==========================================================
   CARRITO — estado en memoria durante la sesión
   Estructura: cart[ "restauranteId::platoId" ] = { r, dish, qty }
   Para producción: guarda el carrito en Supabase (tabla `cart_items`
   ligada al usuario autenticado) en vez de en memoria, así
   persiste entre sesiones y dispositivos.
========================================================== */
let cart = {};

// Propina para el repartidor y servicio VIP (opcionales, elegidos en el carrito).
let tipMode = 'none';   // 'none' | '1' | '2' | '3' | 'custom'
let tipCustomValue = 0; // usado solo cuando tipMode === 'custom'
let isVip = false;
const VIP_FEE = 2.3;

function getTipAmount(){
  if(tipMode === '1') return 1;
  if(tipMode === '2') return 2;
  if(tipMode === '3') return 3;
  if(tipMode === 'custom') return Math.max(0, Number(tipCustomValue) || 0);
  return 0;
}

function findRestaurant(rid){
  return restaurants.find(r => r.id === rid);
}
function cartKey(rid, did){ return `${rid}::${did}`; }
function getQty(rid, did){
  const item = cart[cartKey(rid, did)];
  return item ? item.qty : 0;
}
function changeQty(rid, did, delta){
  const key = cartKey(rid, did);
  const restaurant = findRestaurant(rid);
  const dish = restaurant.dishes.find(d => d.id === did);
  const current = cart[key];
  const nextQty = (current ? current.qty : 0) + delta;
  if(nextQty <= 0){
    delete cart[key];
  } else {
    cart[key] = { rid, did, qty: nextQty, restaurant, dish };
  }
  updateCartBadge();
  renderMenuDishList(rid);
  if(cartBackdrop.classList.contains('open')) renderCart();
}
function cartTotals(){
  let subtotal = 0;
  const restaurantIdsInCart = new Set();
  Object.values(cart).forEach(item => {
    subtotal += item.dish.price * item.qty;
    restaurantIdsInCart.add(item.rid);
  });
  let deliveryFee = 0;
  restaurantIdsInCart.forEach(rid => { deliveryFee += findRestaurant(rid).feeValue; });
  const itemCount = Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
  const tip = getTipAmount();
  const vipFee = isVip ? VIP_FEE : 0;
  return {
    subtotal, deliveryFee, tip, vipFee,
    total: subtotal + deliveryFee + tip + vipFee,
    itemCount, restaurantCount: restaurantIdsInCart.size
  };
}
// Redondea al 0.1 más cercano para que nunca se vea algo como "S/ 6.64".
function fmtMoney(n){ return `S/ ${(Math.round(n * 10) / 10).toFixed(1)}`; }

function updateCartBadge(){
  const { itemCount } = cartTotals();
  cartBadge.textContent = itemCount;
}

/* ---------- CAMBIO DE VISTAS (home / menú / direcciones / mapa) ---------- */
const viewHome = document.getElementById('view-home');
const viewMenu = document.getElementById('view-menu');
const viewAddresses = document.getElementById('view-addresses');
const viewMapConfirm = document.getElementById('view-map-confirm');
const allViews = [viewHome, viewMenu, viewAddresses, viewMapConfirm];
function showView(target){
  allViews.forEach(v => { v.style.display = (v === target) ? (v === viewHome ? '' : 'block') : 'none'; });
  window.scrollTo({ top: 0, behavior: 'auto' });
}
const mvBackBtn = document.getElementById('mv-back-btn');
const mvRestName = document.getElementById('mv-rest-name');
const mvRestStrip = document.getElementById('mv-rest-strip');
const mvCatTabs = document.getElementById('mv-cat-tabs');
const mvDishList = document.getElementById('mv-dish-list');
const locationLabel = document.getElementById('location-label');
const locationPickerBtn = document.getElementById('location-picker');

/* Mapa local + entrega dentro del menú: lo quitamos por ahora (queda para más adelante),
   pero toda la infraestructura de mapas (Leaflet + coordenadas por restaurante) ya está lista
   para reactivarlo cuando se necesite. */

let activeMenuCategory = 'Todos';

function openMenu(rid){
  const r = findRestaurant(rid);
  if(!r) return;
  activeMenuCategory = 'Todos'; // al entrar a un restaurante, siempre arranca mostrando todo
  mvRestName.textContent = r.name;
  mvRestStrip.innerHTML = `
    <img src="${r.image}" alt="${r.name}" onerror="this.style.display='none'">
    <span>${r.sub}</span>
    <span>★ ${r.rating}</span>
    <span>⏱ ${r.time}</span>
    <span>📍 ${r.distanceKm} km</span>
    <span>🛵 ${r.fee}</span>
  `;
  renderCategoryTabs(rid);
  renderMenuDishList(rid);
  showView(viewMenu);
}
function renderCategoryTabs(rid){
  const r = findRestaurant(rid);
  if(!r) return;
  const cats = ['Todos', ...new Set(r.dishes.map(d => d.category))];
  mvCatTabs.innerHTML = cats.map(c => `
    <button class="mv-cat-tab ${c === activeMenuCategory ? 'active' : ''}" data-cat="${c}" type="button">${c}</button>
  `).join('');
}
mvCatTabs.addEventListener('click', (e) => {
  const btn = e.target.closest('.mv-cat-tab');
  if(!btn) return;
  const rid = mvDishList.dataset.rid;
  activeMenuCategory = btn.dataset.cat;
  renderCategoryTabs(rid);
  renderMenuDishList(rid);
});
function renderMenuDishList(rid){
  const r = findRestaurant(rid);
  if(!r) return;
  mvDishList.dataset.rid = rid;
  const dishes = activeMenuCategory === 'Todos' ? r.dishes : r.dishes.filter(d => d.category === activeMenuCategory);
  mvDishList.innerHTML = dishes.map(d => {
    const qty = getQty(rid, d.id);
    return `
    <div class="dish-row">
      <img class="dish-thumb" src="${d.image}" alt="${d.name}" loading="lazy" decoding="async" onerror="this.style.display='none'">
      <div class="dish-body">
        ${activeMenuCategory === 'Todos' ? `<span class="dish-cat-tag">${d.category}</span>` : ''}
        <h4>${d.name}</h4>
        <p class="dish-desc">${d.desc}</p>
        <div class="dish-bottom">
          <span class="dish-price">${fmtMoney(d.price)}</span>
          ${qty > 0 ? `
            <div class="stepper">
              <button type="button" data-act="dec" data-did="${d.id}">−</button>
              <span class="qty">${qty}</span>
              <button type="button" data-act="inc" data-did="${d.id}">+</button>
            </div>
          ` : `
            <button class="add-btn" type="button" data-act="inc" data-did="${d.id}">Agregar</button>
          `}
        </div>
      </div>
    </div>
  `;
  }).join('');
}
mvDishList.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-act]');
  if(!btn) return;
  const rid = mvDishList.dataset.rid;
  const did = btn.dataset.did;
  const delta = btn.dataset.act === 'inc' ? 1 : -1;
  changeQty(rid, did, delta);
});
function closeMenu(){ showView(viewHome); }
mvBackBtn.addEventListener('click', closeMenu);

/* ==========================================================
   BUSCADOR — funciona igual en mobile (overlay a pantalla completa)
   y en web (panel flotante debajo del header). Busca coincidencias
   tanto en restaurantes ("Locales") como en platos individuales
   ("Productos", agrupados por restaurante, con scroll horizontal).
========================================================== */
const searchOverlay = document.getElementById('search-overlay');
const searchBody = document.getElementById('search-body');
const searchOverlayInput = document.getElementById('search-overlay-input');
const searchClearBtn = document.getElementById('search-clear-btn');
const searchBackBtn = document.getElementById('search-back-btn');
const openSearchMobileBtn = document.getElementById('open-search-mobile');
const headerSearchInput = document.querySelector('.search-bar input'); // buscador inline de escritorio

let searchSortPrice = '';   // '', 'asc', 'desc'
let searchSortRating = '';  // '', 'desc'

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

function openSearch(prefill){
  searchOverlay.classList.add('open');
  searchOverlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  const q = prefill ?? searchOverlayInput.value ?? '';
  searchOverlayInput.value = q;
  renderSearchResults(q);
  setTimeout(() => searchOverlayInput.focus({ preventScroll:true }), 60);
}
function closeSearch(){
  searchOverlay.classList.remove('open');
  searchOverlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function renderSearchResults(query){
  const q = (query || '').trim().toLowerCase();
  searchClearBtn.style.display = q ? 'inline-flex' : 'none';

  if(!q){
    searchBody.innerHTML = `<div class="search-empty">Busca por nombre de restaurante o plato — por ejemplo "hamburguesa" o "sushi" 🔍</div>`;
    return;
  }

  const matchedRestaurants = restaurants.filter(r =>
    r.name.toLowerCase().includes(q) ||
    r.sub.toLowerCase().includes(q) ||
    (r.tags || []).some(t => t.toLowerCase().includes(q))
  );

  const matchedDishGroups = restaurants
    .map(r => ({
      r,
      dishes: r.dishes.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        (d.desc || '').toLowerCase().includes(q)
      )
    }))
    .filter(g => g.dishes.length > 0);

  matchedDishGroups.forEach(g => {
    if(searchSortPrice === 'asc') g.dishes.sort((a, b) => a.price - b.price);
    else if(searchSortPrice === 'desc') g.dishes.sort((a, b) => b.price - a.price);
    if(searchSortRating === 'desc') g.dishes.sort((a, b) => b.rating - a.rating);
  });

  if(matchedRestaurants.length === 0 && matchedDishGroups.length === 0){
    searchBody.innerHTML = `
      <div class="search-empty">No encontramos nada para "<strong>${escapeHtml(query)}</strong>" 😕<br>Prueba con otra palabra.</div>`;
    return;
  }

  let html = '';

  if(matchedRestaurants.length){
    html += `<h3 class="search-section-title">Locales</h3><div class="search-rest-list">`;
    html += matchedRestaurants.map(r => `
      <button class="search-rest-item" type="button" data-rid="${r.id}">
        <img src="${r.image}" alt="${r.name}" loading="lazy" decoding="async" onerror="this.style.display='none'">
        <div class="search-rest-info">
          <h4>${r.name}</h4>
          <p>${r.sub}</p>
          <div class="search-rest-meta">
            <span>★ ${r.rating}</span><span>⏱ ${r.time}</span><span>🛵 ${r.fee || fmtMoney(r.feeValue || 5.5)}</span>
          </div>
        </div>
      </button>
    `).join('');
    html += `</div>`;
  }

  if(matchedDishGroups.length){
    html += `
      <div class="search-section-head">
        <h3 class="search-section-title">Productos</h3>
        <div class="search-filters">
          <select id="search-sort-price" aria-label="Ordenar por precio">
            <option value="">Precio</option>
            <option value="asc" ${searchSortPrice === 'asc' ? 'selected' : ''}>Menor a mayor</option>
            <option value="desc" ${searchSortPrice === 'desc' ? 'selected' : ''}>Mayor a menor</option>
          </select>
          <select id="search-sort-rating" aria-label="Ordenar por calificación">
            <option value="">Calificación</option>
            <option value="desc" ${searchSortRating === 'desc' ? 'selected' : ''}>Mejor calificados</option>
          </select>
        </div>
      </div>
    `;
    html += matchedDishGroups.map(g => `
      <div class="search-prod-group">
        <button class="search-prod-group-header" type="button" data-rid="${g.r.id}">
          <img src="${g.r.image}" alt="${g.r.name}" loading="lazy" decoding="async" onerror="this.style.display='none'">
          <h4>${g.r.name}</h4>
          <span>★ ${g.r.rating}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
        </button>
        <div class="search-prod-row">
          ${g.dishes.map(d => `
            <button class="search-dish-card" type="button" data-rid="${g.r.id}" data-did="${d.id}">
              <img src="${d.image}" alt="${d.name}" loading="lazy" decoding="async" onerror="this.style.display='none'">
              <div class="sdc-body">
                <h5>${d.name}</h5>
                <span class="sdc-price">${fmtMoney(d.price)}</span>
                <span class="sdc-rating">★ ${d.rating.toFixed(1)} (${d.reviews})</span>
              </div>
            </button>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  searchBody.innerHTML = html;
}

// Abrir el buscador: desde el ícono de lupa en mobile, o al enfocar/escribir
// en la barra de búsqueda de escritorio.
openSearchMobileBtn?.addEventListener('click', () => openSearch(''));
if(headerSearchInput){
  headerSearchInput.addEventListener('focus', () => openSearch(headerSearchInput.value));
  headerSearchInput.addEventListener('input', () => {
    if(!searchOverlay.classList.contains('open')) openSearch(headerSearchInput.value);
    else { searchOverlayInput.value = headerSearchInput.value; renderSearchResults(headerSearchInput.value); }
  });
}
searchOverlayInput.addEventListener('input', () => {
  if(headerSearchInput) headerSearchInput.value = searchOverlayInput.value;
  renderSearchResults(searchOverlayInput.value);
});
searchClearBtn.addEventListener('click', () => {
  searchOverlayInput.value = '';
  if(headerSearchInput) headerSearchInput.value = '';
  renderSearchResults('');
  searchOverlayInput.focus();
});
searchBackBtn.addEventListener('click', closeSearch);
searchOverlay.addEventListener('click', (e) => { if(e.target === searchOverlay) closeSearch(); });
document.addEventListener('keydown', (e) => {
  if(e.key === 'Escape' && searchOverlay.classList.contains('open')) closeSearch();
});
searchBody.addEventListener('change', (e) => {
  if(e.target.id === 'search-sort-price'){ searchSortPrice = e.target.value; renderSearchResults(searchOverlayInput.value); }
  if(e.target.id === 'search-sort-rating'){ searchSortRating = e.target.value; renderSearchResults(searchOverlayInput.value); }
});
searchBody.addEventListener('click', (e) => {
  const restBtn = e.target.closest('.search-rest-item');
  const groupHeader = e.target.closest('.search-prod-group-header');
  const dishCard = e.target.closest('.search-dish-card');
  const rid = restBtn?.dataset.rid || groupHeader?.dataset.rid || dishCard?.dataset.rid;
  if(rid){ closeSearch(); openMenu(rid); }
});

/* ---------- VISTA: MIS DIRECCIONES ---------- */
const addrListEl = document.getElementById('addr-list');
const addrBackBtn = document.getElementById('addr-back-btn');
const addrAddBtn = document.getElementById('addr-add-btn');
const addrSearchInput = document.getElementById('addr-search-input');

function openAddresses(){
  addrSearchInput.value = '';
  renderAddressList();
  showView(viewAddresses);
}
function renderAddressList(){
  if(savedAddresses.length === 0){
    addrListEl.innerHTML = `<div class="addr-empty">Aún no guardaste ninguna dirección.<br>Agrega la primera para calcular tu envío exacto.</div>`;
    return;
  }
  addrListEl.innerHTML = savedAddresses.map(a => `
    <div class="addr-item ${a.id === activeAddressId ? 'active' : ''}" data-id="${a.id}">
      <div class="addr-pin">📍</div>
      <div class="addr-info">
        <p class="addr-title">${a.label}</p>
        <p class="addr-sub">${a.address}${a.addressNote ? ` · ${a.addressNote}` : ''}</p>
        ${a.reference ? `<p class="addr-ref">📌 ${a.reference}</p>` : ''}
      </div>
      <button class="addr-edit" data-id="${a.id}" type="button" aria-label="Editar dirección" style="background:none; border:none; color:var(--text-soft); font-size:1rem; padding:6px; flex-shrink:0;">✏️</button>
      <button class="addr-del" data-id="${a.id}" type="button" aria-label="Eliminar dirección" style="background:none; border:none; color:var(--text-soft); font-size:1rem; padding:6px; flex-shrink:0;">✕</button>
      <div class="addr-check"></div>
    </div>
  `).join('');
}
function selectAddress(id){
  const a = savedAddresses.find(x => x.id === id);
  if(!a) return;
  activeAddressId = id;
  customerLocation = { lat:a.lat, lng:a.lng };
  locationIsPrecise = true;
  locationLabel.textContent = a.label;
  refreshAllFeeDependentViews();
}
addrListEl.addEventListener('click', (e) => {
  const sugg = e.target.closest('.addr-item.suggestion');
  if(sugg){
    openMapConfirm(parseFloat(sugg.dataset.lat), parseFloat(sugg.dataset.lng), sugg.dataset.label);
    return;
  }
  const delBtn = e.target.closest('.addr-del');
  if(delBtn){
    e.stopPropagation();
    const id = Number(delBtn.dataset.id);
    savedAddresses = savedAddresses.filter(a => a.id !== id);
    if(activeAddressId === id){
      activeAddressId = savedAddresses[0] ? savedAddresses[0].id : null;
      if(activeAddressId) selectAddress(activeAddressId);
    }
    renderAddressList();
    return;
  }
  const editBtn = e.target.closest('.addr-edit');
  if(editBtn){
    e.stopPropagation();
    const id = Number(editBtn.dataset.id);
    const a = savedAddresses.find(x => x.id === id);
    if(a){
      openMapConfirm(a.lat, a.lng, a.label, {
        editId: a.id, addressNote: a.addressNote, reference: a.reference, returnTo: 'addresses'
      });
    }
    return;
  }
  const item = e.target.closest('.addr-item');
  if(!item) return;
  selectAddress(Number(item.dataset.id));
  renderAddressList();
});

let addrSearchTimer = null;
addrSearchInput.addEventListener('input', () => {
  clearTimeout(addrSearchTimer);
  const q = addrSearchInput.value.trim();
  if(q.length < 4){ renderAddressList(); return; }
  addrSearchTimer = setTimeout(() => searchAddressSuggestions(q), 500);
});

/* ==========================================================
   BÚSQUEDA DE DIRECCIONES CON REINTENTO
   Pucallpa todavía tiene pocas numeraciones de casas cargadas en el
   mapa (OpenStreetMap), así que buscar "Jr. San Fernando 348" tal cual
   muchas veces no encuentra nada. Por eso reintentamos en varios pasos,
   cada vez con una consulta un poco más general, hasta ubicar al menos
   la calle o la zona correcta:
   1) la dirección completa tal cual la escribió la persona
   2) la misma dirección pero sin el número de casa (solo la calle)
   3) solo la primera palabra clave (por si el resto confunde la búsqueda)
========================================================== */
async function geocodePucallpa(query, limit = 1){
  const runQuery = async (q) => {
    try{
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=${limit}&countrycodes=pe`;
      const res = await fetch(url);
      if(!res.ok) return [];
      return await res.json();
    }catch(err){ return null; } // null = error de red, distinto de "sin resultados"
  };

  const attempts = [];
  const full = query.trim();
  attempts.push(full);

  const withoutNumber = full.replace(/\s*\d+[a-zA-Z°ºª]?\s*$/, '').trim();
  if(withoutNumber && withoutNumber !== full) attempts.push(withoutNumber);

  const firstWords = full.split(/\s+/).slice(0, 3).join(' ');
  if(firstWords && firstWords !== full && firstWords !== withoutNumber) attempts.push(firstWords);

  for(let i = 0; i < attempts.length; i++){
    const results = await runQuery(`${attempts[i]}, Pucallpa, Perú`);
    if(results === null) return { results: [], exact: false, networkError: true };
    if(results.length) return { results, exact: i === 0, networkError: false };
  }
  return { results: [], exact: false, networkError: false };
}

async function searchAddressSuggestions(q){
  addrListEl.innerHTML = `<div class="addr-empty">Buscando en el mapa de Pucallpa…</div>`;
  const { results, exact, networkError } = await geocodePucallpa(q, 6);
  if(networkError){
    addrListEl.innerHTML = `<div class="addr-empty">No pudimos buscar en este momento. Intenta de nuevo.</div>`;
    return;
  }
  if(!results.length){
    addrListEl.innerHTML = `<div class="addr-empty">No encontramos esa dirección en Pucallpa.<br>Prueba con otra referencia (por ejemplo solo la calle) o ubica el pin en el mapa.</div>`;
    return;
  }
  addrListEl.innerHTML = (exact ? '' : `<div class="addr-empty" style="padding:10px 4px; text-align:left;">No encontramos el número exacto — te mostramos lo más cercano a esa calle/zona:</div>`) + results.map(r => `
    <div class="addr-item suggestion" data-lat="${r.lat}" data-lng="${r.lon}" data-label="${(r.display_name || '').replace(/"/g,'&quot;')}">
      <div class="addr-pin">🔎</div>
      <div class="addr-info">
        <p class="addr-title">${(r.display_name || '').split(',')[0]}</p>
        <p class="addr-sub">${r.display_name || ''}</p>
      </div>
    </div>
  `).join('');
}
addrBackBtn.addEventListener('click', () => showView(viewHome));
addrAddBtn.addEventListener('click', () => openMapConfirm(customerLocation.lat, customerLocation.lng, `Dirección ${savedAddresses.length + 1}`));
locationPickerBtn.addEventListener('click', openAddresses);

/* ---------- VISTA: CONFIRMAR DIRECCIÓN (mapa real, pin fijo al centro) ---------- */
let confirmMap = null;
let confirmMoveTimer = null;
let confirmPendingLabel = 'Nueva dirección';
let editingAddressId = null; // si está seteado, "Continuar" actualiza esta dirección en vez de crear una nueva
let mapConfirmReturnTo = 'addresses'; // 'addresses' o 'cart' — a dónde volver al terminar
const confirmAddressText = document.getElementById('confirm-address-text');
const mapBackBtn = document.getElementById('map-back-btn');
const mapLocateBtn = document.getElementById('map-locate-btn');
const confirmAddressBtn = document.getElementById('confirm-address-btn');

function ensureConfirmMap(lat, lng){
  if(confirmMap){
    confirmMap.setView([lat, lng], 17);
    setTimeout(() => confirmMap.invalidateSize(), 80);
    return confirmMap;
  }
  confirmMap = L.map('confirm-map', { zoomControl:true }).setView([lat, lng], 17);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom:19, attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(confirmMap);
  confirmMap.on('moveend', () => {
    clearTimeout(confirmMoveTimer);
    confirmMoveTimer = setTimeout(updateConfirmAddress, 350);
  });
  setTimeout(() => confirmMap.invalidateSize(), 80);

  // En mobile, la barra del navegador aparece/desaparece al hacer scroll y
  // cambia el alto real de la pantalla. Sin esto, Leaflet se queda con un
  // tamaño de mapa "viejo" y los tiles se ven desalineados o se salen del
  // recuadro. Recalculamos el tamaño cada vez que cambia el viewport.
  const refreshMapSize = () => { if(confirmMap) confirmMap.invalidateSize(); };
  window.addEventListener('resize', refreshMapSize);
  window.visualViewport?.addEventListener('resize', refreshMapSize);
  window.addEventListener('orientationchange', () => setTimeout(refreshMapSize, 200));

  return confirmMap;
}
async function reverseGeocode(lat, lng){
  try{
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
    const data = await res.json();
    const a = data.address || {};
    const street = [a.road, a.house_number].filter(Boolean).join(' ');
    const area = a.suburb || a.neighbourhood || a.quarter || a.city_district || '';
    const parts = [street || area, street ? area : ''].filter(Boolean);
    return parts.length ? parts.join(', ') + ', Pucallpa' : (data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
  }catch(err){
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}
async function updateConfirmAddress(){
  const c = confirmMap.getCenter();
  confirmAddressText.textContent = 'Ubicando…';
  confirmAddressText.textContent = await reverseGeocode(c.lat, c.lng);
}
function openMapConfirm(lat, lng, label, options = {}){
  confirmPendingLabel = label || `Dirección ${savedAddresses.length + 1}`;
  editingAddressId = options.editId || null;
  mapConfirmReturnTo = options.returnTo || 'addresses';
  document.getElementById('confirm-address-note').value = options.addressNote || '';
  document.getElementById('confirm-reference').value = options.reference || '';
  document.getElementById('confirm-address-search-status').textContent = '';
  document.querySelector('#view-map-confirm h2').textContent = editingAddressId ? 'Editar dirección' : 'Confirmar dirección';
  document.getElementById('confirm-address-btn').textContent = editingAddressId ? 'Guardar cambios' : 'Continuar';
  showView(viewMapConfirm);
  ensureConfirmMap(lat, lng);
  updateConfirmAddress();
}
function backFromMapConfirm(){
  if(mapConfirmReturnTo === 'cart'){ showView(viewHome); openCart(); }
  else showView(viewAddresses);
}
mapBackBtn.addEventListener('click', backFromMapConfirm);
mapLocateBtn.addEventListener('click', () => {
  if(!navigator.geolocation) return;
  mapLocateBtn.disabled = true;
  navigator.geolocation.getCurrentPosition(
    (pos) => { confirmMap.setView([pos.coords.latitude, pos.coords.longitude], 17); mapLocateBtn.disabled = false; },
    () => { mapLocateBtn.disabled = false; },
    { enableHighAccuracy:true, timeout:10000 }
  );
});

/* Buscar por texto la dirección aproximada y mover el mapa ahí directo —
   así quien escribe "Jr. 7 de Junio 343" no tiene que arrastrar el pin
   a mano; el mapa se ubica solo en la dirección real que encontró. */
const confirmAddressNoteInput = document.getElementById('confirm-address-note');
const confirmAddressSearchBtn = document.getElementById('confirm-address-search-btn');
const confirmAddressSearchStatus = document.getElementById('confirm-address-search-status');

async function searchAndMoveToAddress(query){
  const q = query.trim();
  if(q.length < 4){
    confirmAddressSearchStatus.textContent = 'Escribe un poco más para poder buscarla (mín. 4 letras).';
    return;
  }
  confirmAddressSearchStatus.textContent = 'Buscando esa dirección en el mapa…';
  const { results, exact, networkError } = await geocodePucallpa(q, 1);
  if(networkError){
    confirmAddressSearchStatus.textContent = 'No pudimos buscar en este momento. Intenta de nuevo o mueve el pin manualmente.';
    return;
  }
  if(!results.length){
    confirmAddressSearchStatus.textContent = 'No encontramos esa calle en el mapa. Mueve el pin manualmente hasta tu casa.';
    return;
  }
  const { lat, lon } = results[0];
  confirmMap.setView([parseFloat(lat), parseFloat(lon)], exact ? 17 : 16);
  confirmAddressSearchStatus.textContent = exact
    ? '¡Listo! Ubicamos el mapa ahí — ajusta el pin si hace falta.'
    : 'Encontramos la calle pero no el número exacto (Pucallpa aún no tiene todas las casas mapeadas). Ubicamos la cuadra — mueve el pin hasta tu puerta.';
}
confirmAddressSearchBtn.addEventListener('click', () => searchAndMoveToAddress(confirmAddressNoteInput.value));
confirmAddressNoteInput.addEventListener('keydown', (e) => {
  if(e.key === 'Enter'){ e.preventDefault(); searchAndMoveToAddress(confirmAddressNoteInput.value); }
});

confirmAddressBtn.addEventListener('click', () => {
  const c = confirmMap.getCenter();
  const addressNote = document.getElementById('confirm-address-note').value.trim();
  const reference = document.getElementById('confirm-reference').value.trim();

  if(editingAddressId){
    // Edita la dirección existente (ubicación + referencia) en vez de crear una nueva.
    const addr = savedAddresses.find(a => a.id === editingAddressId);
    if(addr){
      addr.address = confirmAddressText.textContent;
      addr.addressNote = addressNote;
      addr.reference = reference;
      addr.lat = c.lat; addr.lng = c.lng;
      if(addr.id === activeAddressId) selectAddress(addr.id);
    }
    editingAddressId = null;
  } else {
    const newAddr = {
      id: addrIdSeq++, label: confirmPendingLabel, address: confirmAddressText.textContent,
      addressNote, reference, lat:c.lat, lng:c.lng
    };
    savedAddresses.push(newAddr);
    selectAddress(newAddr.id);
  }

  renderAddressList();
  backFromMapConfirm();
});


/* ---------- MODAL DE CARRITO ---------- */
const cartBackdrop = document.getElementById('cart-backdrop');
const cartClose = document.getElementById('cart-close');
const cartBody = document.getElementById('cart-body');
const cartFoot = document.getElementById('cart-foot');
const cartBadge = document.getElementById('cart-badge');
let orderNote = ''; // nota opcional del pedido (ej: "sin cebolla", "tocar timbre 2 veces")

function openCart(){ cartBackdrop.classList.add('open'); renderCart(); }
function closeCart(){ cartBackdrop.classList.remove('open'); }
document.getElementById('open-cart').addEventListener('click', openCart);
cartClose.addEventListener('click', closeCart);
cartBackdrop.addEventListener('click', (e) => { if(e.target === cartBackdrop) closeCart(); });

function wireCartAddressButton(){
  const activeAddr = savedAddresses.find(a => a.id === activeAddressId) || savedAddresses[0];

  document.getElementById('cart-change-address-btn')?.addEventListener('click', () => {
    closeCart();
    openAddresses();
  });

  document.getElementById('cart-edit-location-btn')?.addEventListener('click', () => {
    if(!activeAddr) return;
    closeCart();
    openMapConfirm(activeAddr.lat, activeAddr.lng, activeAddr.label, {
      editId: activeAddr.id, addressNote: activeAddr.addressNote, reference: activeAddr.reference, returnTo: 'cart'
    });
  });

  // Edición rápida de la referencia sin salir del pedido: un tap muestra
  // un input en línea, y "Guardar" actualiza la dirección al toque.
  const refDisplay = document.getElementById('cart-address-ref-display');
  const refEditRow = document.getElementById('cart-ref-edit-row');
  const refInput = document.getElementById('cart-ref-input');

  document.getElementById('cart-edit-ref-btn')?.addEventListener('click', () => {
    if(refDisplay) refDisplay.style.display = 'none';
    if(refEditRow) refEditRow.style.display = 'flex';
    refInput?.focus();
    refInput?.select();
  });

  function saveCartReference(){
    if(activeAddr) activeAddr.reference = (refInput?.value || '').trim();
    renderCart();
  }
  document.getElementById('cart-ref-save-btn')?.addEventListener('click', saveCartReference);
  document.getElementById('cart-ref-cancel-btn')?.addEventListener('click', () => renderCart());
  refInput?.addEventListener('keydown', (e) => {
    if(e.key === 'Enter'){ e.preventDefault(); saveCartReference(); }
    if(e.key === 'Escape'){ e.preventDefault(); renderCart(); }
  });
}

function renderCart(){
  const items = Object.values(cart);
  const activeAddr = savedAddresses.find(a => a.id === activeAddressId) || savedAddresses[0];
  const addressBlockHtml = activeAddr ? `
    <div class="cart-address-select" id="cart-address-select">
      <span class="cart-address-icon">📍</span>
      <div class="cart-address-info">
        <p class="cart-address-label">Entregar en <strong>${activeAddr.label}</strong></p>
        <p class="cart-address-sub">${activeAddr.address}${activeAddr.addressNote ? ` · ${activeAddr.addressNote}` : ''}</p>
        <p class="cart-address-ref" id="cart-address-ref-display">
          📌 ${activeAddr.reference ? activeAddr.reference : 'Sin referencia — agrégala aquí'}
          <button type="button" id="cart-edit-ref-btn" class="cart-ref-edit-btn" aria-label="Editar referencia">✏️</button>
        </p>
        <div class="cart-ref-edit-row" id="cart-ref-edit-row">
          <input type="text" id="cart-ref-input" placeholder="Ej: Frente a la comisaría de San Fernando" value="${(activeAddr.reference || '').replace(/"/g,'&quot;')}">
          <button type="button" id="cart-ref-save-btn" class="cart-ref-save-btn">Guardar</button>
          <button type="button" id="cart-ref-cancel-btn" class="cart-ref-cancel-btn" aria-label="Cancelar">✕</button>
        </div>
      </div>
      <div class="cart-address-actions">
        <button type="button" id="cart-edit-location-btn">Editar ubicación</button>
        <button type="button" id="cart-change-address-btn">Cambiar</button>
      </div>
    </div>
  ` : '';

  if(items.length === 0){
    cartBody.innerHTML = addressBlockHtml + `
      <div class="sheet-empty">
        <span class="big-emoji">🛒</span>
        Aún no agregaste nada.<br>Explora los restaurantes y arma tu pedido.
      </div>`;
    cartFoot.innerHTML = `<button class="btn btn-primary" type="button" style="width:100%;" disabled>Realizar pedido</button>`;
    wireCartAddressButton();
    return;
  }

  // Agrupar por restaurante, preservando el orden de restaurants[]
  const groups = restaurants
    .map(r => ({ r, items: items.filter(it => it.rid === r.id) }))
    .filter(g => g.items.length > 0);

  cartBody.innerHTML = addressBlockHtml + groups.map(g => `
    <div class="cart-group">
      <div class="cart-group-head">
        <span class="g-name">🛵 ${g.r.name}</span>
        <span class="g-fee">Delivery: ${g.r.fee}</span>
      </div>
      ${g.items.map(it => `
        <div class="cart-row">
          <img src="${it.dish.image}" alt="${it.dish.name}" onerror="this.style.display='none'">
          <div style="flex:1; min-width:0;">
            <p class="cart-item-name">${it.dish.name}</p>
            <span class="cart-item-price">${fmtMoney(it.dish.price)} c/u</span>
          </div>
          <div class="stepper">
            <button type="button" class="${it.qty === 1 ? 'remove-btn' : ''}" data-act="dec" data-rid="${it.rid}" data-did="${it.did}">${it.qty === 1 ? '✕' : '−'}</button>
            <span class="qty">${it.qty}</span>
            <button type="button" data-act="inc" data-rid="${it.rid}" data-did="${it.did}">+</button>
          </div>
        </div>
      `).join('')}
    </div>
  `).join('') + `
    <div class="cart-tip">
      <label>¿Dejas propina para el repartidor? (opcional)</label>
      <div class="tip-options">
        <button type="button" class="tip-opt ${tipMode === 'none' ? 'active' : ''}" data-tip="none">Sin propina</button>
        <button type="button" class="tip-opt ${tipMode === '1' ? 'active' : ''}" data-tip="1">+S/ 1</button>
        <button type="button" class="tip-opt ${tipMode === '2' ? 'active' : ''}" data-tip="2">+S/ 2</button>
        <button type="button" class="tip-opt ${tipMode === '3' ? 'active' : ''}" data-tip="3">+S/ 3</button>
        <button type="button" class="tip-opt ${tipMode === 'custom' ? 'active' : ''}" data-tip="custom">Otro monto</button>
      </div>
      <div class="tip-custom-wrap" id="tip-custom-wrap" style="display:${tipMode === 'custom' ? 'flex' : 'none'};">
        <span class="cc">S/</span>
        <input type="number" id="tip-custom-input" min="0" step="0.5" placeholder="Monto de propina" value="${tipCustomValue || ''}">
      </div>
    </div>

    <label class="vip-check">
      <input type="checkbox" id="vip-check" ${isVip ? 'checked' : ''}>
      <span><strong>Servicio VIP</strong> — tu pedido se prioriza con el repartidor (+${fmtMoney(VIP_FEE)})</span>
    </label>

    <div class="cart-note">
      <label for="order-note-input">Nota para tu pedido (opcional)</label>
      <textarea id="order-note-input" rows="2" placeholder="Ej: sin cebolla, tocar timbre 2 veces, dejar con el guardián…">${orderNote}</textarea>
    </div>
  `;

  const { subtotal, deliveryFee, tip, vipFee, total, restaurantCount } = cartTotals();
  cartFoot.innerHTML = `
    <div class="sum-row"><span>Subtotal</span><strong>${fmtMoney(subtotal)}</strong></div>
    <div class="sum-row"><span>Envío${restaurantCount > 1 ? ` (${restaurantCount} locales)` : ''}</span><strong>${deliveryFee === 0 ? 'Gratis' : fmtMoney(deliveryFee)}</strong></div>
    <div class="sum-row" id="sum-row-tip" style="display:${tip > 0 ? 'flex' : 'none'};"><span>Propina</span><strong id="sum-tip-value">${fmtMoney(tip)}</strong></div>
    <div class="sum-row" id="sum-row-vip" style="display:${vipFee > 0 ? 'flex' : 'none'};"><span>Servicio VIP</span><strong>${fmtMoney(vipFee)}</strong></div>
    <div class="sum-row total"><span>Total</span><span id="sum-total-value">${fmtMoney(total)}</span></div>
    <button class="btn btn-primary" id="checkout-btn" type="button" style="width:100%; margin-top:14px;">Realizar pedido</button>
  `;

  wireCartAddressButton();

  const noteInput = document.getElementById('order-note-input');
  noteInput.addEventListener('input', () => { orderNote = noteInput.value; });

  document.querySelectorAll('.tip-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      tipMode = btn.dataset.tip;
      if(tipMode === 'custom'){
        renderCart();
        setTimeout(() => document.getElementById('tip-custom-input')?.focus(), 30);
      } else {
        renderCart();
      }
    });
  });
  const tipCustomInput = document.getElementById('tip-custom-input');
  tipCustomInput?.addEventListener('input', () => {
    tipCustomValue = parseFloat(tipCustomInput.value) || 0;
    // Solo actualizamos el resumen de totales para no perder el foco del input.
    const t = cartTotals();
    const tipRow = document.getElementById('sum-row-tip');
    document.getElementById('sum-tip-value').textContent = fmtMoney(t.tip);
    tipRow.style.display = t.tip > 0 ? 'flex' : 'none';
    document.getElementById('sum-total-value').textContent = fmtMoney(t.total);
  });

  const vipCheck = document.getElementById('vip-check');
  vipCheck.addEventListener('change', () => {
    isVip = vipCheck.checked;
    renderCart();
  });

  document.getElementById('checkout-btn').addEventListener('click', () => {
    orderNote = noteInput.value;
    tipCustomValue = tipCustomInput ? (parseFloat(tipCustomInput.value) || 0) : tipCustomValue;
    if(isVerified && customerName && customerPhone){
      sendOrderToWhatsApp();
    } else {
      closeCart();
      pendingCheckoutAfterAuth = true;
      openModal(); // pide nombre + celular por WhatsApp para confirmar el pedido
    }
  });
}

/* ==========================================================
   ENVÍO DEL PEDIDO POR WHATSAPP
   Arma un mensaje con todo el detalle del pedido (cliente, platos,
   totales, dirección + referencia y nota) y lo abre directo en
   WhatsApp hacia el número del negocio. Mientras no haya un backend
   propio, este es el "checkout": el pedido llega como mensaje de
   WhatsApp para que el negocio lo confirme y cobre manualmente.
========================================================== */
const MOTOMOTO_WHATSAPP_NUMBER = '51982780329';

function buildOrderMessage(){
  const items = Object.values(cart);
  const groups = restaurants
    .map(r => ({ r, items: items.filter(it => it.rid === r.id) }))
    .filter(g => g.items.length > 0);
  const { subtotal, deliveryFee, tip, vipFee, total } = cartTotals();
  const addr = savedAddresses.find(a => a.id === activeAddressId) || savedAddresses[0];

  let msg = `🛵 *Nuevo pedido MotoMoto*\n\n`;
  msg += `👤 Cliente: ${customerName}\n`;
  msg += `📱 Celular: +51 ${customerPhone}\n\n`;

  groups.forEach(g => {
    msg += `🍽️ *${g.r.name}*\n`;
    g.items.forEach(it => {
      msg += `• ${it.qty}x ${it.dish.name} — ${fmtMoney(it.dish.price * it.qty)}\n`;
    });
    msg += `   Envío: ${g.r.fee}\n\n`;
  });

  msg += `💰 Subtotal: ${fmtMoney(subtotal)}\n`;
  msg += `🛵 Envío total: ${deliveryFee === 0 ? 'Gratis' : fmtMoney(deliveryFee)}\n`;
  if(tip > 0) msg += `🙌 Propina: ${fmtMoney(tip)}\n`;
  if(vipFee > 0) msg += `⭐ Servicio VIP: ${fmtMoney(vipFee)}\n`;
  msg += `*Total a pagar: ${fmtMoney(total)}*\n\n`;

  if(addr){
    msg += `📍 Dirección: ${addr.address}\n`;
    if(addr.addressNote) msg += `🏠 Dirección aprox.: ${addr.addressNote}\n`;
    if(addr.reference) msg += `📌 Referencia: ${addr.reference}\n`;
  }

  if(orderNote.trim()) msg += `\n📝 Nota: ${orderNote.trim()}\n`;

  return msg;
}

function sendOrderToWhatsApp(){
  const message = buildOrderMessage();
  const url = `https://wa.me/${MOTOMOTO_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener');
  cart = {};
  orderNote = '';
  tipMode = 'none';
  tipCustomValue = 0;
  isVip = false;
  updateCartBadge();
  closeCart();
}

cartBody.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-act]');
  if(!btn) return;
  const delta = btn.dataset.act === 'inc' ? 1 : -1;
  changeQty(btn.dataset.rid, btn.dataset.did, delta);
});

updateCartBadge();

/* ==========================================================
   AUTH MODAL — número de celular + confirmación por WhatsApp
   ----------------------------------------------------------
   Este bloque es una SIMULACIÓN de frontend. Para producción,
   conecta estos puntos con Supabase + un proveedor de WhatsApp
   (Meta Cloud API / Twilio WhatsApp) así:

   1) Al enviar el celular:
      - Llama a una Supabase Edge Function ("send-otp") que:
          a) genera un código de 6 dígitos
          b) lo guarda en una tabla `otp_codes` con expiración
          c) llama a la API de WhatsApp para mandar el mensaje
      - supabase.functions.invoke('send-otp', { body: { phone } })

   2) Al confirmar el código:
      - Llama a otra función ("verify-otp") que valide el código
        contra la tabla `otp_codes` y, si es correcto, cree/loguee
        al usuario con supabase.auth.signInWithOtp o una sesión
        personalizada (custom JWT) ya que Supabase Auth no tiene
        WhatsApp nativo — el código se valida en tu propia función.
========================================================== */
const backdrop = document.getElementById('auth-backdrop');
const openBtns = [document.getElementById('open-auth'), document.getElementById('open-auth-2')];
const closeBtn = document.getElementById('modal-close');
const stepPhone = document.getElementById('step-phone');
const stepOtp = document.getElementById('step-otp');
const stepSuccess = document.getElementById('step-success');
const nameInput = document.getElementById('name-input');
const nameError = document.getElementById('name-error');
const phoneInput = document.getElementById('phone-input');
const phoneError = document.getElementById('phone-error');
const sendCodeBtn = document.getElementById('send-code-btn');
const otpPhoneDisplay = document.getElementById('otp-phone-display');
const otpMsg = document.getElementById('otp-msg');
const otpError = document.getElementById('otp-error');
const verifyBtn = document.getElementById('verify-code-btn');
const finishBtn = document.getElementById('finish-btn');
const resendBtn = document.getElementById('resend-btn');
const otpBoxes = document.querySelectorAll('.otp-box');

// Datos del cliente ya confirmados en esta sesión (nombre, celular).
// Cuando ya están completos no le volvemos a pedir el login para pedir de nuevo.
let customerName = '';
let customerPhone = '';
let isVerified = false;
// Si el modal se abrió desde "Realizar pedido", al terminar el login
// seguimos directo a enviar el pedido por WhatsApp.
let pendingCheckoutAfterAuth = false;

function openModal(){ backdrop.classList.add('open'); showStep(stepPhone); }
function closeModal(){ backdrop.classList.remove('open'); pendingCheckoutAfterAuth = false; }
openBtns.forEach(b => b && b.addEventListener('click', openModal));
closeBtn.addEventListener('click', closeModal);
backdrop.addEventListener('click', (e) => { if(e.target === backdrop) closeModal(); });

function showStep(step){
  [stepPhone, stepOtp, stepSuccess].forEach(s => s.classList.remove('active'));
  step.classList.add('active');
}

// Código de 6 dígitos generado para esta sesión — mientras no haya un
// proveedor real de WhatsApp conectado (ver notas de Supabase arriba),
// lo mostramos en pantalla para que el flujo se pueda probar de punta a punta.
let currentOtpCode = '';
function generateOtpCode(){ return String(Math.floor(100000 + Math.random() * 900000)); }

sendCodeBtn.addEventListener('click', () => {
  const name = nameInput.value.trim();
  const digits = phoneInput.value.replace(/\D/g,'');
  let ok = true;
  if(name.length < 2){ nameError.classList.add('show'); ok = false; } else { nameError.classList.remove('show'); }
  if(digits.length !== 9){ phoneError.classList.add('show'); ok = false; } else { phoneError.classList.remove('show'); }
  if(!ok){ (name.length < 2 ? nameInput : phoneInput).focus(); return; }

  // --- AQUÍ va la llamada real a Supabase para disparar el WhatsApp ---
  // await supabase.functions.invoke('send-otp', { body: { phone: `+51${digits}` } });
  currentOtpCode = generateOtpCode();

  otpPhoneDisplay.textContent = `+51 ${digits}`;
  otpError.classList.remove('show');
  otpMsg.textContent = `✓ Código enviado por WhatsApp (demo, mientras conectamos WhatsApp real): ${currentOtpCode}`;
  otpBoxes.forEach(b => b.value = '');
  showStep(stepOtp);
  otpBoxes[0].focus();
  startResendTimer();
});

otpBoxes.forEach((box, i) => {
  box.addEventListener('input', () => {
    box.value = box.value.replace(/\D/g,'');
    if(box.value && otpBoxes[i+1]) otpBoxes[i+1].focus();
  });
  box.addEventListener('keydown', (e) => {
    if(e.key === 'Backspace' && !box.value && otpBoxes[i-1]) otpBoxes[i-1].focus();
  });
});

verifyBtn.addEventListener('click', () => {
  const code = Array.from(otpBoxes).map(b => b.value).join('');
  if(code.length !== 6) { otpBoxes[0].focus(); return; }

  // --- AQUÍ va la verificación real contra Supabase ---
  // const { data, error } = await supabase.functions.invoke('verify-otp', { body: { phone, code } });
  if(code !== currentOtpCode){
    otpError.classList.add('show');
    otpBoxes.forEach(b => b.value = '');
    otpBoxes[0].focus();
    return;
  }
  otpError.classList.remove('show');

  customerName = nameInput.value.trim();
  customerPhone = phoneInput.value.replace(/\D/g,'');
  isVerified = true;
  showStep(stepSuccess);
});

finishBtn.addEventListener('click', () => {
  closeModal();
  if(pendingCheckoutAfterAuth){
    pendingCheckoutAfterAuth = false;
    sendOrderToWhatsApp();
  }
});

let resendInterval;
function startResendTimer(){
  let t = 30;
  resendBtn.disabled = true;
  let timerSpan = document.getElementById('resend-timer');
  if(timerSpan) timerSpan.textContent = t;
  clearInterval(resendInterval);
  resendInterval = setInterval(() => {
    t -= 1;
    timerSpan = document.getElementById('resend-timer');
    if(timerSpan) timerSpan.textContent = t;
    if(t <= 0){
      clearInterval(resendInterval);
      resendBtn.disabled = false;
      resendBtn.innerHTML = 'Reenviar código';
    }
  }, 1000);
}
resendBtn.addEventListener('click', () => {
  if(resendBtn.disabled) return;
  currentOtpCode = generateOtpCode();
  otpMsg.textContent = `✓ Código reenviado por WhatsApp (demo): ${currentOtpCode}`;
  otpError.classList.remove('show');
  resendBtn.innerHTML = 'Reenviar en <span id="resend-timer">30</span>s';
  startResendTimer();
});

/* Formulario rápido del hero: abre el mismo modal ya con el número cargado */
document.getElementById('hero-quick-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const val = e.target.querySelector('input').value.replace(/\D/g,'');
  openModal();
  phoneInput.value = val;
  nameInput.focus();
});

/* ==========================================================
   MODAL DE UBICACIÓN — sale ni bien entra el usuario, para
   recalcular al toque el envío de todos los restaurantes.
========================================================== */
const locBackdrop = document.getElementById('loc-backdrop');
const locDetectBtn = document.getElementById('loc-detect-btn');
const locSkipBtn = document.getElementById('loc-skip-btn');
const locCloseBtn = document.getElementById('loc-close');
const locStatus = document.getElementById('loc-status');

function refreshAllFeeDependentViews(){
  updateAllFees();
  renderRestaurantGrid();
  // si está viendo el menú de un restaurante, refresca su tarjeta de envío/distancia
  if(viewMenu.style.display !== 'none' && mvDishList.dataset.rid){
    openMenu(mvDishList.dataset.rid);
  }
  // si tiene el carrito abierto, refresca los totales
  if(cartBackdrop.classList.contains('open')) renderCart();
}

function openLocationModal(){ locBackdrop.classList.add('open'); locStatus.textContent = ''; }
function closeLocationModal(){ locBackdrop.classList.remove('open'); }

function detectLocation(){
  if(!navigator.geolocation){
    locStatus.textContent = 'Tu navegador no soporta geolocalización. Usaremos una ubicación aproximada.';
    return;
  }
  locDetectBtn.disabled = true;
  locDetectBtn.textContent = 'Detectando…';
  locStatus.textContent = 'Espera un momento, estamos ubicándote…';
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      customerLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      locationIsPrecise = true;
      refreshAllFeeDependentViews();
      locationLabel.textContent = 'Ubicación detectada ✓';
      locDetectBtn.disabled = false;
      locDetectBtn.textContent = 'Detectar con mi ubicación actual';
      locStatus.textContent = '¡Listo! Ya actualizamos el envío de todos los restaurantes.';
      setTimeout(closeLocationModal, 900);
    },
    (err) => {
      locDetectBtn.disabled = false;
      locDetectBtn.textContent = 'Detectar con mi ubicación actual';
      locStatus.textContent = 'No pudimos acceder a tu ubicación. Puedes darle permiso desde tu navegador o seguir con la ubicación aproximada.';
    },
    { enableHighAccuracy:true, timeout:10000 }
  );
}

locDetectBtn.addEventListener('click', detectLocation);
locSkipBtn.addEventListener('click', () => {
  refreshAllFeeDependentViews(); // ya se calculó con el centro de Pucallpa, solo confirmamos
  closeLocationModal();
});
locCloseBtn.addEventListener('click', closeLocationModal);
locBackdrop.addEventListener('click', (e) => { if(e.target === locBackdrop) closeLocationModal(); });

// Sale automáticamente ni bien entra a la app, para poder actualizar
// los precios de envío de todos los locales en ese momento.
setTimeout(openLocationModal, 500);
