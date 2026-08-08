# Panel Delivery — Dashboard de administración (Supabase)

Dashboard para administrar locales, menús (con opciones obligatorias) y
pedidos de una plataforma de delivery. HTML + CSS + JS puro (sin frameworks
ni build step), conectado a **Supabase** (Auth + Postgres + Realtime), listo
para publicar en GitHub Pages.

> Este panel es el primer paso del proyecto combinado. Por ahora `driver.html`
> (panel de drivers) sigue con el código viejo de Firebase — lo migramos en
> el siguiente paso.

## 1. Crear el proyecto en Supabase

1. Ve a https://supabase.com/dashboard y crea un proyecto nuevo (elige una
   contraseña de base de datos y guárdala).
2. Cuando termine de aprovisionarse, ve a **SQL Editor → New query**, pega
   **todo** el contenido de [`../supabase/schema.sql`](../supabase/schema.sql)
   y dale a **Run**. Esto crea las tablas `locales`, `menus`, `pedidos`,
   `drivers`, activa Row Level Security y habilita Realtime.
3. Ve a **Authentication → Providers** y confirma que **Email** esté
   habilitado (viene así por defecto). En **Authentication → Settings**,
   puedes desactivar "Confirm email" si quieres poder crear tu usuario admin
   y entrar de inmediato sin verificar el correo.

## 2. Crear tu usuario administrador

En **Authentication → Users → Add user → Create new user**, ingresa el
correo y contraseña con los que vas a entrar en `index.html`. Marca
"Auto Confirm User" para no tener que verificar el correo.

## 3. Conectar el panel a tu proyecto

Ve a **Project Settings → API** y copia:
- **Project URL**
- **anon public key**

Pégalos en [`js/supabase-config.js`](js/supabase-config.js):

```js
const SUPABASE_URL = "https://tu-proyecto.supabase.co";
const SUPABASE_ANON_KEY = "tu-anon-key";
```

> La `anon key` es pública a propósito (va en el navegador de cualquiera).
> La seguridad real la dan las políticas RLS ya incluidas en `schema.sql`:
> solo un usuario **autenticado** (tu admin) puede leer/escribir datos.

## 4. Probar en local

Como el HTML llama directo al SDK de Supabase (sin `import`/`export`), puedes
abrir los archivos con doble clic, pero es mejor servirlos con un servidor
local para evitar restricciones del navegador:

```bash
cd admin
python3 -m http.server 8000
```

Abre `http://localhost:8000/` → deberías ver el login. Entra con el correo y
contraseña que creaste en el paso 2.

## 5. Publicar en GitHub Pages

1. Sube esta carpeta a un repositorio de GitHub (o el repo combinado
   completo, con `/admin` adentro).
2. **Settings → Pages → Source**: rama `main`, carpeta `/ (root)` (o `/admin`
   si el repo es solo para el panel).
3. Tu panel quedará en `https://tu-usuario.github.io/tu-repo/admin/`.
4. En Supabase, ve a **Authentication → URL Configuration** y agrega esa URL
   a **Site URL** / **Redirect URLs**.

## 6. Cómo está organizado

```
index.html              Login del administrador (correo + contraseña)
dashboard.html           Panel principal (Resumen, Locales, Menús, Pedidos, Drivers)
driver.html               ⚠️ Aún no migrado (sigue con Firebase, pendiente)
css/style.css            Estilos
js/supabase-config.js    Config de Supabase (¡edítalo primero!)
js/utils.js              Cálculo de distancia/envío, formato de moneda, toasts, etc.
js/app.js                Sesión (Supabase Auth) y navegación del admin
js/locales.js             CRUD de locales + horario + estado de atención
js/menus.js               CRUD de platos por local + grupos de opciones
js/pedidos.js             Constructor de pedidos, cálculo de envío, seguimiento
js/drivers.js             CRUD de drivers (lado admin)
```

## 7. Modelo de datos (Postgres / Supabase)

Ver el esquema completo y comentado en [`../supabase/schema.sql`](../supabase/schema.sql).
Resumen:

**`locales`**: `nombre, categoria, telefono, imagen, direccion, lat, lng,
envio_base, envio_por_km, horario (jsonb), forzar_estado`.
El estado "atendiendo ahora" se calcula combinando `horario` (según la hora
actual) con `forzar_estado`, que te permite pausar un local manualmente
aunque esté dentro de su horario.

**`menus`** (una fila por plato, con `local_id` apuntando a su local):
`nombre, precio, descripcion, imagen, disponible, grupos_opciones (jsonb)`.

```json
"grupos_opciones": [
  { "nombre": "Elige tu entrada", "tipo": "unica", "obligatorio": true, "min": 1, "max": 1,
    "opciones": [{ "nombre": "Yuca", "precioExtra": 0 }, { "nombre": "Tacacho", "precioExtra": 0 }] },
  { "nombre": "Sabores de alitas", "tipo": "multiple", "obligatorio": true, "min": 3, "max": 3,
    "opciones": [{ "nombre": "BBQ" }, { "nombre": "Picante" }, { "nombre": "Miel mostaza" }] }
]
```

**`pedidos`**: `cliente (jsonb), items (jsonb), locales_ids, locales_nombres,
subtotal, envio, envio_detalle (jsonb), total, estado, driver_id,
driver_nombre, seguimiento (jsonb)`. El envío se calcula sumando, por cada
local distinto presente en el pedido, `envio_base + envio_por_km × distancia`
(fórmula de Haversine).

**`drivers`**: `nombre, telefono, vehiculo, pin, estado`.

## 8. Nota de seguridad

El PIN del driver se guarda en texto plano en la tabla `drivers` para
mantener el flujo simple (teléfono + PIN de 4 dígitos) cuando migremos
`driver.html`. Cualquier usuario autenticado puede leer esa tabla hoy. Si
más adelante quieres subir el nivel de seguridad, lo ideal es mover la
validación del PIN a una Edge Function de Supabase.

## Próximo paso

Cuando confirmes que el panel admin funciona bien contra Supabase, seguimos
con: 1) migrar `driver.html` a Supabase, y 2) conectar el sitio cliente
(`motomoto`) a las mismas tablas, combinando ambos proyectos en un solo repo.
