/* ==========================================================
   TEMA CLARO / OSCURO
   El tema inicial ya se aplica en un script inline dentro del
   <head> de index.html (para evitar parpadeo). Este módulo solo
   maneja el botón para cambiarlo y guardar la preferencia.
   ========================================================== */

const STORAGE_KEY = 'motomoto-theme';

export function getTheme() {
  return document.documentElement.getAttribute('data-theme') || 'light';
}

export function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);
}

export function toggleTheme() {
  setTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

export function initThemeToggle() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  btn.addEventListener('click', toggleTheme);
}
