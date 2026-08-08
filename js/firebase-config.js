// ============================================================
// CONFIGURACIÓN DE FIREBASE (sitio cliente)
// Debe ser EXACTAMENTE la misma configuración que /admin/js/firebase-config.js
// para que ambos sitios lean/escriban en el mismo proyecto de Firebase.
// Se carga como <script> normal (no módulo) para exponer `db`/`auth`
// globales, igual que en el panel admin.
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyCIipzomPKm_wOFNW9D98r746G-Cg2j2uQ",
  authDomain: "motomotoadmin.firebaseapp.com",
  projectId: "motomotoadmin",
  storageBucket: "motomotoadmin.firebasestorage.app",
  messagingSenderId: "616590024279",
  appId: "1:616590024279:web:c850985e5859d164304d12"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();

const COL = {
  LOCALES: "locales",
  MENUS: "menus",
  PEDIDOS: "pedidos",
  DRIVERS: "drivers",
  CONFIG: "config"
};

// Autenticación anónima: las reglas de Firestore del panel admin exigen
// `request.auth != null` para leer/escribir. El cliente no tiene cuenta,
// así que inicia sesión anónima (igual que hace driver.html) para poder
// leer los locales/menús y crear su pedido.
const motomotoAuthReady = auth.signInAnonymously()
  .catch(err => console.error('Auth anónima falló:', err));
