// ============================================================
// DRIVERS (lado administrador): alta, edición, estado
// El panel donde el propio driver entra con su PIN y ve sus pedidos
// es un paso aparte, todavía no incluido en este proyecto.
// ============================================================

let DRIVERS = [];
let filtroDriverActual = "todos";

function mapDriverRow(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    telefono: row.telefono,
    vehiculo: row.vehiculo,
    pin: row.pin,
    estado: row.estado,
    creadoEn: row.creado_en
  };
}

function initDrivers() {
  cargarDrivers();

  sb.channel("drivers-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: TABLE.DRIVERS }, () => cargarDrivers())
    .subscribe();

  document.getElementById("btn-nuevo-driver").addEventListener("click", () => abrirModalDriver());
  document.getElementById("btn-guardar-driver").addEventListener("click", guardarDriver);

  document.querySelectorAll("[data-filter-driver]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-filter-driver]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      filtroDriverActual = btn.dataset.filterDriver;
      renderDrivers();
    });
  });
}

async function cargarDrivers() {
  const { data, error } = await sb.from(TABLE.DRIVERS).select("*").order("nombre");
  if (error) return toast("Error cargando drivers: " + error.message, "error");
  DRIVERS = (data || []).map(mapDriverRow);
  renderDrivers();
  actualizarResumen();
}

function abrirModalDriver(driver = null) {
  document.getElementById("form-driver").reset();
  document.getElementById("modal-driver-title").textContent = driver ? "Editar driver" : "Nuevo driver";
  document.getElementById("driver-id").value = driver?.id || "";
  document.getElementById("driver-nombre").value = driver?.nombre || "";
  document.getElementById("driver-telefono").value = driver?.telefono || "";
  document.getElementById("driver-vehiculo").value = driver?.vehiculo || "";
  document.getElementById("driver-pin").value = driver?.pin || "";
  document.getElementById("driver-estado").value = driver?.estado || "disponible";
  abrirModal("modal-driver");
}

async function guardarDriver() {
  const nombre = document.getElementById("driver-nombre").value.trim();
  const telefono = document.getElementById("driver-telefono").value.trim();
  const pin = document.getElementById("driver-pin").value.trim();
  if (!nombre || !telefono) return toast("Completa nombre y teléfono", "error");
  if (!/^\d{4}$/.test(pin)) return toast("El PIN debe tener 4 dígitos", "error");

  const id = document.getElementById("driver-id").value;
  const btn = document.getElementById("btn-guardar-driver");
  btn.disabled = true; btn.textContent = "Guardando...";
  try {
    const data = {
      nombre, telefono, pin,
      vehiculo: document.getElementById("driver-vehiculo").value.trim(),
      estado: document.getElementById("driver-estado").value
    };
    if (id) {
      const { error } = await sb.from(TABLE.DRIVERS).update(data).eq("id", id);
      if (error) throw error;
      toast("Driver actualizado", "success");
    } else {
      const { error } = await sb.from(TABLE.DRIVERS).insert(data);
      if (error) throw error;
      toast("Driver creado", "success");
    }
    cerrarModal("modal-driver");
    cargarDrivers();
  } catch (err) {
    toast("Error al guardar: " + err.message, "error");
  } finally {
    btn.disabled = false; btn.textContent = "Guardar driver";
  }
}

async function eliminarDriver(id) {
  const d = DRIVERS.find(x => x.id === id);
  if (!confirmar(`¿Eliminar al driver "${d?.nombre}"?`)) return;
  try {
    const { error } = await sb.from(TABLE.DRIVERS).delete().eq("id", id);
    if (error) throw error;
    toast("Driver eliminado", "success");
    cargarDrivers();
  } catch (err) {
    toast("Error al eliminar: " + err.message, "error");
  }
}

function renderDrivers() {
  const cont = document.getElementById("grid-drivers");
  let lista = DRIVERS;
  if (filtroDriverActual !== "todos") lista = lista.filter(d => d.estado === filtroDriverActual);

  if (!lista.length) {
    cont.innerHTML = `<div class="empty-state"><span class="leaf">🛵</span>No hay drivers para mostrar.</div>`;
    return;
  }

  const pillClass = { disponible: "on", ocupado: "wait", offline: "off" };
  const pillLabel = { disponible: "Disponible", ocupado: "Ocupado", offline: "Desconectado" };

  cont.innerHTML = lista.map(d => `
    <div class="card card-pad">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <h3 style="font-size:16px;">${escapeHtml(d.nombre)}</h3>
        <span class="status-pill ${pillClass[d.estado] || "off"}"><span class="dot"></span>${pillLabel[d.estado] || d.estado}</span>
      </div>
      <div class="meta" style="font-size:12.5px;color:var(--ink-soft);margin-top:6px;">
        <div>📞 ${escapeHtml(d.telefono)}</div>
        <div>🛵 ${escapeHtml(d.vehiculo || "No especificado")}</div>
        <div>PIN: <span class="mono">${escapeHtml(d.pin)}</span></div>
      </div>
      <div class="actions" style="margin-top:12px;">
        <button class="btn btn-outline btn-sm" data-edit-driver="${d.id}">Editar</button>
        <button class="btn btn-danger btn-sm" data-del-driver="${d.id}">Eliminar</button>
      </div>
    </div>
  `).join("");

  cont.querySelectorAll("[data-edit-driver]").forEach(b => b.addEventListener("click", () => abrirModalDriver(DRIVERS.find(d => d.id === b.dataset.editDriver))));
  cont.querySelectorAll("[data-del-driver]").forEach(b => b.addEventListener("click", () => eliminarDriver(b.dataset.delDriver)));
}
