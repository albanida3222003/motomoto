-- ==========================================================
-- MOTOMOTO — Esquema de Supabase para el panel de administrador
-- ----------------------------------------------------------
-- Cómo usarlo:
--   1. Entra a tu proyecto en https://supabase.com/dashboard
--   2. Ve a "SQL Editor" → "New query"
--   3. Pega TODO este archivo y dale "Run"
--   4. Luego crea tu usuario admin en Authentication → Users → Add user
--      (con el email y contraseña con los que vas a entrar al panel)
-- ==========================================================

-- Extensión necesaria para generar UUIDs
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------
-- RESTAURANTES
-- ----------------------------------------------------------
create table if not exists restaurants (
  id            text primary key,               -- slug, ej: 'burguesia'
  name          text not null,
  sub           text,                             -- ej: 'Hamburguesas • Papas Fritas'
  badge_type    text,                             -- 'off' | 'feat' | 'combo' | null
  badge_label   text,
  partner_type  text not null default 'externo' check (partner_type in ('socio','externo')),
  cats          text[] default '{}',              -- categorías: hamburguesas, sushi, etc.
  tags          text[] default '{}',
  rating        numeric(2,1) default 0,
  reviews       integer default 0,
  time_estimate text,                             -- ej: '25-35 min'
  min_order     text,                             -- ej: 'S/ 20'
  lat           double precision,
  lng           double precision,
  address       text,
  image         text,
  hours         jsonb default '{}'::jsonb,        -- {dom:{open,close}|null, lun:{...}, ...}
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ----------------------------------------------------------
-- PLATOS (dishes) — pertenecen a un restaurante
-- ----------------------------------------------------------
create table if not exists dishes (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  text not null references restaurants(id) on delete cascade,
  category       text,                            -- ej: 'Comidas', 'Bebidas'
  name           text not null,
  description    text,
  price          numeric(10,2) not null default 0,
  rating         numeric(2,1) default 0,
  reviews        integer default 0,
  image          text,
  options        jsonb default '[]'::jsonb,        -- grupos de opciones (elige tu sabor, etc.)
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_dishes_restaurant on dishes(restaurant_id);

-- ----------------------------------------------------------
-- PROMOCIONES (carrusel de banners)
-- ----------------------------------------------------------
create table if not exists promos (
  id          uuid primary key default gen_random_uuid(),
  badge       text,
  title       text not null,
  subtitle    text,
  description text,
  cta         text,
  image       text,
  gradient    text,
  sort_order  integer default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ----------------------------------------------------------
-- PEDIDOS
-- ----------------------------------------------------------
create table if not exists orders (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  customer_name  text,
  customer_phone text,
  items          jsonb not null default '[]'::jsonb,  -- [{rid,did,name,qty,price,restaurantName,selections}]
  subtotal       numeric(10,2) default 0,
  delivery_fee   numeric(10,2) default 0,
  tip            numeric(10,2) default 0,
  vip_fee        numeric(10,2) default 0,
  total          numeric(10,2) default 0,
  address        jsonb,                                -- {label,address,addressNote,reference}
  note           text,
  status         text not null default 'nuevo'
                 check (status in ('nuevo','confirmado','en_camino','entregado','cancelado'))
);

create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_created on orders(created_at desc);

-- ----------------------------------------------------------
-- updated_at automático
-- ----------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_restaurants_updated on restaurants;
create trigger trg_restaurants_updated before update on restaurants
  for each row execute function set_updated_at();

drop trigger if exists trg_dishes_updated on dishes;
create trigger trg_dishes_updated before update on dishes
  for each row execute function set_updated_at();

drop trigger if exists trg_promos_updated on promos;
create trigger trg_promos_updated before update on promos
  for each row execute function set_updated_at();

-- ----------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------
-- Por ahora el sitio de clientes (index.html) NO lee de Supabase todavía,
-- así que solo dejamos acceso a usuarios autenticados (el/los admin que
-- crees en Authentication → Users). Cuando migres el sitio de clientes,
-- puedes agregar políticas de lectura pública (select) para "anon".

alter table restaurants enable row level security;
alter table dishes      enable row level security;
alter table promos      enable row level security;
alter table orders      enable row level security;

-- Cualquier usuario autenticado (tu admin) puede hacer todo:
create policy "admin_all_restaurants" on restaurants
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin_all_dishes" on dishes
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin_all_promos" on promos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin_all_orders" on orders
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ==========================================================
-- Fin del esquema
-- ==========================================================
