// ============================================================
// MENÚS: platos por local, con grupos de opciones obligatorias/opcionales
// ============================================================

let MENUS_LOCAL_ACTUAL = null; // id del local seleccionado
let MENUS_CACHE = [];
let menusChannel = null;
let groupCounter = 0;

function mapMenuRow(row) {
  return {
    id: row.id,
    localId: row.local_id,
    nombre: row.nombre,
    precio: row.precio,
    descripcion: row.descripcion,
    imagen: row.imagen,
    disponible: row.disponible,
    gruposOpciones: row.grupos_opciones || [],
    creadoEn: row.creado_en,
    actualizadoEn: row.actualizado_en
  };
}

function initMenus() {
  document.getElementById("select-local-menu").addEventListener("change", (e) => {
    MENUS_LOCAL_ACTUAL = e.target.value || null;
    document.getElementById("btn-nuevo-menu").disabled = !MENUS_LOCAL_ACTUAL;
    escucharMenus();
  });

  document.getElementById("btn-nuevo-menu").addEventListener("click", () => abrirModalMenu());
  document.getElementById("btn-guardar-menu").addEventListener("click", guardarMenu);
  document.getElementById("btn-add-group").addEventListener("click", () => agregarGrupoOpciones());
}

async function cargarMenus() {
  if (!MENUS_LOCAL_ACTUAL) return;
  const { data, error } = await sb.from(TABLE.MENUS).select("*").eq("local_id", MENUS_LOCAL_ACTUAL).order("nombre");
  if (error) return toast("Error cargando menú: " + error.message, "error");
  MENUS_CACHE = (data || []).map(mapMenuRow);
  renderMenus();
}

function escucharMenus() {
  if (menusChannel) sb.removeChannel(menusChannel);
  const cont = document.getElementById("grid-menus");
  if (!MENUS_LOCAL_ACTUAL) {
    cont.innerHTML = `<div class="empty-state"><span class="leaf">🍽️</span>Selecciona un local para ver y administrar su menú.</div>`;
    return;
  }
  cargarMenus();
  menusChannel = sb.channel("menus-changes-" + MENUS_LOCAL_ACTUAL)
    .on("postgres_changes", { event: "*", schema: "public", table: TABLE.MENUS, filter: "local_id=eq." + MENUS_LOCAL_ACTUAL }, () => cargarMenus())
    .subscribe();
}

function renderMenus() {
  const cont = document.getElementById("grid-menus");
  if (!MENUS_CACHE.length) {
    cont.innerHTML = `<div class="empty-state"><span class="leaf">🍽️</span>Este local aún no tiene platos. Agrega el primero.</div>`;
    return;
  }
  cont.innerHTML = MENUS_CACHE.map(m => `
    <div class="card local-card">
      <div class="thumb" style="background-image:url('${m.imagen || ""}')">
        <span class="status-pill ${m.disponible ? "on" : "off"}">${m.disponible ? "Disponible" : "Pausado"}</span>
      </div>
      <div class="body">
        <h3>${escapeHtml(m.nombre)}</h3>
        <div class="meta">
          <span>${soles(m.precio)}</span>
          <span>${escapeHtml(m.descripcion || "")}</span>
          <span>${(m.gruposOpciones || []).map(g => `<span class="tag">${escapeHtml(g.nombre)}${g.obligatorio ? " *" : ""}</span>`).join("") || "Sin opciones adicionales"}</span>
        </div>
        <div class="actions">
          <button class="btn btn-outline btn-sm" data-edit-menu="${m.id}">Editar</button>
          <button class="btn btn-danger btn-sm" data-del-menu="${m.id}">Eliminar</button>
        </div>
      </div>
    </div>
  `).join("");

  cont.querySelectorAll("[data-edit-menu]").forEach(b => b.addEventListener("click", () => abrirModalMenu(MENUS_CACHE.find(m => m.id === b.dataset.editMenu))));
  cont.querySelectorAll("[data-del-menu]").forEach(b => b.addEventListener("click", () => eliminarMenu(b.dataset.delMenu)));
}

function abrirModalMenu(menu = null) {
  document.getElementById("form-menu").reset();
  document.getElementById("modal-menu-title").textContent = menu ? "Editar ítem de menú" : "Nuevo ítem de menú";
  document.getElementById("menu-id").value = menu?.id || "";
  document.getElementById("menu-nombre").value = menu?.nombre || "";
  document.getElementById("menu-precio").value = menu?.precio || "";
  document.getElementById("menu-descripcion").value = menu?.descripcion || "";
  document.getElementById("menu-imagen").value = menu?.imagen || "";
  document.getElementById("menu-disponible").checked = menu ? !!menu.disponible : true;

  const cont = document.getElementById("opt-groups");
  cont.innerHTML = "";
  groupCounter = 0;
  (menu?.gruposOpciones || []).forEach(g => agregarGrupoOpciones(g));

  abrirModal("modal-menu");
}

function agregarGrupoOpciones(grupo = null) {
  groupCounter++;
  const gid = "g" + groupCounter;
  const wrap = document.createElement("div");
  wrap.className = "opt-group";
  wrap.dataset.gid = gid;
  wrap.innerHTML = `
    <div class="opt-group-head">
      <div class="field" style="margin:0;"><label>Nombre del grupo</label><input type="text" class="g-nombre" placeholder="Elige tu entrada" value="${escapeHtml(grupo?.nombre || "")}"></div>
      <div class="field" style="margin:0;flex:0 0 140px;">
        <label>Tipo</label>
        <select class="g-tipo">
          <option value="unica" ${grupo?.tipo === "unica" ? "selected" : ""}>Elige 1 (única)</option>
          <option value="multiple" ${grupo?.tipo === "multiple" ? "selected" : ""}>Elige varias</option>
        </select>
      </div>
      <div class="field" style="margin:0;flex:0 0 70px;"><label>Mín.</label><input type="number" class="g-min" min="0" value="${grupo?.min ?? 1}"></div>
      <div class="field" style="margin:0;flex:0 0 70px;"><label>Máx.</label><input type="number" class="g-max" min="1" value="${grupo?.max ?? 1}"></div>
      <button type="button" class="btn-icon g-del" title="Eliminar grupo">🗑️</button>
    </div>
    <label style="font-size:12px;display:flex;align-items:center;gap:6px;margin-bottom:10px;">
      <input type="checkbox" class="g-obligatorio" style="width:auto;" ${grupo?.obligatorio !== false ? "checked" : ""}> Obligatorio para completar el pedido
    </label>
    <div class="g-items"></div>
    <button type="button" class="btn btn-outline btn-sm g-add-item">+ Agregar opción</button>
  `;
  document.getElementById("opt-groups").appendChild(wrap);

  const itemsCont = wrap.querySelector(".g-items");
  const addItem = (op = null) => {
    const row = document.createElement("div");
    row.className = "opt-item-row";
    row.innerHTML = `
      <input type="text" class="oi-nombre" placeholder="Ej: Entrada de yuca / Sabor BBQ" value="${escapeHtml(op?.nombre || "")}">
      <input type="number" step="0.5" class="oi-extra" placeholder="Extra S/" style="max-width:100px;" value="${op?.precioExtra ?? 0}">
      <button type="button" class="btn-icon oi-del">✕</button>
    `;
    row.querySelector(".oi-del").addEventListener("click", () => row.remove());
    itemsCont.appendChild(row);
  };
  if (grupo?.opciones?.length) {
    grupo.opciones.forEach(op => addItem(op));
  } else {
    addItem(); addItem();
  }

  wrap.querySelector(".g-add-item").addEventListener("click", () => addItem());
  wrap.querySelector(".g-del").addEventListener("click", () => wrap.remove());
}

function leerGruposOpciones() {
  const grupos = [];
  document.querySelectorAll("#opt-groups .opt-group").forEach(wrap => {
    const nombre = wrap.querySelector(".g-nombre").value.trim();
    if (!nombre) return;
    const opciones = [...wrap.querySelectorAll(".oi-nombre")]
      .map((inp, i) => ({
        nombre: inp.value.trim(),
        precioExtra: parseFloat(wrap.querySelectorAll(".oi-extra")[i].value) || 0
      }))
      .filter(o => o.nombre);
    if (!opciones.length) return;
    grupos.push({
      id: wrap.dataset.gid,
      nombre,
      tipo: wrap.querySelector(".g-tipo").value,
      obligatorio: wrap.querySelector(".g-obligatorio").checked,
      min: parseInt(wrap.querySelector(".g-min").value) || 0,
      max: parseInt(wrap.querySelector(".g-max").value) || 1,
      opciones
    });
  });
  return grupos;
}

async function guardarMenu() {
  if (!MENUS_LOCAL_ACTUAL) return toast("Selecciona un local primero", "error");
  const nombre = document.getElementById("menu-nombre").value.trim();
  const precio = parseFloat(document.getElementById("menu-precio").value);
  if (!nombre || isNaN(precio)) return toast("Completa nombre y precio", "error");

  const id = document.getElementById("menu-id").value;
  const btn = document.getElementById("btn-guardar-menu");
  btn.disabled = true; btn.textContent = "Guardando...";

  try {
    const imagenUrl = document.getElementById("menu-imagen").value.trim() || null;

    const data = {
      local_id: MENUS_LOCAL_ACTUAL,
      nombre,
      precio,
      descripcion: document.getElementById("menu-descripcion").value.trim(),
      imagen: imagenUrl,
      disponible: document.getElementById("menu-disponible").checked,
      grupos_opciones: leerGruposOpciones(),
      actualizado_en: new Date().toISOString()
    };

    if (id) {
      const { error } = await sb.from(TABLE.MENUS).update(data).eq("id", id);
      if (error) throw error;
      toast("Ítem actualizado", "success");
    } else {
      const { error } = await sb.from(TABLE.MENUS).insert(data);
      if (error) throw error;
      toast("Ítem agregado al menú", "success");
    }
    cerrarModal("modal-menu");
    cargarMenus();
  } catch (err) {
    toast("Error al guardar: " + err.message, "error");
  } finally {
    btn.disabled = false; btn.textContent = "Guardar ítem";
  }
}

async function eliminarMenu(id) {
  if (!confirmar("¿Eliminar este ítem del menú?")) return;
  try {
    const { error } = await sb.from(TABLE.MENUS).delete().eq("id", id);
    if (error) throw error;
    toast("Ítem eliminado", "success");
    cargarMenus();
  } catch (err) {
    toast("Error al eliminar: " + err.message, "error");
  }
}
