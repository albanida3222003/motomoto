# SaborPucallpa (MotoMoto) — Delivery

Prototipo de delivery hecho con **HTML + CSS + JavaScript puro** (sin frameworks, sin build tools).

## Estructura del proyecto

```
motomoto/
├── index.html
├── css/
│   ├── variables.css        # Reset, tipografía base y variables de color
│   ├── header.css           # Header, marca, botón carrito, banner de ubicación
│   ├── hero.css              # Sección hero + buscador
│   ├── categories.css        # Carrusel "¿Qué se te antoja?"
│   ├── services-promos.css   # Banner de servicios + carrusel de promociones
│   ├── restaurants.css       # Grilla de restaurantes + menú
│   ├── cart-checkout.css     # Toast, carrito lateral, modales de checkout
│   ├── map-modal.css         # Modal del mapa interactivo (Leaflet)
│   └── responsive.css        # Media queries (se carga al final)
└── js/
    ├── config.js         # Constantes: precios de envío, WhatsApp, etc.
    ├── data.js           # "Base de datos" simulada (restaurantes, categorías, promos)
    ├── state.js          # Estado global compartido de la app
    ├── utils.js          # Helpers (toast, redondeo, formato de moneda)
    ├── distance.js       # Cálculo de distancia y costo de envío
    ├── geolocation.js    # GPS del usuario + banner de ubicación
    ├── map.js            # Selector de ubicación en mapa (Leaflet)
    ├── render.js         # Pintado de categorías, promos, restaurantes y menú
    ├── cart.js           # Lógica del carrito
    ├── checkout.js       # Checkout y armado del mensaje de WhatsApp
    └── main.js           # Punto de entrada: conecta eventos e inicializa todo
```

## ⚠️ Cómo ejecutar el proyecto (importante)

Como el JS ahora usa **módulos ES6** (`import`/`export`), **no puedes abrir
`index.html` haciendo doble clic** — los navegadores bloquean módulos cargados
con `file://` por seguridad (CORS). Necesitas un servidor local, cualquiera de estos sirve:

**Opción 1 — VS Code (más fácil):**
Instala la extensión "Live Server" → clic derecho en `index.html` → "Open with Live Server".

**Opción 2 — Python (si lo tienes instalado):**
```bash
cd motomoto
python3 -m http.server 8000
```
Luego abre `http://localhost:8000` en el navegador.

**Opción 3 — Node.js:**
```bash
npx serve motomoto
```

## Qué cambió respecto a la versión original

1. **Separación en módulos**: antes todo vivía en un `app.js` de 770 líneas y
   un `styles.css` de 1095 líneas. Ahora cada archivo tiene una responsabilidad
   clara (datos, estado, carrito, checkout, mapa, etc.), lo que hace mucho más
   fácil encontrar y modificar cosas sin romper otras partes.
2. **Sin `onclick` inline en el HTML**: todos los eventos se conectan con
   `addEventListener` desde `main.js` (para elementos fijos) o directamente en
   el JS que genera cada elemento dinámico (tarjetas de restaurante, ítems del
   carrito, etc.).
3. **Bug corregido**: el modal del selector de mapa (`#mapModal`) tenía la
   clase CSS `modal` en vez de `modal-back`, así que la regla `.modal-back.open
   { display:flex }` nunca se aplicaba y el mapa no se mostraba/ocultaba
   correctamente. Ahora usa la misma estructura que los demás modales.
4. **Estado centralizado**: variables que antes eran globales sueltas
   (`cart`, `userLocation`, `distanceCache`, etc.) ahora viven en un solo
   objeto `state` (`js/state.js`), importado donde se necesita.
5. **Misma funcionalidad, mismo diseño**: no se cambió ningún estilo visual
   ni comportamiento — es la misma app, solo mejor organizada.

## Configuración rápida

Edita `js/config.js` para cambiar:
- El número de WhatsApp del negocio (`MY_WHATSAPP_PHONE`)
- El costo base/por km del envío (`SHIPPING`)
- El modo de cálculo de distancia (`DISTANCE_MODE`: `'haversine'` o `'road'`
  con Google Maps API)

Edita `js/data.js` para agregar/quitar restaurantes, categorías o promociones.
