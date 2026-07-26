/* ==========================================================
   DATOS DE LA APP (categorías, promociones, restaurantes)
   En un backend real esto vendría de una API/base de datos.
   Por ahora es la "base de datos" simulada del prototipo.
   ========================================================== */

export const categories = [
  { id: 'all', name: 'Todos', icon: '🍽️' },
  { id: 'amazonica', name: 'Amazónica', icon: '🍃' },
  { id: 'marino', name: 'Marinos', icon: '🐙' },
  { id: 'broster', name: 'Broster', icon: '🍗' },
  { id: 'polleria', name: 'Pollería', icon: '🐔' },
  { id: 'bebidas', name: 'Bebidas', icon: '🧃' }
];

// Banners de promociones (imágenes publicitarias)
export const promotions = [
  {
    id: 'p1',
    img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600',
    restaurantId: 'r1'
  },
  {
    id: 'p2',
    img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600',
    restaurantId: 'r2'
  }
];

export const restaurants = [
  {
    id: 'r1',
    name: 'El Aguajal',
    category: 'amazonica',
    desc: 'Cocina amazónica tradicional',
    phone: '51987654321',
    rating: 4.8,
    time: '25-35 min',
    img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600',
    lat: -8.3791,
    lng: -74.5539,
    menu: [
      { id: 'm1', name: 'Juane de gallina', desc: 'Arroz con gallina envuelto en hoja de bijao', price: 18, img: 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=300' },
      { id: 'm2', name: 'Tacacho con cecina', desc: 'Plátano asado con cecina ahumada', price: 22, img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300' },
      { id: 'm3', name: 'Inchicapi', desc: 'Sopa espesa de gallina con maní', price: 15, img: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=300' }
    ]
  },
  {
    id: 'r2',
    name: 'Chifa Amazónico',
    category: 'amazonica',
    desc: 'Fusión oriental y selvática',
    phone: '51987654321',
    rating: 4.6,
    time: '30-40 min',
    img: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600',
    lat: -8.3850,
    lng: -74.5480,
    menu: [
      { id: 'm4', name: 'Arroz chaufa de paiche', desc: 'Chaufa con pescado amazónico', price: 20, img: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300' },
      { id: 'm5', name: 'Wantán frito', desc: '8 unidades con salsa agridulce', price: 14, img: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=300' }
    ]
  },
  {
    id: 'r3',
    name: 'Parrilla del Ucayali',
    category: 'broster',
    desc: 'Carnes y anticuchos a la brasa',
    phone: '51987654321',
    rating: 4.7,
    time: '35-45 min',
    img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600',
    lat: -8.3720,
    lng: -74.5600,
    menu: [
      { id: 'm6', name: 'Anticucho de corazón', desc: '3 palitos con papa y choclo', price: 16, img: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=300' },
      { id: 'm7', name: 'Parrilla mixta', desc: 'Res, pollo y chorizo para 2', price: 45, img: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=300' }
    ]
  },
  {
    id: 'r4',
    name: 'Jugos y Frutas del Río',
    category: 'bebidas',
    desc: 'Jugos naturales de la selva',
    phone: '51987654321',
    rating: 4.9,
    time: '15-25 min',
    img: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=600',
    lat: -8.3810,
    lng: -74.5510,
    menu: [
      { id: 'm8', name: 'Jugo de camu camu', desc: 'Vaso grande 500ml', price: 8, img: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=300' },
      { id: 'm9', name: 'Refresco de aguaje', desc: 'Vaso grande 500ml', price: 7, img: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=300' }
    ]
  }
];
