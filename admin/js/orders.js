/* ==========================================================
   PEDIDOS — listado, detalle y cambio de estado
========================================================== */
let ordersCache = [];

const ORDER_STATUSES = [
  { value:'nuevo', label:'Nuevo', badge:'badge-blue' },
  { value:'confirmado', label:'Confirmado', badge:'badge-orange' },
  { value:'en_camino', label:'En camino', badge:'badge-orange' },
  { value:'entregado', label:'Entregado', badge:'badge-green' },
  { value:'cancelado', label:'Cancelado', badge:'badge-red' },
];

function statusMeta(v){ return ORDER_STATUSES.find(s => s.value === v) || ORDER_STATUSES[0]; }

async function renderOrdersSection(){
  const root = document.getElementById('view-root');
  root.innerHTML = `
    <div class="section-toolbar">
      <div class="toolbar-filters">
        <select id="order-status-filter">
          <option value="">Todos los estados</option>
          ${ORDER_STATUSES.map(s => `<option value="${s.value}">${s.label}</option>`).join('')}
        </select>
      </div>
      <button type="button" class="btn btn-ghost" id="order-refresh-btn">↻ Actualizar</button>
    </div>
    <div class="data-card"><div id="order-table-wrap">Cargando…</div></div>
  `;
  document.getElementById('order-status-filter').addEventListener('change', (e) => {
    renderOrdersTable(filterOrders(e.target.value));
  });
  document.getElementById('order-refresh-btn').addEventListener('click', loadOrders);
  await loadOrders();
}

function filterOrders(status){
  if(!status) return ordersCache;
  return ordersCache.filter(o => o.status === status);
}

async function loadOrders(){
  const { data, error } = await sb.from('orders').select('*').order('created_at', { ascending:false });
  if(error){ showToast(sbErrorMsg(error), true); return; }
  ordersCache = data || [];
  const currentFilter = document.getElementById('order-status-filter')?.value || '';
  renderOrdersTable(filterOrders(currentFilter));
}

function renderOrdersTable(list){
  const wrap = document.getElementById('order-table-wrap');
  if(!wrap) return;
  if(list.length === 0){
    wrap.innerHTML = `<div class="empty-state"><span class="big-emoji">🧾</span>No hay pedidos con ese filtro todavía.</div>`;
    return;
  }
  wrap.innerHTML = `
    <table class="data-table">
      <thead><tr><th>Cliente</th><th>Fecha</th><th>Items</th><th>Total</th><th>Estado</th><th></th></tr></thead>
      <tbody>
        ${list.map(o => `
          <tr>
            <td>
              <div class="name-cell">${escapeHtml(o.customer_name || 'Sin nombre')}</div>
              <div class="cell-muted">${escapeHtml(o.customer_phone || '')}</div>
            </td>
            <td class="cell-muted">${fmtDate(o.created_at)}</td>
            <td class="cell-muted">${(o.items || []).length} plato(s)</td>
            <td>${fmtMoney(o.total)}</td>
            <td>
              <select class="status-select" data-id="${o.id}">
                ${ORDER_STATUSES.map(s => `<option value="${s.value}" ${o.status===s.value?'selected':''}>${s.label}</option>`).join('')}
              </select>
            </td>
            <td class="cell-actions">
              <button type="button" class="btn btn-ghost btn-sm" data-view="${o.id}">Ver detalle</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  wrap.querySelectorAll('.status-select').forEach(sel => {
    sel.addEventListener('change', () => updateOrderStatus(sel.dataset.id, sel.value));
  });
  wrap.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', () => openOrderDetail(ordersCache.find(x => x.id === btn.dataset.view)));
  });
}

async function updateOrderStatus(id, status){
  const { error } = await sb.from('orders').update({ status }).eq('id', id);
  if(error){ showToast(sbErrorMsg(error), true); return; }
  const o = ordersCache.find(x => x.id === id);
  if(o) o.status = status;
  showToast('Estado actualizado.');
}

function openOrderDetail(o){
  if(!o) return;
  const items = o.items || [];
  openModal(`Pedido de ${o.customer_name || 'cliente'}`, `
    <p class="cell-muted" style="margin-top:-6px;">${fmtDate(o.created_at)} · ${escapeHtml(o.customer_phone || '')}</p>
    <div class="data-card" style="margin:14px 0;">
      <table class="data-table">
        <thead><tr><th>Plato</th><th>Restaurante</th><th>Cant.</th><th>Precio</th></tr></thead>
        <tbody>
          ${items.map(it => `
            <tr>
              <td>${escapeHtml(it.name)}${it.selections && it.selections.length ? `<div class="cell-muted">${escapeHtml(it.selections.map(s => s.choices.map(c=>c.label).join(', ')).join(' · '))}</div>` : ''}</td>
              <td class="cell-muted">${escapeHtml(it.restaurantName || '')}</td>
              <td>${it.qty}</td>
              <td>${fmtMoney(it.price * it.qty)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div style="display:flex; flex-direction:column; gap:4px; font-size:14px; margin-bottom:14px;">
      <div style="display:flex; justify-content:space-between;"><span>Subtotal</span><strong>${fmtMoney(o.subtotal)}</strong></div>
      <div style="display:flex; justify-content:space-between;"><span>Envío</span><strong>${fmtMoney(o.delivery_fee)}</strong></div>
      ${o.tip ? `<div style="display:flex; justify-content:space-between;"><span>Propina</span><strong>${fmtMoney(o.tip)}</strong></div>` : ''}
      ${o.vip_fee ? `<div style="display:flex; justify-content:space-between;"><span>VIP</span><strong>${fmtMoney(o.vip_fee)}</strong></div>` : ''}
      <div style="display:flex; justify-content:space-between; font-size:16px; padding-top:6px; border-top:1px solid var(--border);"><span>Total</span><strong>${fmtMoney(o.total)}</strong></div>
    </div>
    ${o.address ? `<p><strong>📍 ${escapeHtml(o.address.label || '')}</strong><br>${escapeHtml(o.address.address || '')}${o.address.reference ? `<br><span class="cell-muted">Ref: ${escapeHtml(o.address.reference)}</span>` : ''}</p>` : ''}
    ${o.note ? `<p>📝 ${escapeHtml(o.note)}</p>` : ''}
    <div class="form-actions">
      <button type="button" class="btn btn-ghost" id="order-detail-close">Cerrar</button>
    </div>
  `);
  document.getElementById('order-detail-close').addEventListener('click', closeModal);
}
