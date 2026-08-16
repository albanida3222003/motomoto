/* ==========================================================
   PROMOCIONES — listado + alta/edición/borrado
========================================================== */
let promosCache = [];

async function renderPromosSection(){
  const root = document.getElementById('view-root');
  root.innerHTML = `
    <div class="section-toolbar">
      <div></div>
      <button type="button" class="btn btn-primary" id="promo-new-btn">+ Nueva promoción</button>
    </div>
    <div class="data-card"><div id="promo-table-wrap">Cargando…</div></div>
  `;
  document.getElementById('promo-new-btn').addEventListener('click', () => openPromoForm(null));
  await loadPromos();
}

async function loadPromos(){
  const { data, error } = await sb.from('promos').select('*').order('sort_order').order('created_at');
  if(error){ showToast(sbErrorMsg(error), true); return; }
  promosCache = data || [];
  renderPromosTable(promosCache);
}

function renderPromosTable(list){
  const wrap = document.getElementById('promo-table-wrap');
  if(!wrap) return;
  if(list.length === 0){
    wrap.innerHTML = `<div class="empty-state"><span class="big-emoji">📣</span>Todavía no hay promociones en el carrusel.</div>`;
    return;
  }
  wrap.innerHTML = `
    <table class="data-table">
      <thead><tr><th>Promoción</th><th>Orden</th><th>Estado</th><th></th></tr></thead>
      <tbody>
        ${list.map(p => `
          <tr>
            <td>
              <div class="name-cell">
                <img class="thumb" src="${escapeHtml(p.image || '')}" onerror="this.style.visibility='hidden'">
                ${escapeHtml(p.title)}
              </div>
              <div class="cell-muted">${escapeHtml(p.subtitle || '')}</div>
            </td>
            <td class="cell-muted">${p.sort_order ?? 0}</td>
            <td>${p.active ? '<span class="badge badge-green">Activa</span>' : '<span class="badge badge-red">Oculta</span>'}</td>
            <td class="cell-actions">
              <button type="button" class="btn btn-ghost btn-sm" data-edit="${p.id}">Editar</button>
              <button type="button" class="btn btn-danger btn-sm" data-del="${p.id}">Eliminar</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  wrap.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => openPromoForm(promosCache.find(x => x.id === btn.dataset.edit)));
  });
  wrap.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => deletePromo(btn.dataset.del));
  });
}

function openPromoForm(p){
  const isEdit = !!p;
  openModal(isEdit ? 'Editar promoción' : 'Nueva promoción', `
    <form id="promo-form">
      <div class="form-grid">
        <label class="field">
          <span>Insignia (emoji + texto)</span>
          <input type="text" id="f-p-badge" placeholder="🍕 Especial martes" value="${escapeHtml(p?.badge)}">
        </label>
        <label class="field">
          <span>Orden</span>
          <input type="number" id="f-p-order" value="${p?.sort_order ?? 0}">
        </label>
        <label class="field field-full">
          <span>Título</span>
          <input type="text" id="f-p-title" value="${escapeHtml(p?.title)}" required>
        </label>
        <label class="field field-full">
          <span>Subtítulo</span>
          <input type="text" id="f-p-subtitle" value="${escapeHtml(p?.subtitle)}">
        </label>
        <label class="field field-full">
          <span>Descripción</span>
          <textarea id="f-p-desc" rows="2">${escapeHtml(p?.description)}</textarea>
        </label>
        <label class="field">
          <span>Texto del botón (CTA)</span>
          <input type="text" id="f-p-cta" placeholder="Ver pizzerías" value="${escapeHtml(p?.cta)}">
        </label>
        <label class="field">
          <span>Degradado CSS (opcional)</span>
          <input type="text" id="f-p-gradient" placeholder="linear-gradient(120deg,#4B32C3,#8C5CFF)" value="${escapeHtml(p?.gradient)}">
        </label>
        <label class="field field-full">
          <span>URL de imagen</span>
          <input type="text" id="f-p-image" value="${escapeHtml(p?.image)}">
        </label>
      </div>
      <div class="checkbox-row">
        <input type="checkbox" id="f-p-active" ${(p?.active ?? true) ? 'checked' : ''}>
        <label for="f-p-active">Promoción visible / activa</label>
      </div>
      <p id="promo-form-error" class="form-error" hidden></p>
      <div class="form-actions">
        <button type="button" class="btn btn-ghost" id="promo-cancel-btn">Cancelar</button>
        <button type="submit" class="btn btn-primary">${isEdit ? 'Guardar cambios' : 'Crear promoción'}</button>
      </div>
    </form>
  `);
  document.getElementById('promo-cancel-btn').addEventListener('click', closeModal);
  document.getElementById('promo-form').addEventListener('submit', (e) => savePromo(e, p));
}

async function savePromo(e, existing){
  e.preventDefault();
  const errEl = document.getElementById('promo-form-error');
  errEl.hidden = true;

  const payload = {
    badge: document.getElementById('f-p-badge').value.trim() || null,
    title: document.getElementById('f-p-title').value.trim(),
    subtitle: document.getElementById('f-p-subtitle').value.trim() || null,
    description: document.getElementById('f-p-desc').value.trim() || null,
    cta: document.getElementById('f-p-cta').value.trim() || null,
    gradient: document.getElementById('f-p-gradient').value.trim() || null,
    image: document.getElementById('f-p-image').value.trim() || null,
    sort_order: parseInt(document.getElementById('f-p-order').value) || 0,
    active: document.getElementById('f-p-active').checked
  };

  let error;
  if(existing){
    ({ error } = await sb.from('promos').update(payload).eq('id', existing.id));
  } else {
    ({ error } = await sb.from('promos').insert(payload));
  }

  if(error){
    errEl.textContent = sbErrorMsg(error);
    errEl.hidden = false;
    return;
  }

  closeModal();
  showToast(existing ? 'Promoción actualizada.' : 'Promoción creada.');
  await loadPromos();
}

async function deletePromo(id){
  if(!confirmAction('¿Eliminar esta promoción?')) return;
  const { error } = await sb.from('promos').delete().eq('id', id);
  if(error){ showToast(sbErrorMsg(error), true); return; }
  showToast('Promoción eliminada.');
  await loadPromos();
}
