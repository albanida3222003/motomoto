# Moto Moto — Delivery (proyecto combinado)

Este repo va a unir, paso a paso, el sitio cliente y el panel de
administración en **un solo sitio**, todo conectado a **Supabase**
(no Firebase) y publicado en GitHub Pages.

## Estado actual

- ✅ **Paso 1 — Panel admin (`/admin`)**: migrado a Supabase (Auth por
  correo/contraseña + Postgres + Realtime). Ver
  [`admin/README.md`](admin/README.md) para configurarlo.
- ⏳ **Paso 2 — Panel de drivers (`/admin/driver.html`)**: todavía usa el
  código viejo de Firebase, pendiente de migrar.
- ⏳ **Paso 3 — Sitio cliente (`/`, lo que ve el comprador)**: todavía usa
  datos de ejemplo / Firebase, pendiente de conectar a las mismas tablas
  de Supabase que ya usa el panel admin.

```
/                    ← Sitio cliente (motomoto) — pendiente de migrar
/admin/              ← Panel de administración — ✅ ya en Supabase
/supabase/schema.sql ← Script SQL con las tablas, RLS y Realtime
```

## Por dónde empezar

1. Sigue [`admin/README.md`](admin/README.md): crea tu proyecto en
   Supabase, corre `supabase/schema.sql`, crea tu usuario admin y pega tus
   credenciales en `admin/js/supabase-config.js`.
2. Corre un servidor local y prueba el login y el CRUD de locales, menús,
   pedidos y drivers.
3. Cuando confirmes que todo funciona, seguimos con el panel de drivers y
   después con el sitio cliente.
