# Moto Moto — Delivery (proyecto combinado)

Repo limpio, enfocado por ahora **solo en el panel de administración**,
conectado a Supabase. Cuando esto quede funcionando, se suma acá el resto
(panel de drivers y sitio cliente), combinándolo con el proyecto
`documentacion_pruebas`.

```
/admin/              ← Panel de administración — ✅ conectado a Supabase
/supabase/schema.sql ← Script SQL con las tablas, RLS y Realtime
```

## Por dónde empezar

Sigue [`admin/README.md`](admin/README.md): crea tu proyecto en Supabase,
corre `supabase/schema.sql`, crea tu usuario admin y pega tus credenciales
en `admin/js/supabase-config.js`. Ahí mismo están los pasos para probarlo
en local y publicarlo en GitHub Pages.
