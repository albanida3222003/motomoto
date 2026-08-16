/* ==========================================================
   UI helpers compartidos: toast, modal genérico, formateo
========================================================== */
const toastEl = document.getElementById('toast');
let toastTimer = null;

function showToast(msg, isError = false){
  toastEl.textContent = msg;
  toastEl.classList.toggle('error', isError);
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, 3200);
}

const modalBackdrop = document.getElementById('modal-backdrop');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
document.getElementById('modal-close').addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', (e) => { if(e.target === modalBackdrop) closeModal(); });

function openModal(title, bodyHtml){
  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHtml;
  modalBackdrop.hidden = false;
}
function closeModal(){
  modalBackdrop.hidden = true;
  modalBody.innerHTML = '';
}

function escapeHtml(str){
  if(str === null || str === undefined) return '';
  return String(str)
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#39;');
}

function fmtMoney(n){
  const v = Number(n) || 0;
  return 'S/ ' + v.toFixed(2);
}

function fmtDate(iso){
  try{
    return new Date(iso).toLocaleString('es-PE', { day:'numeric', month:'short', year:'numeric', hour:'numeric', minute:'2-digit' });
  }catch(e){ return iso || ''; }
}

// confirmación simple reutilizable (envuelve confirm nativo para poder cambiarlo luego)
function confirmAction(msg){
  return window.confirm(msg);
}

// muestra el mensaje de error de Supabase de forma legible
function sbErrorMsg(error){
  return (error && error.message) ? error.message : 'Ocurrió un error inesperado.';
}
