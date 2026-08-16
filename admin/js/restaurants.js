/* ==========================================================
   RESTAURANTES — listado + alta/edición/borrado
========================================================== */
let restaurantsCache = [];

async function renderRestaurantsSection(){
  const root = document.getElementById('view-root');
  root.innerHTML = `
    <div class="section-toolbar">
      <div class="toolbar-filters">
        <input type="search" id="rest-search" placeholder="Buscar restaurante…">
      </div>
      <button type="button" class="btn btn-primary" id="rest-new-btn">+ Nuevo restaurante</button>
    </div>
    <div class="data-card"><div id="rest-table-wrap">Cargando…</div></div>
  `;

  document.getElementById('rest-new-btn').addEventListener('click', () => openRestaurantForm(null));
  document.getElementById('rest-search').addEventListener('input', (e) => {
    renderRestaurantsTable(filterRestaurants(e.target.value));
  });

  await loadRestaurants();
}

function filterRestaurants(q){
  q = (q || '').toLowerCase().trim();
  if(!q) return restaurantsCache;
  return restaurantsCache.filter(r => (r.name + ' ' + (r.sub||'')).toLowerCase().includes(q));
}

async function loadRestaurants(){
  const { data, error } = await sb.from('restaurants').select('*').order('name');
  if(error){ showToast(sbErrorMsg(error), true); return; }
  restaurantsCache = data || [];
  renderRestaurantsTable(restaurantsCache);
}

function renderRestaurantsTable(list){
  const wrap = document.getElementById('rest-table-wrap');
  if(!wrap) return;
  if(list.length === 0){
    wrap.innerHTML = `<div class="empty-state"><span class="big-emoji">🏬</span>No hay restaurantes todavía. Crea el primero con "Nuevo restaurante".</div>`;
    return;
  }
  wrap.innerHTML = `
    <table class="data-table">
      <thead><tr>
        <th>Restaurante</th><th>Tipo</th><th>Categorías</th><th>Rating</th><th>Estado</th><th></th>
      </tr></thead>
      <tbody>
        ${list.map(r => `
          <tr>
            <td>
              <div class="name-cell">
                <img class="thumb" src="${escapeHtml(r.image || '')}" onerror="this.style.visibility='hidden'">
                ${escapeHtml(r.name)}
              </div>
              <div class="cell-muted">${escapeHtml(r.sub || '')}</div>
            </td>
            <td>${r.partner_type === 'socio' ? '<span class="badge badge-blue">Socio</span>' : '<span class="badge badge-gray">Externo</span>'}</td>
            <td class="cell-muted">${(r.cats || []).join(', ') || '—'}</td>
            <td>${r.rating || '—'}</td>
            <td>${r.active ? '<span class="badge badge-green">Activo</span>' : '<span class="badge badge-red">Oculto</span>'}</td>
            <td class="cell-actions">
              <button type="button" class="btn btn-ghost btn-sm" data-edit="${escapeHtml(r.id)}">Editar</button>
              <button type="button" class="btn btn-danger btn-sm" data-del="${escapeHtml(r.id)}">Eliminar</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  wrap.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const r = restaurantsCache.find(x => x.id === btn.dataset.edit);
      openRestaurantForm(r);
    });
  });
  wrap.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => deleteRestaurant(btn.dataset.del));
  });
}

function slugify(text){
  return text.toString().toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}

function openRestaurantForm(r){
  const isEdit = !!r;
  openModal(isEdit ? 'Editar restaurante' : 'Nuevo restaurante', `
    <form id="rest-form">
      <div class="form-grid">
        <label class="field field-full">
          <span>Nombre</span>
          <input type="text" id="f-name" value="${escapeHtml(r?.name)}" required>
        </label>
        <label class="field field-full">
          <span>Subtítulo</span>
          <input type="text" id="f-sub" placeholder="Hamburguesas • Papas Fritas" value="${escapeHtml(r?.sub)}">
        </label>
        <label class="field">
          <span>Tipo de convenio</span>
          <select id="f-partner">
            <option value="socio" ${r?.partner_type === 'socio' ? 'selected' : ''}>Socio (convenio directo)</option>
            <option value="externo" ${r?.partner_type !== 'socio' ? 'selected' : ''}>Externo</option>
          </select>
        </label>
        <label class="field">
          <span>Rating</span>
          <input type="number" step="0.1" min="0" max="5" id="f-rating" value="${r?.rating ?? ''}">
        </label>
        <label class="field">
          <span>Reseñas</span>
          <input type="number" min="0" id="f-reviews" value="${r?.reviews ?? 0}">
        </label>
        <label class="field">
          <span>Tiempo de entrega</span>
          <input type="text" id="f-time" placeholder="25-35 min" value="${escapeHtml(r?.time_estimate)}">
        </label>
        <label class="field">
          <span>Pedido mínimo</span>
          <input type="text" id="f-min" placeholder="S/ 20" value="${escapeHtml(r?.min_order)}">
        </label>
        <label class="field">
          <span>Categorías (separadas por coma)</span>
          <input type="text" id="f-cats" placeholder="hamburguesas, bebidas" value="${(r?.cats||[]).join(', ')}">
        </label>
        <label class="field field-full">
          <span>Etiquetas (separadas por coma)</span>
          <input type="text" id="f-tags" placeholder="Favorito del barrio, Nuevo" value="${(r?.tags||[]).join(', ')}">
        </label>
        <label class="field">
          <span>Tipo de insignia</span>
          <select id="f-badge-type">
            <option value="" ${!r?.badge_type ? 'selected':''}>Ninguna</option>
            <option value="off" ${r?.badge_type==='off'?'selected':''}>Descuento (off)</option>
            <option value="feat" ${r?.badge_type==='feat'?'selected':''}>Destacado (feat)</option>
            <option value="combo" ${r?.badge_type==='combo'?'selected':''}>Combo</option>
          </select>
        </label>
        <label class="field">
          <span>Texto de la insignia</span>
          <input type="text" id="f-badge-label" placeholder="20% OFF" value="${escapeHtml(r?.badge_label)}">
        </label>
        <label class="field field-full">
          <span>Dirección</span>
          <input type="text" id="f-address" value="${escapeHtml(r?.address)}">
        </label>
        <label class="field">
          <span>Latitud</span>
          <input type="number" step="any" id="f-lat" value="${r?.lat ?? ''}">
        </label>
        <label class="field">
          <span>Longitud</span>
          <input type="number" step="any" id="f-lng" value="${r?.lng ?? ''}">
        </label>
        <label class="field field-full">
          <span>URL de imagen</span>
          <input type="text" id="f-image" value="${escapeHtml(r?.image)}">
        </label>
        <label class="field field-full">
          <span>Horario (JSON por día: dom, lun, mar, mie, jue, vie, sab)</span>
          <textarea id="f-hours" rows="4">${escapeHtml(JSON.stringify(r?.hours ?? { lun:{open:'12:00',close:'22:00'} }, null, 2))}</textarea>
        </label>
      </div>
      <div class="checkbox-row">
        <input type="checkbox" id="f-active" ${(r?.active ?? true) ? 'checked' : ''}>
        <label for="f-active">Restaurante visible / activo</label>
      </div>
      <p id="rest-form-error" class="form-error" hidden></p>
      <div class="form-actions">
        <button type="button" class="btn btn-ghost" id="rest-cancel-btn">Cancelar</button>
        <button type="submit" class="btn btn-primary">${isEdit ? 'Guardar cambios' : 'Crear restaurante'}</button>
      </div>
    </form>
  `);

  document.getElementById('rest-cancel-btn').addEventListener('click', closeModal);
  document.getElementById('rest-form').addEventListener('submit', (e) => saveRestaurant(e, r));
}

async function saveRestaurant(e, existing){
  e.preventDefault();
  const errEl = document.getElementById('rest-form-error');
  errEl.hidden = true;

  let hours;
  try{
    hours = JSON.parse(document.getElementById('f-hours').value || '{}');
  }catch(err){
    errEl.textContent = 'El horario no es un JSON válido.';
    errEl.hidden = false;
    return;
  }

  const name = document.getElementById('f-name').value.trim();
  const payload = {
    name,
    sub: document.getElementById('f-sub').value.trim() || null,
    partner_type: document.getElementById('f-partner').value,
    rating: parseFloat(document.getElementById('f-rating').value) || 0,
    reviews: parseInt(document.getElementById('f-reviews').value) || 0,
    time_estimate: document.getElementById('f-time').value.trim() || null,
    min_order: document.getElementById('f-min').value.trim() || null,
    cats: document.getElementById('f-cats').value.split(',').map(s=>s.trim()).filter(Boolean),
    tags: document.getElementById('f-tags').value.split(',').map(s=>s.trim()).filter(Boolean),
    badge_type: document.getElementById('f-badge-type').value || null,
    badge_label: document.getElementById('f-badge-label').value.trim() || null,
    address: document.getElementById('f-address').value.trim() || null,
    lat: document.getElementById('f-lat').value ? parseFloat(document.getElementById('f-lat').value) : null,
    lng: document.getElementById('f-lng').value ? parseFloat(document.getElementById('f-lng').value) : null,
    image: document.getElementById('f-image').value.trim() || null,
    hours,
    active: document.getElementById('f-active').checked
  };

  let error;
  if(existing){
    ({ error } = await sb.from('restaurants').update(payload).eq('id', existing.id));
  } else {
    let id = slugify(name);
    if(!id){ errEl.textContent = 'Ponle un nombre al restaurante.'; errEl.hidden = false; return; }
    ({ error } = await sb.from('restaurants').insert({ id, ...payload }));
  }

  if(error){
    errEl.textContent = sbErrorMsg(error);
    errEl.hidden = false;
    return;
  }

  closeModal();
  showToast(existing ? 'Restaurante actualizado.' : 'Restaurante creado.');
  await loadRestaurants();
}

async function deleteRestaurant(id){
  const r = restaurantsCache.find(x => x.id === id);
  if(!confirmAction(`¿Eliminar "${r?.name}"? Esto también borrará sus platos.`)) return;
  const { error } = await sb.from('restaurants').delete().eq('id', id);
  if(error){ showToast(sbErrorMsg(error), true); return; }
  showToast('Restaurante eliminado.');
  await loadRestaurants();
}
