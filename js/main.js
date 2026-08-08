/* ==========================================================
   PUNTO DE ENTRADA DE LA APP
   Conecta los eventos del DOM con las funciones de cada módulo
   y arranca el renderizado inicial. Los restaurantes/menús ya no
   son datos fijos: se cargan (y se actualizan en vivo) desde
   Firestore vía initData() en data.js.
   ========================================================== */
import { renderCategories, renderPromotions, renderRestaurants, scrollPromos, showRestaurants } from './render.js';
import { updateCartTotals, openCart, closeCart } from './cart.js';
import { requestLocation } from './geolocation.js';
import { openCheckout, closeCheckout, confirmOrder, finishOrder } from './checkout.js';
import { openMapPicker, closeMapModal, confirmMapLocation } from './map.js';
import { openItemOptions, closeItemOptions, confirmItemOptions } from './options.js';
import { showToast } from './utils.js';
import { initThemeToggle } from './theme.js';
import { initData } from './data.js';
import { recomputeAllDistances } from './distance.js';

function bindStaticEvents() {
  document.getElementById('cartOpenBtn').addEventListener('click', openCart);
  document.getElementById('searchInput').addEventListener('input', renderRestaurants);
  document.getElementById('backToRestaurantsBtn').addEventListener('click', showRestaurants);
  document.getElementById('heroCtaBtn').addEventListener('click', () => {
    document.getElementById('restaurantsSection').scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('overlay').addEventListener('click', closeCart);
  document.getElementById('cartCloseBtn').addEventListener('click', closeCart);
  document.getElementById('checkoutBtn').addEventListener('click', openCheckout);

  document.getElementById('geoBtn').addEventListener('click', () => requestLocation(true));
  document.getElementById('checkoutCancelBtn').addEventListener('click', closeCheckout);
  document.getElementById('checkoutConfirmBtn').addEventListener('click', confirmOrder);
  document.getElementById('confirmFinishBtn').addEventListener('click', finishOrder);

  document.getElementById('mapConfirmBtn').addEventListener('click', confirmMapLocation);
  document.getElementById('mapCancelBtn').addEventListener('click', closeMapModal);

  document.getElementById('promosPrevBtn').addEventListener('click', () => scrollPromos(-1));
  document.getElementById('promosNextBtn').addEventListener('click', () => scrollPromos(1));

  document.getElementById('optCancelBtn').addEventListener('click', closeItemOptions);
  document.getElementById('optConfirmBtn').addEventListener('click', confirmItemOptions);

  document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('click', () => showToast(card.dataset.serviceLabel));
  });
}

// Se llama cada vez que llegan datos nuevos/actualizados desde Firestore.
async function onDataUpdate() {
  await recomputeAllDistances();
  renderCategories();
  renderPromotions();
  renderRestaurants();
  updateCartTotals();
}

function init() {
  initThemeToggle();
  bindStaticEvents();
  renderCategories();
  renderPromotions();
  renderRestaurants();
  updateCartTotals();
  requestLocation(false);
  initData(onDataUpdate);
}

init();
