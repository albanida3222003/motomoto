# Panel de administrador — MotoMoto

Dashboard estático (HTML/CSS/JS puro, sin build step) para gestionar **restaurantes, platos, promociones y pedidos** desde Supabase. Vive en `/admin` junto al sitio de clientes, pero es independiente: el `index.html` de clientes no lo usa (por ahora sigue con sus datos de ejemplo en `js/data/`).

## 1. Crear el proyecto en Supabase

1. Entra a [supabase.com/dashboard](https://supabase.com/dashboard) y crea un proyecto (gratis).
2. Ve a **SQL Editor** → *New query*, pega el contenido completo de `supabase/schema.sql` (en la raíz del proyecto) y dale **Run**. Esto crea las tablas `restaurants`, `dishes`, `promos`, `orders` y sus políticas de seguridad (RLS).
3. Ve a **Authentication → Users → Add user** y crea tu usuario administrador (email + contraseña). Con eso entras al panel — no hay registro público, solo tú puedes crear cuentas desde ahí.

## 2. Conectar el panel a tu proyecto

Edita `admin/js/config.js` y reemplaza:

```js
const SUPABASE_URL = 'https://TU-PROYECTO.supabase.co';
const SUPABASE_ANON_KEY = 'TU-ANON-KEY-AQUI';
```

Ambos valores están en tu proyecto de Supabase, en **Project Settings → API**. La "anon key" es pública por diseño (el acceso real lo controla RLS), así que es seguro subirla al repo.

## 3. Publicarlo en GitHub Pages

Como ya subes todo el proyecto `motomoto/` a GitHub Pages, el panel queda disponible automáticamente en:

```
https://<tu-usuario>.github.io/<tu-repo>/admin/
```

No hace falta ninguna configuración extra: `.nojekyll` en la raíz ya cubre esta subcarpeta.

⚠️ El HTML no aparece en buscadores (`<meta name="robots" content="noindex, nofollow">` y `robots.txt` ya lo bloquean), pero **no es privado**: cualquiera que sepa la URL puede ver la pantalla de login. La protección real es que solo tu cuenta puede iniciar sesión y que las tablas exigen `authenticated` para leer o escribir (ver `supabase/schema.sql`).

## 4. Uso del panel

- **Pedidos**: lista todos los pedidos, permite ver el detalle completo (platos, dirección, nota) y cambiar el estado (nuevo → confirmado → en camino → entregado / cancelado).
- **Restaurantes**: alta, edición y borrado. El horario se edita como JSON (mismo formato que `js/data/restaurants.js`: `dom`, `lun`, `mar`… con `{open, close}` o `null` si cierra ese día).
- **Platos**: igual, ligados a un restaurante. Las opciones (ej. "elige tu sabor") se editan como JSON, mismo formato que usa `dish-options.js` en el sitio de clientes.
- **Promociones**: gestiona el carrusel de banners de la home.

## 5. Cuando quieras migrar el sitio de clientes a Supabase

Hoy `index.html` sigue leyendo de `js/data/restaurants.js` y `js/data/promos.js`, y los pedidos se guardan en `localStorage` (ver `order-history.js`). Cuando quieras que el sitio público lea de Supabase en vez de esos archivos:

1. Agrega políticas de **lectura pública** (`for select using (active = true)` para el rol `anon`) en `restaurants`, `dishes` y `promos`.
2. Reemplaza el arreglo `const restaurants = [...]` por una consulta `await sb.from('restaurants').select('*, dishes(*)')`.
3. Decide si los pedidos del checkout por WhatsApp también deben insertarse en la tabla `orders` (para que aparezcan en este panel) — hoy solo quedan en WhatsApp y en el `localStorage` del cliente.

Esto no está incluido todavía porque se pidió explícitamente dejar el sitio de clientes como está por ahora.
