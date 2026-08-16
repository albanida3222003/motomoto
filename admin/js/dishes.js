/* ==========================================================
   PLATOS — listado + alta/edición/borrado (por restaurante)
========================================================== */
let dishesCache = [];
let dishesSelectedRestaurant = '';

async function renderDishesSection(){
  const root = document.getElementById('view-root');
  root.innerHTML = `
    <div class="section-toolbar">
      <div class="toolbar-filters">
        <select id="dish-rest-filter"><option value="">Todos los restaurantes</option></select>
        <input type="search" id="dish-search" placeholder="Buscar plato…">
      </div>
      <button type="button" class="btn btn-primary" id="dish-new-btn">+ Nuevo plato</button>
    </div>
    <div class="data-card"><div id="dish-table-wrap">Cargando…</div></div>
  `;

  if(restaurantsCache.length === 0){
    const { data } = await sb.from('restaurants').select('id,name').order('name');
    restaurantsCache = data || [];
  }
  const filterSel = document.getElementById('dish-rest-filter');
  filterSel.innerHTML += restaurantsCache.map(r => `<option value="${escapeHtml(r.id)}">${escapeHtml(r.name)}</option>`).join('');
  filterSel.value = dishesSelectedRestaurant;

  filterSel.addEventListener('change', (e) => {
    dishesSelectedRestaurant = e.target.value;
    renderDishesTable(applyDishFilters());
  });
  document.getElementById('dish-search').addEventListener('input', () => renderDishesTable(applyDishFilters()));
  document.getElementById('dish-new-btn').addEventListener('click', () => {
    if(restaurantsCache.length === 0){
      showToast('Primero crea un restaurante.', true);
      return;
    }
    openDishForm(null);
  });

  await loadDishes();
}

function applyDishFilters(){
  const q = (document.getElementById('dish-search')?.value || '').toLowerCase().trim();
  return dishesCache.filter(d => {
    const matchRest = !dishesSelectedRestaurant || d.restaurant_id === dishesSelectedRestaurant;
    const matchQ = !q || d.name.toLowerCase().includes(q);
    return matchRest && matchQ;
  });
}

async function loadDishes(){
  const { data, error } = await sb.from('dishes').select('*').order('name');
  if(error){ showToast(sbErrorMsg(error), true); return; }
  dishesCache = data || [];
  renderDishesTable(applyDishFilters());
}

function restaurantName(id){
  return restaurantsCache.find(r => r.id === id)?.name || '(restaurante eliminado)';
}

function renderDishesTable(list){
  const wrap = document.getElementById('dish-table-wrap');
  if(!wrap) return;
  if(list.length === 0){
    wrap.innerHTML = `<div class="empty-state"><span class="big-emoji">🍔</span>No hay platos que coincidan. Crea uno con "Nuevo plato".</div>`;
    return;
  }
  wrap.innerHTML = `
    <table class="data-table">
      <thead><tr><th>Plato</th><th>Restaurante</th><th>Categoría</th><th>Precio</th><th>Estado</th><th></th></tr></thead>
      <tbody>
        ${list.map(d => `
          <tr>
            <td>
              <div class="name-cell">
                <img class="thumb" src="${escapeHtml(d.image || '')}" onerror="this.style.visibility='hidden'">
                ${escapeHtml(d.name)}
              </div>
            </td>
            <td class="cell-muted">${escapeHtml(restaurantName(d.restaurant_id))}</td>
            <td class="cell-muted">${escapeHtml(d.category || '—')}</td>
            <td>${fmtMoney(d.price)}</td>
            <td>${d.active ? '<span class="badge badge-green">Activo</span>' : '<span class="badge badge-red">Oculto</span>'}</td>
            <td class="cell-actions">
              <button type="button" class="btn btn-ghost btn-sm" data-edit="${d.id}">Editar</button>
              <button type="button" class="btn btn-danger btn-sm" data-del="${d.id}">Eliminar</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  wrap.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => openDishForm(dishesCache.find(x => x.id === btn.dataset.edit)));
  });
  wrap.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => deleteDish(btn.dataset.del));
  });
}

function openDishForm(d){
  const isEdit = !!d;
  openModal(isEdit ? 'Editar plato' : 'Nuevo plato', `
    <form id="dish-form">
      <div class="form-grid">
        <label class="field field-full">
          <span>Restaurante</span>
          <select id="f-d-rest" required>
            ${restaurantsCache.map(r => `<option value="${escapeHtml(r.id)}" ${d?.restaurant_id===r.id ? 'selected':''}>${escapeHtml(r.name)}</option>`).join('')}
          </select>
        </label>
        <label class="field field-full">
          <span>Nombre del plato</span>
          <input type="text" id="f-d-name" value="${escapeHtml(d?.name)}" required>
        </label>
        <label class="field">
          <span>Categoría</span>
          <input type="text" id="f-d-cat" placeholder="Comidas, Bebidas…" value="${escapeHtml(d?.category)}">
        </label>
        <label class="field">
          <span>Precio (S/)</span>
          <input type="number" step="0.10" min="0" id="f-d-price" value="${d?.price ?? ''}" required>
        </label>
        <label class="field field-full">
          <span>Descripción</span>
          <textarea id="f-d-desc" rows="2">${escapeHtml(d?.description)}</textarea>
        </label>
        <label class="field field-full">
          <span>URL de imagen</span>
          <input type="text" id="f-d-image" value="${escapeHtml(d?.image)}">
        </label>
        <label class="field">
          <span>Rating</span>
          <input type="number" step="0.1" min="0" max="5" id="f-d-rating" value="${d?.rating ?? ''}">
        </label>
        <label class="field">
          <span>Reseñas</span>
          <input type="number" min="0" id="f-d-reviews" value="${d?.reviews ?? 0}">
        </label>
        <label class="field field-full">
          <span>Opciones del plato (JSON — grupos de elección, como en dish-options.js). Deja <code>[]</code> si no tiene.</span>
          <textarea id="f-d-options" rows="5">${escapeHtml(JSON.stringify(d?.options ?? [], null, 2))}</textarea>
        </label>
      </div>
      <div class="checkbox-row">
        <input type="checkbox" id="f-d-active" ${(d?.active ?? true) ? 'checked' : ''}>
        <label for="f-d-active">Plato visible / activo</label>
      </div>
      <p id="dish-form-error" class="form-error" hidden></p>
      <div class="form-actions">
        <button type="button" class="btn btn-ghost" id="dish-cancel-btn">Cancelar</button>
        <button type="submit" class="btn btn-primary">${isEdit ? 'Guardar cambios' : 'Crear plato'}</button>
      </div>
    </form>
  `);

  document.getElementById('dish-cancel-btn').addEventListener('click', closeModal);
  document.getElementById('dish-form').addEventListener('submit', (e) => saveDish(e, d));
}

async function saveDish(e, existing){
  e.preventDefault();
  const errEl = document.getElementById('dish-form-error');
  errEl.hidden = true;

  let options;
  try{
    options = JSON.parse(document.getElementById('f-d-options').value || '[]');
  }catch(err){
    errEl.textContent = 'Las opciones no son un JSON válido.';
    errEl.hidden = false;
    return;
  }

  const payload = {
    restaurant_id: document.getElementById('f-d-rest').value,
    name: document.getElementById('f-d-name').value.trim(),
    category: document.getElementById('f-d-cat').value.trim() || null,
    price: parseFloat(document.getElementById('f-d-price').value) || 0,
    description: document.getElementById('f-d-desc').value.trim() || null,
    image: document.getElementById('f-d-image').value.trim() || null,
    rating: parseFloat(document.getElementById('f-d-rating').value) || 0,
    reviews: parseInt(document.getElementById('f-d-reviews').value) || 0,
    options,
    active: document.getElementById('f-d-active').checked
  };

  let error;
  if(existing){
    ({ error } = await sb.from('dishes').update(payload).eq('id', existing.id));
  } else {
    ({ error } = await sb.from('dishes').insert(payload));
  }

  if(error){
    errEl.textContent = sbErrorMsg(error);
    errEl.hidden = false;
    return;
  }

  closeModal();
  showToast(existing ? 'Plato actualizado.' : 'Plato creado.');
  await loadDishes();
}

async function deleteDish(id){
  if(!confirmAction('¿Eliminar este plato?')) return;
  const { error } = await sb.from('dishes').delete().eq('id', id);
  if(error){ showToast(sbErrorMsg(error), true); return; }
  showToast('Plato eliminado.');
  await loadDishes();
}
