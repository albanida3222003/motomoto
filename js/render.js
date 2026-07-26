/* ==========================================================
   RENDERIZADO: CATEGORÍAS, PROMOCIONES, RESTAURANTES Y MENÚ
   ========================================================== */
import { state } from './state.js';
import { categories, promotions, restaurants } from './data.js';
import { shippingFor } from './distance.js';
import { addToCart } from './cart.js';

export function renderCategories() {
  const container = document.getElementById('categoriesContainer');
  if (!container) return;
  container.innerHTML = '';

  categories.forEach(cat => {
    const item = document.createElement('div');
    item.className = `cat-item ${cat.id === state.selectedCategory ? 'active' : ''}`;
    item.addEventListener('click', () => filterByCategory(cat.id));
    item.innerHTML = `
      <div class="cat-icon-box">${cat.icon}</div>
      <div class="cat-label">${cat.name}</div>
    `;
    container.appendChild(item);
  });
}

export function filterByCategory(catId) {
  state.selectedCategory = catId;
  renderCategories();
  renderRestaurants();
}

export function renderPromotions() {
  const container = document.getElementById('promosCarousel');
  if (!container) return;
  container.innerHTML = '';

  promotions.forEach(p => {
    const card = document.createElement('div');
    card.className = 'promo-card';
    card.addEventListener('click', () => {
      if (p.restaurantId) openMenu(p.restaurantId);
    });
    card.innerHTML = `<img src="${p.img}" alt="Promoción">`;
    container.appendChild(card);
  });
}

export function scrollPromos(direction) {
  const container = document.getElementById('promosCarousel');
  if (!container) return;
  const scrollAmount = 300;
  container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
}

export function renderRestaurants() {
  const q = (document.getElementById('searchInput').value || '').toLowerCase().trim();
  const grid = document.getElementById('restaurantsGrid');
  grid.innerHTML = '';

  const filtered = restaurants.filter(r => {
    const matchCategory = (state.selectedCategory === 'all' || r.category === state.selectedCategory);
    const matchRest = r.name.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q);
    const matchMenu = r.menu.some(m =>
      m.name.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q)
    );
    const matchQuery = !q || matchRest || matchMenu;
    return matchCategory && matchQuery;
  });

  if (filtered.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:30px; color:#8a7256;">No se encontraron restaurantes o platillos que coincidan.</div>';
    return;
  }

  filtered.forEach(r => {
    const km = state.distanceCache[r.id];
    const ship = shippingFor(r.id);
    const card = document.createElement('div');
    card.className = 'rest-card';
    card.addEventListener('click', () => openMenu(r.id));
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

export function openMenu(id) {
  const servSec = document.querySelector('.services-section');
  const promoSec = document.querySelector('.promos-section');
  if (servSec) servSec.style.display = 'none';
  if (promoSec) promoSec.style.display = 'none';

  state.currentRestaurantId = id;
  const r = restaurants.find(x => x.id === id);
  document.getElementById('restaurantsSection').style.display = 'none';
  const catSec = document.querySelector('.categories-section');
  if (catSec) catSec.style.display = 'none';

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
      <button class="add-btn">Agregar</button>`;
    el.querySelector('.add-btn').addEventListener('click', () => addToCart(r.id, m.id));
    list.appendChild(el);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function showRestaurants() {
  const servSec = document.querySelector('.services-section');
  const promoSec = document.querySelector('.promos-section');
  if (servSec) servSec.style.display = 'block';
  if (promoSec) promoSec.style.display = 'block';

  document.getElementById('menuSection').style.display = 'none';
  const catSec = document.querySelector('.categories-section');
  if (catSec) catSec.style.display = 'block';
  document.getElementById('restaurantsSection').style.display = 'block';
}
