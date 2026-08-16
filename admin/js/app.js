/* ==========================================================
   APP — navegación entre secciones + arranque de sesión
========================================================== */
const SECTIONS = {
  orders:      { title: 'Pedidos', render: renderOrdersSection },
  restaurants: { title: 'Restaurantes', render: renderRestaurantsSection },
  dishes:      { title: 'Platos', render: renderDishesSection },
  promos:      { title: 'Promociones', render: renderPromosSection },
};

let currentSection = 'orders';

function goToSection(key){
  if(!SECTIONS[key]) return;
  currentSection = key;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.section === key));
  document.getElementById('section-title').textContent = SECTIONS[key].title;
  document.querySelector('.sidebar').classList.remove('open');
  SECTIONS[key].render();
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => goToSection(btn.dataset.section));
});

document.getElementById('mobile-nav-toggle').addEventListener('click', () => {
  document.querySelector('.sidebar').classList.toggle('open');
});

// ---------- sesión ----------
sb.auth.onAuthStateChange((event, session) => {
  if(session){
    showAppShell(session);
    goToSection(currentSection);
  } else {
    showLoginScreen();
  }
});

(async () => {
  const { data: { session } } = await sb.auth.getSession();
  if(session){
    showAppShell(session);
    goToSection(currentSection);
  } else {
    showLoginScreen();
  }
})();
