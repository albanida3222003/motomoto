// ============================================================
// CONFIGURACIÓN DE SUPABASE
// Reemplaza estos dos valores con los de tu proyecto:
// Supabase Dashboard -> Project Settings -> API
//   - "Project URL"       -> SUPABASE_URL
//   - "anon public" key   -> SUPABASE_ANON_KEY
// (la anon key es pública a propósito, no es secreta: la
// seguridad real la dan las políticas RLS de supabase/schema.sql)
// ============================================================
const SUPABASE_URL = "https://TU-PROYECTO.supabase.co";
const SUPABASE_ANON_KEY = "TU_ANON_KEY_AQUI";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Tablas (nombres centralizados por si se necesitan cambiar)
const TABLE = {
  LOCALES: "locales",
  MENUS: "menus",
  PEDIDOS: "pedidos",
  DRIVERS: "drivers"
};
