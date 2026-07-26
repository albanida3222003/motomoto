/* ==========================================================
   UTILIDADES GENERALES
   ========================================================== */

let toastTimeoutId = null;

export function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimeoutId);
  toastTimeoutId = setTimeout(() => t.classList.remove('show'), 1800);
}

// Redondea al 0.50 más cercano (Ej: 6.20 -> 6.00 | 6.30 -> 6.50)
export function roundToHalf(value) {
  return Math.round(value * 2) / 2;
}

export function formatCurrency(value) {
  return `S/ ${value.toFixed(2)}`;
}
