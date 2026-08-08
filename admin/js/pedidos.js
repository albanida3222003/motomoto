// ============================================================
// PEDIDOS: creación (con opciones obligatorias e imágenes),
// cálculo de envío por ubicación, seguimiento y asignación de driver
// ============================================================

let PEDIDOS = [];
let filtroPedidoActual = "todos";
let pedidoEnConstruccion = { items: [] };
let menusDelLocalPedido = [];
let menusPedidoChannel = null;
let opcionSeleccionTemp = null; // { menu, local, cantidad, seleccion: {groupId: [opcionNombre,...]} }

function mapPedidoRow(row) {
  return {
    id: row.id,
    cliente: row.cliente,
    items: row.items || [],
    localesIds: row.locales_ids || [],
    localesNombres: row.locales_nombres || [],
    subtotal: row.subtotal,
    envio: row.envio,
    envioDetalle: row.envio_detalle || [],
    total: row.total,
    estado: row.estado,
    driverId: row.driver_id,
    driverNombre: row.driver_nombre,
    seguimiento: row.seguimiento || {},
    creadoEn: row.creado_en
  };
}

function initPedidos() {
  cargarPedidos();

  sb.channel("pedidos-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: TABLE.PEDIDOS }, () => cargarPedidos())
    .subscribe();

  document.getElementById("btn-nuevo-pedido").addEventListener("click", abrirModalPedido);
  document.getElementById("btn-ped-ubicacion").addEventListener("click", () => usarUbicacionActual("ped-cliente-lat", "ped-cliente-lng"));
  document.getElementById("ped-select-local").addEventListener("change", (e) => cargarMenuParaPedido(e.target.value));
  document.getElementById("btn-guardar-pedido").addEventListener("click", guardarPedido);
  document.getElementById("btn-confirmar-opciones").addEventListener("click", confirmarOpcionesItem);
  document.getElementById("btn-actualizar-pedido").addEventListener("click", actualizarPedidoDetalle);

  ["ped-cliente-lat", "ped-cliente-lng"].forEach(id => {
    document.getElementById(id).addEventListener("input", recalcularEnvioPedido);
  });

  document.querySelectorAll("[data-filter-pedido]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-filter-pedido]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      filtroPedidoActual = btn.dataset.filterPedido;
      renderPedidos();
    });
  });
}

async function cargarPedidos() {
  const { data, error } = await sb.from(TABLE.PEDIDOS).select("*").order("creado_en", { ascending: false });
  if (error) return toast("Error cargando pedidos: " + error.message, "error");
  PEDIDOS = (data || []).map(mapPedidoRow);
  renderPedidos();
  actualizarResumen();
}

// ---------- Construcción de pedido ----------

function abrirModalPedido() {
  pedidoEnConstruccion = { items: [] };
  document.getElementById("ped-cliente-nombre").value = "";
  document.getElementById("ped-cliente-telefono").value = "";
  document.getElementById("ped-cliente-direccion").value = "";
  document.getElementById("ped-cliente-lat").value = "";
  document.getElementById("ped-cliente-lng").value = "";
  document.getElementById("ped-select-local").value = "";
  document.getElementById("ped-menu-list").innerHTML = `<p class="helptext">Selecciona un local para ver sus platos disponibles.</p>`;
  renderResumenPedido();
  abrirModal("modal-pedido");
}

async function cargarMenuParaPedido(localId) {
  if (menusPedidoChannel) sb.removeChannel(menusPedidoChannel);
  const cont = document.getElementById("ped-menu-list");
  if (!localId) { cont.innerHTML = ""; return; }
  const local = LOCALES.find(l => l.id === localId);
  if (local && !estaAtendiendo(local)) {
    cont.innerHTML = `<p class="helptext" style="color:var(--danger)">⚠️ Este local no está atendiendo en este momento. Puedes igual crear el pedido si el cliente acepta esperar.</p>`;
  } else {
    cont.innerHTML = "";
  }

  const fetchMenu = async () => {
    const { data, error } = await sb.from(TABLE.MENUS).select("*").eq("local_id", localId).eq("disponible", true).order("nombre");
    if (error) { toast("Error cargando menú: " + error.message, "error"); return; }
    menusDelLocalPedido = (data || []).map(mapMenuRow);
    renderMenuListPedido(localId);
  };
  await fetchMenu();

  menusPedidoChannel = sb.channel("menus-pedido-" + localId)
    .on("postgres_changes", { event: "*", schema: "public", table: TABLE.MENUS, filter: "local_id=eq." + localId }, fetchMenu)
    .subscribe();
}

function renderMenuListPedido(localId) {
  const cont = document.getElementById("ped-menu-list");
  const aviso = cont.querySelector("p");
  if (!menusDelLocalPedido.length) {
    cont.innerHTML = (aviso ? aviso.outerHTML : "") + `<p class="helptext">Este local no tiene platos disponibles.</p>`;
    return;
  }
  cont.innerHTML = (aviso ? aviso.outerHTML : "") + menusDelLocalPedido.map(m => `
    <div class="menu-pick">
      <img src="${m.imagen || ""}" onerror="this.style.visibility='hidden'">
      <div class="info">
        <h4>${escapeHtml(m.nombre)}</h4>
        <div>${escapeHtml(m.descripcion || "")}</div>
        <div class="price">${soles(m.precio)}</div>
      </div>
      <button class="btn btn-accent btn-sm" data-add-item="${m.id}">Agregar</button>
    </div>
  `).join("");
  cont.querySelectorAll("[data-add-item]").forEach(b => {
    b.addEventListener("click", () => abrirOpcionesItem(b.dataset.addItem, localId));
  });
}

function abrirOpcionesItem(menuId, localId) {
  const menu = menusDelLocalPedido.find(m => m.id === menuId);
  const local = LOCALES.find(l => l.id === localId);
  opcionSeleccionTemp = { menu, local, cantidad: 1, seleccion: {} };

  document.getElementById("opt-item-nombre").textContent = menu.nombre;
  const grupos = menu.gruposOpciones || [];
  let html = `
    <div class="field">
      <label>Cantidad</label>
      <input type="number" id="oi-cantidad" min="1" value="1">
    </div>`;

  grupos.forEach(g => {
    html += `<div class="section-title">${escapeHtml(g.nombre)} ${g.obligatorio ? "<span style='color:var(--danger)'>*</span>" : "(opcional)"}</div>`;
    html += `<p class="helptext">${g.tipo === "unica" ? "Elige 1 opción" : `Elige entre ${g.min} y ${g.max} opciones`}</p>`;
    const inputType = g.tipo === "unica" ? "radio" : "checkbox";
    g.opciones.forEach((op, idx) => {
      html += `
        <label style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:13.5px;">
          <input type="${inputType}" name="grupo-${g.id}" value="${idx}" data-group="${g.id}">
          ${escapeHtml(op.nombre)} ${op.precioExtra ? `<span style="color:var(--ink-soft)">(+${soles(op.precioExtra)})</span>` : ""}
        </label>`;
    });
  });

  document.getElementById("opt-item-body").innerHTML = html;
  abrirModal("modal-opciones-item");
}

function confirmarOpcionesItem() {
  const { menu, local } = opcionSeleccionTemp;
  const cantidad = parseInt(document.getElementById("oi-cantidad").value) || 1;
  const grupos = menu.gruposOpciones || [];
  const seleccionFinal = [];
  let precioExtraTotal = 0;

  for (const g of grupos) {
    const inputs = [...document.querySelectorAll(`input[data-group="${g.id}"]:checked`)];
    if (g.obligatorio && inputs.length < Math.max(1, g.min || 1)) {
      return toast(`Debes elegir "${g.nombre}" (mínimo ${g.min || 1})`, "error");
    }
    if (g.tipo === "multiple" && inputs.length > (g.max || 99)) {
      return toast(`Máximo ${g.max} opciones para "${g.nombre}"`, "error");
    }
    const nombres = inputs.map(inp => {
      const op = g.opciones[parseInt(inp.value)];
      precioExtraTotal += op.precioExtra || 0;
      return op.nombre;
    });
    if (nombres.length) seleccionFinal.push({ grupo: g.nombre, seleccion: nombres });
  }

  const precioUnitario = menu.precio + precioExtraTotal;
  pedidoEnConstruccion.items.push({
    localId: local.id,
    localNombre: local.nombre,
    menuId: menu.id,
    nombre: menu.nombre,
    imagen: menu.imagen || null,
    cantidad,
    precioUnitario,
    opciones: seleccionFinal,
    subtotalItem: Math.round(precioUnitario * cantidad * 100) / 100
  });

  cerrarModal("modal-opciones-item");
  renderResumenPedido();
  toast("Producto agregado", "success");
}

function renderResumenPedido() {
  const cont = document.getElementById("ped-items-resumen");
  if (!pedidoEnConstruccion.items.length) {
    cont.innerHTML = `<p class="helptext">Aún no agregaste productos.</p>`;
  } else {
    cont.innerHTML = pedidoEnConstruccion.items.map((it, idx) => `
      <div class="pedido-item-line">
        <div style="display:flex;">
          <img src="${it.imagen || ""}" onerror="this.style.display='none'">
          <div>
            <strong>${it.cantidad}× ${escapeHtml(it.nombre)}</strong> <span style="color:var(--ink-soft)">(${escapeHtml(it.localNombre)})</span>
            ${it.opciones.length ? `<div class="opts">${it.opciones.map(o => `${escapeHtml(o.grupo)}: ${o.seleccion.join(", ")}`).join(" · ")}</div>` : ""}
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <strong>${soles(it.subtotalItem)}</strong>
          <button type="button" class="btn-icon" data-del-item="${idx}">✕</button>
        </div>
      </div>
    `).join("");
    cont.querySelectorAll("[data-del-item]").forEach(b => b.addEventListener("click", () => {
      pedidoEnConstruccion.items.splice(parseInt(b.dataset.delItem), 1);
      renderResumenPedido();
    }));
  }
  recalcularEnvioPedido();
}

function recalcularEnvioPedido() {
  const subtotal = pedidoEnConstruccion.items.reduce((s, it) => s + it.subtotalItem, 0);
  const lat = parseFloat(document.getElementById("ped-cliente-lat").value);
  const lng = parseFloat(document.getElementById("ped-cliente-lng").value);

  document.getElementById("ped-subtotal").textContent = soles(subtotal);

  const localesIds = [...new Set(pedidoEnConstruccion.items.map(it => it.localId))];
  const localesObjs = localesIds.map(id => LOCALES.find(l => l.id === id)).filter(Boolean);

  if (!localesObjs.length || isNaN(lat) || isNaN(lng)) {
    document.getElementById("ped-envio").textContent = soles(0);
    document.getElementById("ped-envio-detalle").textContent = "";
    document.getElementById("ped-total").textContent = soles(subtotal);
    pedidoEnConstruccion._envioCalc = { total: 0, detalle: [] };
    return;
  }

  const { total, detalle } = calcularEnvioTotal(localesObjs, lat, lng);
  document.getElementById("ped-envio").textContent = soles(total);
  document.getElementById("ped-envio-detalle").textContent = detalle.length > 1
    ? `Envío de ${detalle.length} locales: ` + detalle.map(d => `${d.nombre} (${d.km} km, ${soles(d.costo)})`).join(" · ")
    : detalle.map(d => `${d.km} km desde ${d.nombre}`).join("");
  document.getElementById("ped-total").textContent = soles(subtotal + total);
  pedidoEnConstruccion._envioCalc = { total, detalle };
}

async function guardarPedido() {
  const nombre = document.getElementById("ped-cliente-nombre").value.trim();
  const telefono = document.getElementById("ped-cliente-telefono").value.trim();
  const lat = parseFloat(document.getElementById("ped-cliente-lat").value);
  const lng = parseFloat(document.getElementById("ped-cliente-lng").value);

  if (!nombre || !telefono) return toast("Completa los datos del cliente", "error");
  if (isNaN(lat) || isNaN(lng)) return toast("Ingresa la ubicación del cliente", "error");
  if (!pedidoEnConstruccion.items.length) return toast("Agrega al menos un producto", "error");

  const subtotal = pedidoEnConstruccion.items.reduce((s, it) => s + it.subtotalItem, 0);
  const envio = pedidoEnConstruccion._envioCalc || { total: 0, detalle: [] };

  const btn = document.getElementById("btn-guardar-pedido");
  btn.disabled = true; btn.textContent = "Guardando...";
  try {
    const { error } = await sb.from(TABLE.PEDIDOS).insert({
      cliente: {
        nombre, telefono,
        direccion: document.getElementById("ped-cliente-direccion").value.trim(),
        lat, lng
      },
      items: pedidoEnConstruccion.items,
      locales_ids: [...new Set(pedidoEnConstruccion.items.map(it => it.localId))],
      locales_nombres: [...new Set(pedidoEnConstruccion.items.map(it => it.localNombre))],
      subtotal: Math.round(subtotal * 100) / 100,
      envio: envio.total,
      envio_detalle: envio.detalle,
      total: Math.round((subtotal + envio.total) * 100) / 100,
      estado: "confirmado",
      driver_id: null,
      driver_nombre: null,
      seguimiento: { llegadaLocal: null, recogioProducto: null, llegadaUbicacion: null, entregado: null }
    });
    if (error) throw error;
    toast("Pedido creado", "success");
    cerrarModal("modal-pedido");
    cargarPedidos();
  } catch (err) {
    toast("Error al crear pedido: " + err.message, "error");
  } finally {
    btn.disabled = false; btn.textContent = "Confirmar pedido";
  }
}

// ---------- Listado y detalle ----------

const ESTADO_LABEL = { pendiente: "Pendiente", confirmado: "Confirmado", en_camino: "En camino", entregado: "Entregado", cancelado: "Cancelado" };

function renderPedidos() {
  const tbody = document.querySelector("#tbl-pedidos tbody");
  let lista = PEDIDOS;
  if (filtroPedidoActual !== "todos") lista = lista.filter(p => p.estado === filtroPedidoActual);

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="9" class="empty-state">No hay pedidos con este filtro.</td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(p => `
    <tr data-open-pedido="${p.id}" style="cursor:pointer">
      <td class="mono">${p.id.slice(0, 6)}</td>
      <td>${escapeHtml(p.cliente?.nombre || "-")}</td>
      <td>${(p.localesNombres || []).join(", ")}</td>
      <td>${soles(p.total)}</td>
      <td>${soles(p.envio)}</td>
      <td>${escapeHtml(p.driverNombre || "Sin asignar")}</td>
      <td><span class="badge-estado est-${p.estado}">${ESTADO_LABEL[p.estado] || p.estado}</span></td>
      <td>${fechaHora(p.creadoEn)}</td>
      <td><button class="btn btn-outline btn-sm" data-open-pedido2="${p.id}">Ver</button></td>
    </tr>
  `).join("");

  tbody.querySelectorAll("[data-open-pedido], [data-open-pedido2]").forEach(el => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = el.dataset.openPedido || el.dataset.openPedido2;
      abrirDetallePedido(id);
    });
  });

  // tabla resumen (últimos 6)
  const tbodyResumen = document.querySelector("#tbl-resumen-pedidos tbody");
  if (tbodyResumen) {
    tbodyResumen.innerHTML = PEDIDOS.slice(0, 6).map(p => `
      <tr>
        <td class="mono">${p.id.slice(0, 6)}</td>
        <td>${escapeHtml(p.cliente?.nombre || "-")}</td>
        <td>${(p.localesNombres || []).join(", ")}</td>
        <td>${soles(p.total)}</td>
        <td><span class="badge-estado est-${p.estado}">${ESTADO_LABEL[p.estado] || p.estado}</span></td>
        <td>${fechaHora(p.creadoEn)}</td>
      </tr>
    `).join("") || `<tr><td colspan="6" class="empty-state">Sin pedidos aún.</td></tr>`;
  }
}

let pedidoDetalleActualId = null;

function abrirDetallePedido(id) {
  const p = PEDIDOS.find(x => x.id === id);
  if (!p) return;
  pedidoDetalleActualId = id;
  document.getElementById("det-ped-id").textContent = id.slice(0, 8);

  document.getElementById("det-cliente").innerHTML = `
    <div class="kv"><span>Nombre</span><strong>${escapeHtml(p.cliente?.nombre)}</strong></div>
    <div class="kv"><span>Teléfono</span><strong>${escapeHtml(p.cliente?.telefono)}</strong></div>
    <div class="kv"><span>Dirección</span><strong>${escapeHtml(p.cliente?.direccion || "-")}</strong></div>
    <div class="kv"><span>Coordenadas</span><strong class="mono">${p.cliente?.lat?.toFixed(5)}, ${p.cliente?.lng?.toFixed(5)}</strong></div>
  `;

  document.getElementById("det-items").innerHTML = p.items.map(it => `
    <div class="pedido-item-line">
      <div style="display:flex;">
        <img src="${it.imagen || ""}" onerror="this.style.display='none'">
        <div>
          <strong>${it.cantidad}× ${escapeHtml(it.nombre)}</strong> <span style="color:var(--ink-soft)">(${escapeHtml(it.localNombre)})</span>
          ${it.opciones?.length ? `<div class="opts">${it.opciones.map(o => `${escapeHtml(o.grupo)}: ${o.seleccion.join(", ")}`).join(" · ")}</div>` : ""}
        </div>
      </div>
      <strong>${soles(it.subtotalItem)}</strong>
    </div>
  `).join("");

  document.getElementById("det-subtotal").textContent = soles(p.subtotal);
  document.getElementById("det-envio").textContent = soles(p.envio) + (p.envioDetalle?.length > 1 ? ` (${p.envioDetalle.length} locales)` : "");
  document.getElementById("det-total").textContent = soles(p.total);
  document.getElementById("det-estado").value = p.estado;

  const selDriver = document.getElementById("det-driver");
  selDriver.innerHTML = `<option value="">Sin asignar</option>` + (DRIVERS || []).map(d => `<option value="${d.id}">${escapeHtml(d.nombre)}</option>`).join("");
  selDriver.value = p.driverId || "";

  const seg = p.seguimiento || {};
  const pasos = [
    ["llegadaLocal", "Driver llegó al local"],
    ["recogioProducto", "Recogió el producto"],
    ["llegadaUbicacion", "Llegó a la ubicación del cliente"],
    ["entregado", "Pedido entregado"]
  ];
  document.getElementById("det-timeline").innerHTML = pasos.map(([key, label]) => `
    <li class="${seg[key] ? "done" : ""}">
      <span class="tdot"></span>
      <div><div class="tlabel">${label}</div><div class="ttime">${seg[key] ? fechaHora(seg[key]) : "Pendiente"}</div></div>
    </li>
  `).join("");

  abrirModal("modal-detalle-pedido");
}

async function actualizarPedidoDetalle() {
  if (!pedidoDetalleActualId) return;
  const estado = document.getElementById("det-estado").value;
  const driverId = document.getElementById("det-driver").value || null;
  const driver = (DRIVERS || []).find(d => d.id === driverId);
  try {
    const { error } = await sb.from(TABLE.PEDIDOS).update({
      estado,
      driver_id: driverId,
      driver_nombre: driver ? driver.nombre : null
    }).eq("id", pedidoDetalleActualId);
    if (error) throw error;
    toast("Pedido actualizado", "success");
    cerrarModal("modal-detalle-pedido");
    cargarPedidos();
  } catch (err) {
    toast("Error al actualizar: " + err.message, "error");
  }
}

function actualizarResumen() {
  const elLocales = document.getElementById("st-locales");
  const elAbiertos = document.getElementById("st-abiertos");
  const elPendientes = document.getElementById("st-pendientes");
  const elCamino = document.getElementById("st-camino");
  const elDrivers = document.getElementById("st-drivers");
  if (!elLocales) return;

  elLocales.textContent = LOCALES.length;
  elAbiertos.textContent = LOCALES.filter(estaAtendiendo).length;
  const pendientes = PEDIDOS.filter(p => p.estado === "pendiente").length;
  elPendientes.textContent = pendientes;
  elCamino.textContent = PEDIDOS.filter(p => p.estado === "en_camino").length;
  elDrivers.textContent = (DRIVERS || []).filter(d => d.estado === "disponible").length;

  const badge = document.getElementById("badge-pedidos");
  if (pendientes > 0) { badge.style.display = "inline-block"; badge.textContent = pendientes; }
  else badge.style.display = "none";
}
