// ============================================================
// LOCALES: horario, ubicación, teléfono, estado de atención
// ============================================================
// Nota de migración: la tabla `locales` en Supabase guarda las
// columnas en snake_case (direccion, lat, lng, envio_base...).
// Para no tocar el resto del código (que ya usa local.ubicacion.lat,
// local.envioBase, etc.) cada fila se "traduce" a ese mismo formato
// justo al leerla, en mapLocalRow().

let LOCALES = []; // caché en memoria, alimentada por Supabase + realtime
let filtroLocalActual = "todos";

function mapLocalRow(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    categoria: row.categoria,
    telefono: row.telefono,
    imagen: row.imagen,
    ubicacion: { direccion: row.direccion, lat: row.lat, lng: row.lng },
    envioBase: row.envio_base,
    envioPorKm: row.envio_por_km,
    horario: row.horario || {},
    forzarEstado: row.forzar_estado || "auto",
    creadoEn: row.creado_en,
    actualizadoEn: row.actualizado_en
  };
}

function initLocales() {
  renderHorarioBuilder();
  cargarLocales();

  // Tiempo real: cualquier cambio en la tabla vuelve a cargar la lista
  sb.channel("locales-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: TABLE.LOCALES }, () => cargarLocales())
    .subscribe();

  document.getElementById("btn-nuevo-local").addEventListener("click", () => abrirModalLocal());
  document.getElementById("btn-guardar-local").addEventListener("click", guardarLocal);
  document.getElementById("btn-ubicacion-actual").addEventListener("click", () => usarUbicacionActual("local-lat", "local-lng"));

  document.querySelectorAll("[data-filter-local]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-filter-local]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      filtroLocalActual = btn.dataset.filterLocal;
      renderLocales();
    });
  });

  // Refresca el estado "atendiendo ahora" cada minuto (por si cambia según la hora)
  setInterval(() => { renderLocales(); actualizarResumen(); }, 60000);
}

async function cargarLocales() {
  const { data, error } = await sb.from(TABLE.LOCALES).select("*").order("nombre");
  if (error) return toast("Error cargando locales: " + error.message, "error");
  LOCALES = (data || []).map(mapLocalRow);
  renderLocales();
  poblarSelectsLocales();
  actualizarResumen();
}

function renderHorarioBuilder(valores = {}) {
  const cont = document.getElementById("horario-builder");
  cont.innerHTML = DIAS_SEMANA.map(dia => {
    const v = valores[dia] || { abre: "08:00", cierra: "20:00", cerrado: false };
    return `
      <div class="horario-row" data-dia="${dia}">
        <label class="day">${DIAS_LABEL[dia]}</label>
        <input type="time" class="h-abre" value="${v.abre || "08:00"}" ${v.cerrado ? "disabled" : ""}>
        <input type="time" class="h-cierra" value="${v.cierra || "20:00"}" ${v.cerrado ? "disabled" : ""}>
        <label style="font-size:12px;display:flex;align-items:center;gap:4px;white-space:nowrap;">
          <input type="checkbox" class="h-cerrado" style="width:auto;" ${v.cerrado ? "checked" : ""}> Cerrado
        </label>
      </div>`;
  }).join("");

  cont.querySelectorAll(".h-cerrado").forEach(chk => {
    chk.addEventListener("change", () => {
      const row = chk.closest(".horario-row");
      row.querySelector(".h-abre").disabled = chk.checked;
      row.querySelector(".h-cierra").disabled = chk.checked;
    });
  });
}

function leerHorarioBuilder() {
  const horario = {};
  document.querySelectorAll("#horario-builder .horario-row").forEach(row => {
    const dia = row.dataset.dia;
    horario[dia] = {
      abre: row.querySelector(".h-abre").value,
      cierra: row.querySelector(".h-cierra").value,
      cerrado: row.querySelector(".h-cerrado").checked
    };
  });
  return horario;
}

function abrirModalLocal(local = null) {
  document.getElementById("form-local").reset();
  document.getElementById("modal-local-title").textContent = local ? "Editar local" : "Nuevo local";
  document.getElementById("local-id").value = local?.id || "";
  document.getElementById("local-nombre").value = local?.nombre || "";
  document.getElementById("local-categoria").value = local?.categoria || "";
  document.getElementById("local-telefono").value = local?.telefono || "";
  document.getElementById("local-imagen").value = local?.imagen || "";
  document.getElementById("local-direccion").value = local?.ubicacion?.direccion || "";
  document.getElementById("local-lat").value = local?.ubicacion?.lat ?? "";
  document.getElementById("local-lng").value = local?.ubicacion?.lng ?? "";
  document.getElementById("local-envio-base").value = local?.envioBase ?? 5;
  document.getElementById("local-envio-km").value = local?.envioPorKm ?? 1;
  document.getElementById("local-forzar-estado").value = local?.forzarEstado || "auto";
  renderHorarioBuilder(local?.horario || {});
  abrirModal("modal-local");
}

async function guardarLocal() {
  const nombre = document.getElementById("local-nombre").value.trim();
  const lat = parseFloat(document.getElementById("local-lat").value);
  const lng = parseFloat(document.getElementById("local-lng").value);
  if (!nombre) return toast("Ingresa el nombre del local", "error");
  if (isNaN(lat) || isNaN(lng)) return toast("Ingresa la latitud y longitud del local", "error");

  const id = document.getElementById("local-id").value;
  const btn = document.getElementById("btn-guardar-local");
  btn.disabled = true; btn.textContent = "Guardando...";

  try {
    const imagenUrl = document.getElementById("local-imagen").value.trim() || null;

    const data = {
      nombre,
      categoria: document.getElementById("local-categoria").value.trim(),
      telefono: document.getElementById("local-telefono").value.trim(),
      imagen: imagenUrl,
      direccion: document.getElementById("local-direccion").value.trim(),
      lat, lng,
      envio_base: parseFloat(document.getElementById("local-envio-base").value) || 0,
      envio_por_km: parseFloat(document.getElementById("local-envio-km").value) || 0,
      horario: leerHorarioBuilder(),
      forzar_estado: document.getElementById("local-forzar-estado").value,
      actualizado_en: new Date().toISOString()
    };

    if (id) {
      const { error } = await sb.from(TABLE.LOCALES).update(data).eq("id", id);
      if (error) throw error;
      toast("Local actualizado", "success");
    } else {
      const { error } = await sb.from(TABLE.LOCALES).insert(data);
      if (error) throw error;
      toast("Local creado", "success");
    }
    cerrarModal("modal-local");
    cargarLocales();
  } catch (err) {
    toast("Error al guardar: " + err.message, "error");
  } finally {
    btn.disabled = false; btn.textContent = "Guardar local";
  }
}

function renderLocales() {
  const cont = document.getElementById("grid-locales");
  let lista = LOCALES;
  if (filtroLocalActual === "atendiendo") lista = lista.filter(estaAtendiendo);
  if (filtroLocalActual === "cerrado") lista = lista.filter(l => !estaAtendiendo(l));

  if (!lista.length) {
    cont.innerHTML = `<div class="empty-state"><span class="leaf">🌿</span>No hay locales para mostrar. Crea el primero con "Nuevo local".</div>`;
    return;
  }

  cont.innerHTML = lista.map(local => {
    const abierto = estaAtendiendo(local);
    return `
    <div class="card local-card">
      <div class="thumb" style="background-image:url('${local.imagen || ""}')">
        <span class="status-pill ${abierto ? "on" : "off"}"><span class="dot"></span>${abierto ? "Atendiendo" : "Cerrado"}</span>
      </div>
      <div class="body">
        <h3>${escapeHtml(local.nombre)}</h3>
        <div class="meta">
          <span>${escapeHtml(local.categoria || "Sin categoría")}</span>
          <span>📞 ${escapeHtml(local.telefono || "-")}</span>
          <span>📍 ${escapeHtml(local.ubicacion?.direccion || `${local.ubicacion?.lat ?? ""}, ${local.ubicacion?.lng ?? ""}`)}</span>
          <span>🚚 Envío desde ${soles(local.envioBase)} + ${soles(local.envioPorKm)}/km</span>
        </div>
        <div class="actions">
          <button class="btn btn-outline btn-sm" data-edit-local="${local.id}">Editar</button>
          <button class="btn btn-danger btn-sm" data-del-local="${local.id}">Eliminar</button>
        </div>
      </div>
    </div>`;
  }).join("");

  cont.querySelectorAll("[data-edit-local]").forEach(b => b.addEventListener("click", () => abrirModalLocal(LOCALES.find(l => l.id === b.dataset.editLocal))));
  cont.querySelectorAll("[data-del-local]").forEach(b => b.addEventListener("click", () => eliminarLocal(b.dataset.delLocal)));
}

async function eliminarLocal(id) {
  const local = LOCALES.find(l => l.id === id);
  if (!confirmar(`¿Eliminar "${local?.nombre}"? Esto también eliminará todo su menú.`)) return;
  try {
    // El menú se borra solo: la tabla menus tiene "on delete cascade" hacia locales.
    const { error } = await sb.from(TABLE.LOCALES).delete().eq("id", id);
    if (error) throw error;
    toast("Local eliminado", "success");
    cargarLocales();
  } catch (err) {
    toast("Error al eliminar: " + err.message, "error");
  }
}

function poblarSelectsLocales() {
  const opciones = LOCALES.map(l => `<option value="${l.id}">${escapeHtml(l.nombre)}</option>`).join("");
  const selMenu = document.getElementById("select-local-menu");
  const selPed = document.getElementById("ped-select-local");
  [selMenu, selPed].forEach(sel => {
    const actual = sel.value;
    sel.innerHTML = `<option value="">Selecciona un local...</option>` + opciones;
    if (LOCALES.some(l => l.id === actual)) sel.value = actual;
  });
}

function usarUbicacionActual(idLat, idLng) {
  if (!navigator.geolocation) return toast("Tu navegador no soporta geolocalización", "error");
  navigator.geolocation.getCurrentPosition(
    pos => {
      document.getElementById(idLat).value = pos.coords.latitude.toFixed(6);
      document.getElementById(idLng).value = pos.coords.longitude.toFixed(6);
      toast("Ubicación obtenida", "success");
    },
    () => toast("No se pudo obtener tu ubicación", "error")
  );
}
