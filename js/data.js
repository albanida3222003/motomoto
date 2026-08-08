/* ==========================================================
   DATOS DE LA APP — AHORA VIENEN DE FIRESTORE (mismo backend que
   usa el panel de administración en /admin).
   Antes este archivo tenía arrays fijos (restaurantes de prueba).
   Ahora son arrays que se actualizan en vivo: se escuchan los
   `locales` (y el menú de cada uno, subcolección `menus`) con
   onSnapshot y, cada vez que cambia algo en Firestore, estos
   mismos arrays se actualizan "in place" y se notifica a quien
   se haya suscrito con `initData(callback)`.

   Como son exports de un array (misma referencia, se muta con
   splice/push), el resto de módulos que hacen
   `import { restaurants } from './data.js'` siempre ven los
   datos más recientes sin tener que volver a importar nada.
   ========================================================== */

export const categories = [{ id: 'all', name: 'Todos', icon: '🍽️' }];
export const promotions = [];
export const restaurants = [];

// true en cuanto llega la primera respuesta de Firestore (aunque esté
// vacía), para poder distinguir "cargando" de "no hay restaurantes".
export let dataLoaded = false;

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600';

const CATEGORY_ICONS = {
  amazonica: '🍃',
  marino: '🐙',
  marinos: '🐙',
  broster: '🍗',
  polleria: '🐔',
  pollo: '🐔',
  bebidas: '🧃',
  carnes: '🥩',
  parrilla: '🔥',
  postres: '🍰',
  pizza: '🍕',
  china: '🥡',
  chifa: '🥡',
  cafe: '☕',
  desayunos: '🥞'
};

function normalize(str) {
  return (str || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function slugify(str) {
  return normalize(str).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'otros';
}

function iconFor(categoryLabel) {
  return CATEGORY_ICONS[normalize(categoryLabel)] || '🍴';
}

/** Misma lógica que /admin/js/utils.js -> estaAtendiendo(local) */
const DIAS_SEMANA = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

function estaAtendiendo(raw) {
  if (!raw) return true;
  if (raw.forzarEstado === 'cerrado') return false;
  if (raw.forzarEstado === 'abierto') return true;

  const horario = raw.horario || {};
  const ahora = new Date();
  const diaKey = DIAS_SEMANA[(ahora.getDay() + 6) % 7];
  const dia = horario[diaKey];
  if (!dia || dia.cerrado) return false;
  if (!dia.abre || !dia.cierra) return false;

  const [hA, mA] = dia.abre.split(':').map(Number);
  const [hC, mC] = dia.cierra.split(':').map(Number);
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
  const minA = hA * 60 + mA;
  const minC = hC * 60 + mC;

  if (minC > minA) return minutosAhora >= minA && minutosAhora <= minC;
  return minutosAhora >= minA || minutosAhora <= minC; // horario que cruza medianoche
}

const localesRaw = new Map();  // id -> restaurant object (con .menu ya resuelto)
const menuUnsubs = new Map();  // id -> función para cancelar el listener del menú
let onUpdateCallback = null;

function mapLocalDoc(doc) {
  const d = doc.data();
  const categoryLabel = (d.categoria || '').trim() || 'Otros';
  const prev = localesRaw.get(doc.id);
  return {
    id: doc.id,
    name: d.nombre || 'Sin nombre',
    category: slugify(categoryLabel),
    categoryLabel,
    desc: categoryLabel,
    phone: (d.telefono || '').toString().replace(/\D/g, ''),
    img: d.imagen || FALLBACK_IMG,
    lat: d.ubicacion?.lat,
    lng: d.ubicacion?.lng,
    direccion: d.ubicacion?.direccion || '',
    envioBase: Number(d.envioBase) || 0,
    envioPorKm: Number(d.envioPorKm) || 0,
    atendiendo: estaAtendiendo(d),
    menu: prev ? prev.menu : [],      // se conserva mientras llega el listener del menú
    _raw: { horario: d.horario, forzarEstado: d.forzarEstado }
  };
}

function mapMenuDoc(doc) {
  const d = doc.data();
  return {
    id: doc.id,
    name: d.nombre || 'Sin nombre',
    desc: d.descripcion || '',
    price: Number(d.precio) || 0,
    img: d.imagen || FALLBACK_IMG,
    disponible: d.disponible !== false,
    gruposOpciones: d.gruposOpciones || []
  };
}

function rebuildDerivedLists() {
  const cats = new Map();
  restaurants.forEach(r => {
    if (!cats.has(r.category)) cats.set(r.category, { id: r.category, name: r.categoryLabel, icon: iconFor(r.categoryLabel) });
  });
  categories.splice(1, categories.length - 1, ...cats.values());

  const promoSource = restaurants.filter(r => r.img);
  promotions.splice(0, promotions.length, ...promoSource.slice(0, 4).map((r, i) => ({ id: 'p' + i, img: r.img, restaurantId: r.id })));
}

function rebuildAndNotify() {
  const list = [...localesRaw.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  restaurants.splice(0, restaurants.length, ...list);
  rebuildDerivedLists();
  dataLoaded = true;
  if (onUpdateCallback) onUpdateCallback();
}

function handleLocalesSnapshot(snap) {
  const currentIds = new Set(snap.docs.map(d => d.id));

  // Locales eliminados: cancelar su listener de menú y quitarlos del caché.
  for (const id of [...localesRaw.keys()]) {
    if (!currentIds.has(id)) {
      if (menuUnsubs.has(id)) { menuUnsubs.get(id)(); menuUnsubs.delete(id); }
      localesRaw.delete(id);
    }
  }

  snap.docs.forEach(doc => {
    localesRaw.set(doc.id, mapLocalDoc(doc));

    if (!menuUnsubs.has(doc.id)) {
      const unsub = db.collection(COL.LOCALES).doc(doc.id).collection(COL.MENUS).orderBy('nombre')
        .onSnapshot(msnap => {
          const menu = msnap.docs.map(mapMenuDoc).filter(m => m.disponible);
          const r = localesRaw.get(doc.id);
          if (r) { r.menu = menu; rebuildAndNotify(); }
        }, err => console.error('Error cargando menú de', doc.id, err));
      menuUnsubs.set(doc.id, unsub);
    }
  });

  rebuildAndNotify();
}

/**
 * Arranca los listeners en tiempo real de Firestore. `onUpdate` se llama
 * cada vez que cambian los locales o el menú de cualquiera de ellos.
 */
export function initData(onUpdate) {
  onUpdateCallback = onUpdate;
  motomotoAuthReady.then(() => {
    db.collection(COL.LOCALES).orderBy('nombre').onSnapshot(handleLocalesSnapshot, err => {
      console.error('Error cargando locales:', err);
      dataLoaded = true;
      if (onUpdateCallback) onUpdateCallback();
    });
  });

  // El estado "atendiendo ahora" depende de la hora actual, así que se
  // refresca solo cada minuto (igual que en el panel admin).
  setInterval(() => {
    let changed = false;
    restaurants.forEach(r => {
      const nowOpen = estaAtendiendo(r._raw);
      if (nowOpen !== r.atendiendo) { r.atendiendo = nowOpen; changed = true; }
    });
    if (changed && onUpdateCallback) onUpdateCallback();
  }, 60000);
}
