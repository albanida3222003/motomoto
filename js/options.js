/* ==========================================================
   OPCIONES DE UN PLATO (grupos obligatorios/opcionales)
   Antes de agregar un plato con "gruposOpciones" (ej. "Elige tu
   entrada", "Elige 3 sabores") al carrito, se muestra este modal
   para que el cliente elija — misma idea que usa el admin al
   armar un pedido a mano.
   ========================================================== */
import { restaurants } from './data.js';
import { addToCart } from './cart.js';
import { showToast } from './utils.js';

let itemActual = null; // { restId, menu }

export function openItemOptions(restId, menuId) {
  const r = restaurants.find(x => x.id === restId);
  const m = r?.menu.find(x => x.id === menuId);
  if (!r || !m) return;

  const grupos = m.gruposOpciones || [];
  if (grupos.length === 0) {
    // Sin opciones que elegir: se agrega directo, como antes.
    addToCart(restId, menuId, [], m.price);
    return;
  }

  itemActual = { restId, menu: m };
  document.getElementById('optItemNombre').textContent = m.name;

  let html = '';
  grupos.forEach(g => {
    const inputType = g.tipo === 'unica' ? 'radio' : 'checkbox';
    html += `<div class="opt-group-title">${g.nombre}${g.obligatorio ? ' <span class="opt-required">*</span>' : ' (opcional)'}</div>`;
    html += `<p class="opt-group-hint">${g.tipo === 'unica' ? 'Elige 1 opción' : `Elige entre ${g.min ?? 1} y ${g.max ?? 1} opciones`}</p>`;
    (g.opciones || []).forEach((op, idx) => {
      html += `
        <label class="opt-item-row">
          <input type="${inputType}" name="grupo-${g.id || g.nombre}" value="${idx}" data-group="${g.id || g.nombre}">
          <span>${op.nombre}${op.precioExtra ? ` <span class="opt-extra">(+S/ ${Number(op.precioExtra).toFixed(2)})</span>` : ''}</span>
        </label>`;
    });
  });

  document.getElementById('optItemBody').innerHTML = html;
  document.getElementById('optionsModal').classList.add('open');
}

export function closeItemOptions() {
  document.getElementById('optionsModal').classList.remove('open');
  itemActual = null;
}

export function confirmItemOptions() {
  if (!itemActual) return;
  const { restId, menu } = itemActual;
  const grupos = menu.gruposOpciones || [];
  const seleccionFinal = [];
  let extraTotal = 0;

  for (const g of grupos) {
    const inputs = [...document.querySelectorAll(`input[data-group="${g.id || g.nombre}"]:checked`)];
    if (g.obligatorio && inputs.length < Math.max(1, g.min || 1)) {
      showToast(`Elige "${g.nombre}" (mínimo ${g.min || 1})`);
      return;
    }
    if (g.tipo === 'multiple' && inputs.length > (g.max || 99)) {
      showToast(`Máximo ${g.max} opciones para "${g.nombre}"`);
      return;
    }
    const nombres = inputs.map(inp => {
      const op = g.opciones[parseInt(inp.value, 10)];
      extraTotal += Number(op.precioExtra) || 0;
      return op.nombre;
    });
    if (nombres.length) seleccionFinal.push({ grupo: g.nombre, seleccion: nombres });
  }

  const unitPrice = menu.price + extraTotal;
  addToCart(restId, menu.id, seleccionFinal, unitPrice);
  closeItemOptions();
}
