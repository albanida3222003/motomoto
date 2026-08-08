// ============================================================
// LÓGICA DEL DRIVER: login por PIN, tomar pedidos, marcar tiempos
// ============================================================

let DRIVER_ACTUAL = null;
let PEDIDOS_DRIVER = [];

// Autenticación anónima de Firebase para que las reglas de seguridad
// puedan exigir request.auth != null sin pedirle una cuenta al driver.
auth.signInAnonymously().catch(err => console.error("Auth anónima falló:", err));

document.getElementById("form-driver-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const telefono = document.getElementById("dl-telefono").value.trim();
  const pin = document.getElementById("dl-pin").value.trim();
  const errEl = document.getElementById("dl-error");
  errEl.textContent = "";
  try {
    const snap = await db.collection(COL.DRIVERS).where("telefono", "==", telefono).where("pin", "==", pin).get();
    if (snap.empty) { errEl.textContent = "Teléfono o PIN incorrecto."; return; }
    const driver = { id: snap.docs[0].id, ...snap.docs[0].data() };
    localStorage.setItem("driverId", driver.id);
    entrarComoDriver(driver);
  } catch (err) {
    errEl.textContent = "Error al validar: " + err.message;
  }
});

document.getElementById("btn-driver-logout").addEventListener("click", () => {
  localStorage.removeItem("driverId");
  window.location.reload();
});

// Intentar sesión guardada
(async function autoLogin() {
  const savedId = localStorage.getItem("driverId");
  if (!savedId) return;
  try {
    const doc = await db.collection(COL.DRIVERS).doc(savedId).get();
    if (doc.exists) entrarComoDriver({ id: doc.id, ...doc.data() });
  } catch (e) { /* silencioso */ }
})();

function entrarComoDriver(driver) {
  DRIVER_ACTUAL = driver;
  document.getElementById("driver-login-wrap").style.display = "none";
  document.getElementById("driver-app").style.display = "block";
  document.getElementById("dv-nombre").textContent = driver.nombre;

  db.collection(COL.PEDIDOS)
    .where("estado", "in", ["confirmado", "en_camino"])
    .onSnapshot(snap => {
      PEDIDOS_DRIVER = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderPedidosDriver();
    }, err => toast("Error cargando pedidos: " + err.message, "error"));
}

function renderPedidosDriver() {
  const miPedido = PEDIDOS_DRIVER.find(p => p.driverId === DRIVER_ACTUAL.id && p.estado !== "entregado");
  const disponibles = PEDIDOS_DRIVER.filter(p => !p.driverId && p.estado === "confirmado");

  // ---- Mi pedido actual ----
  const contMi = document.getElementById("mi-pedido");
  if (!miPedido) {
    contMi.innerHTML = `<p class="helptext">No tienes un pedido en curso. Elige uno de la lista de abajo.</p>`;
  } else {
    const seg = miPedido.seguimiento || {};
    const pasos = [
      { key: "llegadaLocal", label: "Llegué al local" },
      { key: "recogioProducto", label: "Recogí el producto" },
      { key: "llegadaUbicacion", label: "Llegué a la ubicación del cliente" },
      { key: "entregado", label: "Entregué el pedido" }
    ];
    const siguienteIdx = pasos.findIndex(p => !seg[p.key]);

    contMi.innerHTML = `
      <div class="driver-order-card">
        <h4>${escapeHtml(miPedido.cliente?.nombre)} · ${soles(miPedido.total)}</h4>
        <div class="helptext">📍 ${escapeHtml(miPedido.cliente?.direccion || "Sin dirección de texto")}</div>
        <div class="helptext">📞 ${escapeHtml(miPedido.cliente?.telefono)}</div>
        <div class="helptext">Locales: ${(miPedido.localesNombres || []).join(", ")}</div>
        <ul class="timeline" style="margin-top:10px;">
          ${pasos.map(p => `<li class="${seg[p.key] ? "done" : ""}"><span class="tdot"></span><div><div class="tlabel">${p.label}</div><div class="ttime">${seg[p.key] ? fechaHora(seg[p.key]) : "Pendiente"}</div></div></li>`).join("")}
        </ul>
        ${siguienteIdx >= 0
          ? `<button class="btn btn-primary step-btn" data-marcar="${pasos[siguienteIdx].key}" data-ped="${miPedido.id}">Marcar: ${pasos[siguienteIdx].label}</button>`
          : `<p class="helptext" style="margin-top:8px;">✅ Pedido completado.</p>`}
      </div>
    `;
    const btn = contMi.querySelector("[data-marcar]");
    if (btn) btn.addEventListener("click", () => marcarPaso(btn.dataset.ped, btn.dataset.marcar));
  }

  // ---- Disponibles ----
  const contDisp = document.getElementById("pedidos-disponibles");
  if (miPedido) {
    contDisp.innerHTML = `<p class="helptext">Termina tu pedido actual antes de tomar otro.</p>`;
    return;
  }
  if (!disponibles.length) {
    contDisp.innerHTML = `<p class="helptext">No hay pedidos disponibles por el momento.</p>`;
    return;
  }
  contDisp.innerHTML = disponibles.map(p => `
    <div class="driver-order-card">
      <h4>${escapeHtml(p.cliente?.nombre)} · ${soles(p.total)}</h4>
      <div class="helptext">📍 ${escapeHtml(p.cliente?.direccion || "Sin dirección de texto")}</div>
      <div class="helptext">Locales: ${(p.localesNombres || []).join(", ")}</div>
      <div class="helptext">Envío: ${soles(p.envio)}</div>
      <button class="btn btn-accent step-btn" data-tomar="${p.id}">Tomar este pedido</button>
    </div>
  `).join("");
  contDisp.querySelectorAll("[data-tomar]").forEach(b => b.addEventListener("click", () => tomarPedido(b.dataset.tomar)));
}

async function tomarPedido(pedidoId) {
  try {
    await db.collection(COL.PEDIDOS).doc(pedidoId).update({
      driverId: DRIVER_ACTUAL.id,
      driverNombre: DRIVER_ACTUAL.nombre,
      estado: "en_camino"
    });
    await db.collection(COL.DRIVERS).doc(DRIVER_ACTUAL.id).update({ estado: "ocupado" });
    toast("Pedido asignado a ti", "success");
  } catch (err) {
    toast("Error al tomar el pedido: " + err.message, "error");
  }
}

async function marcarPaso(pedidoId, key) {
  try {
    const update = { [`seguimiento.${key}`]: firebase.firestore.FieldValue.serverTimestamp() };
    if (key === "entregado") update.estado = "entregado";
    await db.collection(COL.PEDIDOS).doc(pedidoId).update(update);
    if (key === "entregado") {
      await db.collection(COL.DRIVERS).doc(DRIVER_ACTUAL.id).update({ estado: "disponible" });
    }
    toast("Actualizado", "success");
  } catch (err) {
    toast("Error al marcar: " + err.message, "error");
  }
}
