-- ==========================================================
-- MOTOMOTO — Datos de prueba (seed)
-- ----------------------------------------------------------
-- Cómo usarlo:
--   1. Corre PRIMERO supabase/schema.sql (crea las tablas).
--   2. Luego pega TODO este archivo en el SQL Editor y dale "Run".
--   3. Entra al panel (/admin) y deberías ver 4 restaurantes con
--      sus platos, 3 promociones y 3 pedidos de ejemplo en distintos
--      estados. Bórralos cuando quieras: son solo para probar.
--
--   Este script es seguro de re-ejecutar: primero borra los datos
--   de prueba (por id conocido) antes de volver a insertarlos.
-- ==========================================================

-- limpieza de una corrida anterior de este mismo seed
delete from dishes where restaurant_id in ('burguesia','sakura','napoli','gallo');
delete from orders where customer_phone in ('+51 961 234 567','+51 987 654 321','+51 945 111 222');
delete from promos where title in ('Pizza Italiana','Sushi Bar','Pollo a la Brasa');
delete from restaurants where id in ('burguesia','sakura','napoli','gallo');

-- ----------------------------------------------------------
-- RESTAURANTES
-- ----------------------------------------------------------
insert into restaurants (id, name, sub, badge_type, badge_label, partner_type, cats, tags, rating, reviews, time_estimate, min_order, lat, lng, address, image, hours, active) values
('burguesia', 'La Burguesía', 'Hamburguesas • Papas Fritas', 'off', '20% OFF', 'socio',
  array['hamburguesas','bebidas'], array['Favorito del barrio','Nuevo'], 4.8, 342, '25-35 min', 'S/ 20',
  -8.3791, -74.5539, 'Jr. Tarapacá, cerca a la Plaza de Armas',
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=75&auto=format&fit=crop',
  '{"dom":{"open":"12:00","close":"22:00"},"lun":{"open":"12:00","close":"22:00"},"mar":{"open":"12:00","close":"22:00"},"mie":{"open":"12:00","close":"22:00"},"jue":{"open":"12:00","close":"22:00"},"vie":{"open":"12:00","close":"23:30"},"sab":{"open":"12:00","close":"23:30"}}'::jsonb,
  true),
('sakura', 'Sakura Sushi Bar', 'Sushi • Japonesa', 'feat', 'Muy pedido', 'socio',
  array['sushi','bebidas'], array['Top rated'], 4.9, 518, '30-45 min', 'S/ 35',
  -8.3819, -74.5468, 'Malecón Grau, frente al río Ucayali',
  'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=500&q=75&auto=format&fit=crop',
  '{"dom":null,"lun":null,"mar":{"open":"18:00","close":"23:00"},"mie":{"open":"18:00","close":"23:00"},"jue":{"open":"18:00","close":"23:00"},"vie":{"open":"18:00","close":"23:59"},"sab":{"open":"13:00","close":"23:59"}}'::jsonb,
  true),
('napoli', 'Bella Napoli', 'Pizzas • Italiana', 'combo', '2×1 martes', 'externo',
  array['pizzas','postres','bebidas'], array['Artesanal'], 4.6, 289, '20-30 min', 'S/ 25',
  -8.3690, -74.5570, 'Av. Centenario, San Fernando',
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=75&auto=format&fit=crop',
  '{"dom":{"open":"17:00","close":"22:30"},"lun":null,"mar":{"open":"17:00","close":"22:30"},"mie":{"open":"17:00","close":"22:30"},"jue":{"open":"17:00","close":"22:30"},"vie":{"open":"17:00","close":"23:30"},"sab":{"open":"17:00","close":"23:30"}}'::jsonb,
  true),
('gallo', 'Pollería El Gallo', 'Pollo a la Brasa • Criolla', 'feat', 'Destacado', 'socio',
  array['pollo','bebidas'], array['Clásico limeño'], 4.7, 631, '35-50 min', 'S/ 30',
  -8.3540, -74.5732, 'Av. Yarinacocha, Puerto Callao',
  'https://images.unsplash.com/photo-1562967914-608f82629710?w=500&q=75&auto=format&fit=crop',
  '{"dom":{"open":"11:00","close":"21:00"},"lun":{"open":"11:00","close":"21:00"},"mar":{"open":"11:00","close":"21:00"},"mie":{"open":"11:00","close":"21:00"},"jue":{"open":"11:00","close":"21:00"},"vie":{"open":"11:00","close":"22:00"},"sab":{"open":"11:00","close":"22:00"}}'::jsonb,
  true);

-- ----------------------------------------------------------
-- PLATOS
-- ----------------------------------------------------------
insert into dishes (restaurant_id, category, name, description, price, rating, reviews, image, options, active) values
-- La Burguesía
('burguesia','Comidas','Clásica MotoMoto','Carne, queso cheddar, lechuga y salsa especial.',18.90,4.5,9,
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=70&auto=format&fit=crop','[]'::jsonb,true),
('burguesia','Comidas','Promo Doble Bacon + Gaseosa','Doble carne, bacon crocante y queso — incluye una gaseosa personal.',24.50,4.5,137,
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=70&auto=format&fit=crop',
  '[{"id":"gaseosa","title":"Elige tu gaseosa (incluida)","required":true,"min":1,"max":1,"choices":[{"id":"inca","label":"Inca Kola","priceDelta":0},{"id":"coca","label":"Coca-Cola","priceDelta":0},{"id":"sprite","label":"Sprite","priceDelta":0}]}]'::jsonb,
  true),
('burguesia','Acompañamientos','Papas Fritas','Porción grande con salsas a elección.',9.90,3.9,107,
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=70&auto=format&fit=crop','[]'::jsonb,true),
('burguesia','Comidas','Chicken Crispy','Pollo crocante, mayo picante y pepinillos.',19.90,4.1,137,
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=70&auto=format&fit=crop','[]'::jsonb,true),
('burguesia','Bebidas','Chicha Morada 1/2L','Preparada al día, bien helada.',6.00,5.0,117,
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=70&auto=format&fit=crop','[]'::jsonb,true),
('burguesia','Bebidas','Gaseosa 500ml','Inca Kola, Coca-Cola o Sprite.',5.00,4.9,173,
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=70&auto=format&fit=crop','[]'::jsonb,true),
('burguesia','Comidas','Alitas Broaster (8 unid.)','Crocantes, bañadas en el sabor que elijas.',21.90,4.6,64,
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=70&auto=format&fit=crop',
  '[{"id":"sabor","title":"Elige el sabor de tus alitas","required":true,"min":1,"max":1,"choices":[{"id":"bbq","label":"BBQ","priceDelta":0},{"id":"picante","label":"Picante","priceDelta":0},{"id":"miel-mostaza","label":"Miel mostaza","priceDelta":0},{"id":"buffalo","label":"Buffalo","priceDelta":1.5}]},{"id":"extras","title":"¿Agregas algo más?","required":false,"min":0,"max":2,"choices":[{"id":"papas","label":"Papas fritas","priceDelta":6.0},{"id":"aderezo","label":"Aderezo extra","priceDelta":2.0},{"id":"chizitos","label":"Chizitos","priceDelta":5.0}]}]'::jsonb,
  true),

-- Sakura Sushi Bar
('sakura','Rolls','Roll California x10','Palta, kanikama y queso crema.',22.00,4.7,25,
  'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=200&q=70&auto=format&fit=crop','[]'::jsonb,true),
('sakura','Rolls','Roll Acevichado x10','Langostino, palta y toque acevichado.',26.00,4.4,93,
  'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=200&q=70&auto=format&fit=crop','[]'::jsonb,true),
('sakura','Sashimi','Sashimi Salmón (10 pzs)','Corte fresco del día.',32.00,4.4,34,
  'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=200&q=70&auto=format&fit=crop','[]'::jsonb,true),
('sakura','Entradas','Gyozas de Cerdo','6 unidades con salsa ponzu.',15.00,3.8,29,
  'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=200&q=70&auto=format&fit=crop','[]'::jsonb,true),
('sakura','Bebidas','Ramune Original','Gaseosa japonesa, bien helada.',8.00,4.8,14,
  'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=200&q=70&auto=format&fit=crop','[]'::jsonb,true),

-- Bella Napoli
('napoli','Pizzas','Pizza Margarita','Salsa de tomate, mozzarella y albahaca.',28.00,4.0,49,
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&q=70&auto=format&fit=crop','[]'::jsonb,true),
('napoli','Pizzas','Pizza Pepperoni','Doble pepperoni y mozzarella.',32.00,4.1,58,
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&q=70&auto=format&fit=crop','[]'::jsonb,true),
('napoli','Pastas','Fettuccine Alfredo','Pasta fresca en salsa cremosa.',24.00,4.5,106,
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&q=70&auto=format&fit=crop','[]'::jsonb,true),
('napoli','Postres','Tiramisú','Postre clásico italiano casero.',14.00,3.8,177,
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&q=70&auto=format&fit=crop','[]'::jsonb,true),
('napoli','Bebidas','Limonada Frozen','Limonada frappé bien fría.',9.00,4.4,166,
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&q=70&auto=format&fit=crop','[]'::jsonb,true),

-- Pollería El Gallo
('gallo','Comidas','1/4 Pollo + Papas','Con ensalada y cremas de la casa.',19.00,5.0,105,
  'https://images.unsplash.com/photo-1562967914-608f82629710?w=200&q=70&auto=format&fit=crop','[]'::jsonb,true),
('gallo','Menús','Menú Ejecutivo del Día','Entrada + plato de fondo + bebida, arma tu combo.',22.00,4.6,41,
  'https://images.unsplash.com/photo-1562967914-608f82629710?w=200&q=70&auto=format&fit=crop',
  '[{"id":"entrada","title":"Elige tu entrada","required":true,"min":1,"max":1,"choices":[{"id":"sopa","label":"Sopa criolla","priceDelta":0},{"id":"ensalada","label":"Ensalada fresca","priceDelta":0}]},{"id":"fondo","title":"Elige tu plato de fondo","required":true,"min":1,"max":1,"choices":[{"id":"saltado","label":"Lomo saltado","priceDelta":0},{"id":"arrozconpollo","label":"Arroz con pollo","priceDelta":0},{"id":"pescado","label":"Pescado frito","priceDelta":3.0}]},{"id":"bebida","title":"Elige tu bebida","required":true,"min":1,"max":1,"choices":[{"id":"chicha","label":"Chicha morada","priceDelta":0},{"id":"limonada","label":"Limonada","priceDelta":0},{"id":"gaseosa","label":"Gaseosa personal","priceDelta":1.5}]}]'::jsonb,
  true),
('gallo','Comidas','Pollo Entero Familiar','Pollo entero, papas y ensalada grande.',58.00,3.8,166,
  'https://images.unsplash.com/photo-1562967914-608f82629710?w=200&q=70&auto=format&fit=crop','[]'::jsonb,true),
('gallo','Comidas','Anticuchos (2 unid.)','Corazón a la brasa con papa y choclo.',16.00,4.4,95,
  'https://images.unsplash.com/photo-1562967914-608f82629710?w=200&q=70&auto=format&fit=crop','[]'::jsonb,true),
('gallo','Bebidas','Chicha Morada 1L','Preparada al día, bien helada.',8.00,4.3,151,
  'https://images.unsplash.com/photo-1562967914-608f82629710?w=200&q=70&auto=format&fit=crop','[]'::jsonb,true);

-- ----------------------------------------------------------
-- PROMOCIONES
-- ----------------------------------------------------------
insert into promos (badge, title, subtitle, description, cta, image, gradient, sort_order, active) values
('🍕 Especial martes', 'Pizza Italiana', '2×1 todos los martes',
  'Las mejores pizzas artesanales de Pucallpa llegan a tu puerta.', 'Ver pizzerías',
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=75&auto=format&fit=crop',
  'linear-gradient(120deg,#4B32C3,#8C5CFF)', 1, true),
('🍣 Solo hoy', 'Sushi Bar', '3×2 en rolls California',
  'Frescura japonesa directo a tu mesa, sin salir de casa.', 'Ver sushi bars',
  'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=500&q=75&auto=format&fit=crop',
  'linear-gradient(120deg,#0B6E8F,#3B2FD1)', 2, true),
('🔥 Oferta del día', 'Pollo a la Brasa', '20% off en combos familiares',
  'El sabor criollo de siempre, más rápido que nunca.', 'Ver pollerías',
  'https://images.unsplash.com/photo-1562967914-608f82629710?w=500&q=75&auto=format&fit=crop',
  'linear-gradient(120deg,#C1440E,#FF7A29)', 3, true);

-- ----------------------------------------------------------
-- PEDIDOS DE PRUEBA (uno por cada estado clave)
-- ----------------------------------------------------------
insert into orders (customer_name, customer_phone, items, subtotal, delivery_fee, tip, vip_fee, total, address, note, status, created_at) values
('Renzo Pérez', '+51 961 234 567',
  '[{"rid":"burguesia","did":"d1","name":"Clásica MotoMoto","restaurantName":"La Burguesía","qty":2,"price":18.90},{"rid":"burguesia","did":"d3","name":"Papas Fritas","restaurantName":"La Burguesía","qty":1,"price":9.90}]'::jsonb,
  47.70, 5.00, 0, 0, 52.70,
  '{"label":"Casa","address":"Jr. Tarapacá 245","reference":"Portón azul, al lado de la bodega"}'::jsonb,
  'Sin cebolla en la hamburguesa, por favor.', 'nuevo', now() - interval '10 minutes'),
('Milagros Torres', '+51 987 654 321',
  '[{"rid":"sakura","did":"d1","name":"Roll California x10","restaurantName":"Sakura Sushi Bar","qty":1,"price":22.00},{"rid":"sakura","did":"d5","name":"Ramune Original","restaurantName":"Sakura Sushi Bar","qty":2,"price":8.00}]'::jsonb,
  38.00, 6.00, 3.00, 0, 47.00,
  '{"label":"Trabajo","address":"Av. Centenario 890, Of. 302","reference":"Edificio Los Álamos"}'::jsonb,
  null, 'confirmado', now() - interval '45 minutes'),
('Jhonatan Ríos', '+51 945 111 222',
  '[{"rid":"gallo","did":"d3","name":"Pollo Entero Familiar","restaurantName":"Pollería El Gallo","qty":1,"price":58.00}]'::jsonb,
  58.00, 5.00, 5.00, 2.50, 70.50,
  '{"label":"Casa","address":"Av. Yarinacocha 1120","reference":"Frente al grifo"}'::jsonb,
  'Tocar el timbre dos veces.', 'entregado', now() - interval '1 day');

-- ==========================================================
-- Fin del seed
-- ==========================================================
