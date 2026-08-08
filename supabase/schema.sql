-- ============================================================
-- MOTO MOTO — Esquema de base de datos para Supabase (Postgres)
-- ============================================================
-- Cómo usarlo:
-- 1) Ve a tu proyecto en https://supabase.com/dashboard
-- 2) Abre "SQL Editor" → "New query"
-- 3) Pega TODO este archivo y dale a "Run"
--
-- Este esquema reproduce, en tablas de Postgres, la misma forma
-- de datos que ya usaba el panel (antes en Firestore), para que
-- el JS del dashboard cambie lo mínimo posible. Los campos
-- anidados (horario, opciones, items de un pedido, etc.) se
-- guardan como JSONB en vez de sub-colecciones.
-- ============================================================

-- Necesario para poder usar gen_random_uuid()
create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- LOCALES
-- ------------------------------------------------------------
create table if not exists locales (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria text,
  telefono text,
  imagen text,
  direccion text,
  lat double precision,
  lng double precision,
  envio_base numeric(10,2) default 0,
  envio_por_km numeric(10,2) default 0,
  -- horario: { lunes: {abre, cierra, cerrado}, martes: {...}, ... }
  horario jsonb default '{}'::jsonb,
  forzar_estado text default 'auto', -- 'auto' | 'abierto' | 'cerrado'
  creado_en timestamptz default now(),
  actualizado_en timestamptz default now()
);

-- ------------------------------------------------------------
-- MENÚS (platos de cada local)
-- ------------------------------------------------------------
create table if not exists menus (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references locales(id) on delete cascade,
  nombre text not null,
  precio numeric(10,2) not null default 0,
  descripcion text,
  imagen text,
  disponible boolean default true,
  -- grupos_opciones: [{ id, nombre, tipo, obligatorio, min, max,
  --                      opciones: [{nombre, precioExtra}] }]
  grupos_opciones jsonb default '[]'::jsonb,
  creado_en timestamptz default now(),
  actualizado_en timestamptz default now()
);
create index if not exists idx_menus_local on menus(local_id);

-- ------------------------------------------------------------
-- DRIVERS
-- ------------------------------------------------------------
create table if not exists drivers (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text,
  vehiculo text,
  pin text,           -- PIN de 4 dígitos (login simple del driver)
  estado text default 'disponible', -- 'disponible' | 'ocupado' | 'offline'
  creado_en timestamptz default now()
);

-- ------------------------------------------------------------
-- PEDIDOS
-- ------------------------------------------------------------
create table if not exists pedidos (
  id uuid primary key default gen_random_uuid(),
  -- cliente: { nombre, telefono, direccion, lat, lng }
  cliente jsonb not null,
  -- items: [{ localId, localNombre, menuId, nombre, imagen,
  --           cantidad, precioUnitario, opciones, subtotalItem }]
  items jsonb not null default '[]'::jsonb,
  locales_ids text[] default '{}',
  locales_nombres text[] default '{}',
  subtotal numeric(10,2) default 0,
  envio numeric(10,2) default 0,
  -- envio_detalle: [{ localId, nombre, km, costo }]
  envio_detalle jsonb default '[]'::jsonb,
  total numeric(10,2) default 0,
  estado text default 'pendiente', -- pendiente|confirmado|en_camino|entregado|cancelado
  driver_id uuid references drivers(id) on delete set null,
  driver_nombre text,
  -- seguimiento: { llegadaLocal, recogioProducto, llegadaUbicacion, entregado } (timestamps o null)
  seguimiento jsonb default '{"llegadaLocal":null,"recogioProducto":null,"llegadaUbicacion":null,"entregado":null}'::jsonb,
  creado_en timestamptz default now()
);
create index if not exists idx_pedidos_estado on pedidos(estado);
create index if not exists idx_pedidos_creado on pedidos(creado_en desc);

-- ------------------------------------------------------------
-- SEGURIDAD (Row Level Security)
-- Por ahora: cualquier usuario AUTENTICADO (admin con correo, o
-- futuro driver anónimo) puede leer y escribir. Es el mismo nivel
-- de seguridad que tenías en las reglas de Firestore. Cuando
-- agreguemos el panel del driver podemos afinar esto por rol.
-- ------------------------------------------------------------
alter table locales enable row level security;
alter table menus enable row level security;
alter table drivers enable row level security;
alter table pedidos enable row level security;

create policy "locales_all_auth" on locales
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "menus_all_auth" on menus
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "drivers_all_auth" on drivers
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "pedidos_all_auth" on pedidos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ------------------------------------------------------------
-- REALTIME
-- Habilita que el panel reciba cambios en vivo (como onSnapshot
-- de Firestore) para estas 4 tablas.
-- ------------------------------------------------------------
alter publication supabase_realtime add table locales;
alter publication supabase_realtime add table menus;
alter publication supabase_realtime add table drivers;
alter publication supabase_realtime add table pedidos;
