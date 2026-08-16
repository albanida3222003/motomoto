/* ==========================================================
   CLIENTE DE SUPABASE (una sola instancia para todo el panel)
========================================================== */
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
