// ============================================================
// UTILIDADES COMPARTIDAS
// ============================================================

/** Distancia en km entre dos coordenadas (fórmula de Haversine) */
function distanciaKm(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some(v => v === undefined || v === null || isNaN(v))) return 0;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calcula el costo de envío de un local según su tarifa base + costo por km,
 * usando la ubicación del cliente y la ubicación del local.
 */
function calcularEnvioLocal(local, clienteLat, clienteLng) {
  const base = Number(local.envioBase || 0);
  const porKm = Number(local.envioPorKm || 0);
  const km = distanciaKm(local.ubicacion?.lat, local.ubicacion?.lng, clienteLat, clienteLng);
  const costo = base + porKm * km;
  return { km: Math.round(km * 100) / 100, costo: Math.round(costo * 100) / 100 };
}

/** Suma los envíos de todos los locales distintos presentes en un pedido */
function calcularEnvioTotal(localesInvolucrados, clienteLat, clienteLng) {
  let total = 0;
  const detalle = [];
  localesInvolucrados.forEach(local => {
    const { km, costo } = calcularEnvioLocal(local, clienteLat, clienteLng);
    total += costo;
    detalle.push({ localId: local.id, nombre: local.nombre, km, costo });
  });
  return { total: Math.round(total * 100) / 100, detalle };
}

function soles(n) {
  return "S/ " + Number(n || 0).toFixed(2);
}

function fechaHora(ts) {
  if (!ts) return "-";
  const d = new Date(ts);
  if (isNaN(d)) return "-";
  return d.toLocaleString("es-PE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function uid(prefix = "id") {
  return prefix + "_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/** Días de la semana usados en los horarios de los locales */
const DIAS_SEMANA = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
const DIAS_LABEL = { lunes: "Lun", martes: "Mar", miercoles: "Mié", jueves: "Jue", viernes: "Vie", sabado: "Sáb", domingo: "Dom" };

/**
 * Determina si un local está atendiendo AHORA, combinando:
 * - override manual (forzarEstado: 'abierto' | 'cerrado' | 'auto')
 * - su horario semanal
 */
function estaAtendiendo(local) {
  if (local.forzarEstado === "cerrado") return false;
  if (local.forzarEstado === "abierto") return true;

  const horario = local.horario || {};
  const ahora = new Date();
  const diaKey = DIAS_SEMANA[(ahora.getDay() + 6) % 7]; // getDay(): 0=domingo
  const dia = horario[diaKey];
  if (!dia || dia.cerrado) return false;
  if (!dia.abre || !dia.cierra) return false;

  const [hA, mA] = dia.abre.split(":").map(Number);
  const [hC, mC] = dia.cierra.split(":").map(Number);
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
  const minA = hA * 60 + mA;
  const minC = hC * 60 + mC;

  if (minC > minA) return minutosAhora >= minA && minutosAhora <= minC;
  // horario que cruza medianoche (ej. 20:00 - 02:00)
  return minutosAhora >= minA || minutosAhora <= minC;
}

/** Toast simple de notificación */
function toast(msg, tipo = "info") {
  let cont = document.getElementById("toast-container");
  if (!cont) {
    cont = document.createElement("div");
    cont.id = "toast-container";
    document.body.appendChild(cont);
  }
  const el = document.createElement("div");
  el.className = "toast toast-" + tipo;
  el.textContent = msg;
  cont.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 300);
  }, 3200);
}

function confirmar(msg) {
  return window.confirm(msg);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
