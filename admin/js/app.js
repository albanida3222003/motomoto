// ============================================================
// NÚCLEO DE LA APP: autenticación, navegación, modales
// ============================================================

let CURRENT_USER = null;

async function protegerSesion() {
  const { data } = await sb.auth.getSession();
  if (!data.session) {
    window.location.href = "index.html";
    return;
  }
  CURRENT_USER = data.session.user;
  document.getElementById("who-email").textContent = CURRENT_USER.email;
  iniciarApp();
}
protegerSesion();

// Si la sesión se cierra en otra pestaña (o expira), regresa al login
sb.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT" || !session) {
    window.location.href = "index.html";
  }
});

document.getElementById("btn-logout").addEventListener("click", () => sb.auth.signOut());

document.getElementById("btn-toggle-sidebar").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});
if (window.innerWidth <= 860) document.getElementById("btn-toggle-sidebar").style.display = "inline-flex";

const VIEW_TITLES = {
  resumen: ["Resumen", "Estado general de la operación"],
  locales: ["Locales", "Restaurantes y tiendas activas en la plataforma"],
  menus: ["Menús", "Platos, precios y opciones por local"],
  pedidos: ["Pedidos", "Todos los pedidos de tus clientes"],
  drivers: ["Drivers", "Conductores encargados de las entregas"]
};

document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => cambiarVista(btn.dataset.view));
});

function cambiarVista(view) {
  document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.view === view));
  document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === "view-" + view));
  document.getElementById("view-title").textContent = VIEW_TITLES[view][0];
  document.getElementById("view-sub").textContent = VIEW_TITLES[view][1];
  document.getElementById("sidebar").classList.remove("open");
}

// Cierre genérico de modales
document.querySelectorAll("[data-close]").forEach(btn => {
  btn.addEventListener("click", () => cerrarModal(btn.dataset.close));
});
document.querySelectorAll(".modal-overlay").forEach(ov => {
  ov.addEventListener("click", (e) => { if (e.target === ov) cerrarModal(ov.id); });
});
function abrirModal(id) { document.getElementById(id).classList.add("open"); }
function cerrarModal(id) { document.getElementById(id).classList.remove("open"); }

function iniciarApp() {
  document.getElementById("driver-link").textContent = window.location.origin + window.location.pathname.replace("dashboard.html", "driver.html");
  initLocales();
  initMenus();
  initPedidos();
  initDrivers();
}
