// ============================================================
// CONFIGURACIÓN DE SUPABASE
// Reemplaza estos dos valores con los de tu proyecto:
// Supabase Dashboard -> Project Settings -> API Keys
//   - "Project URL"        -> SUPABASE_URL   (pestaña "General"/arriba de la página)
//   - "Publishable key"     -> SUPABASE_ANON_KEY
//     (pestaña "Publishable and secret API keys", tarjeta "Publishable key",
//     empieza con "sb_publishable_..." — reemplaza a la vieja "anon public key")
// (esta key es pública a propósito, va en el navegador de cualquiera: la
// seguridad real la dan las políticas RLS de supabase/schema.sql)
// ============================================================
const SUPABASE_URL = "https://TU-PROYECTO.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_TU_KEY_AQUI";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Tablas (nombres centralizados por si se necesitan cambiar)
const TABLE = {
  LOCALES: "locales",
  MENUS: "menus",
  PEDIDOS: "pedidos",
  DRIVERS: "drivers"
};
