'use strict';
const fs = require('node:fs');
const path = require('node:path');

const { terminales } = require('../../src/main/data/terminales.json');
const { rutas } = require('../../src/main/data/rutas.json');

const BASE_URL = process.env.OSRM_URL || 'https://router.project-osrm.org';
const PERFIL = 'driving';
const USER_AGENT = 'PlanificadorViajesUNL-EvaluacionOSM/1.0 (proyecto academico, Universidad Nacional de Loja)';
const PAUSA_MS = Number(process.env.OSRM_PAUSA_MS ?? 1100); // el servidor demo pide máx. 1 petición/segundo
const TIMEOUT_MS = 20000;
const SALIDA = path.join(__dirname, '..', '..', 'src', 'main', 'data', 'geometrias.json');

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const redondear = (n) => Number(n.toFixed(5));

function terminal(nombre) {
  const t = terminales.find((x) => x.nombre === nombre);
  if (!t) throw new Error(`No existe la terminal "${nombre}" en terminales.json`);
  return t;
}

// Pares únicos de paradas consecutivas dentro de cada ruta.
function segmentosUnicos() {
  const vistos = new Map();
  for (const ruta of rutas) {
    for (let i = 0; i < ruta.paradas.length - 1; i++) {
      const a = ruta.paradas[i].terminal;
      const b = ruta.paradas[i + 1].terminal;
      vistos.set(`${a}|${b}`, [a, b]);
    }
  }
  return [...vistos.entries()];
}

async function pedirTramo(origen, destino) {
  const coords = `${origen.lng},${origen.lat};${destino.lng},${destino.lat}`;
  const url = `${BASE_URL}/route/v1/${PERFIL}/${coords}?overview=full&geometries=geojson&steps=false`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.code !== 'Ok') throw new Error(`${json.code} ${json.message || ''}`.trim());
  const r = json.routes[0];
  return {
    distanciaKm: Number((r.distance / 1000).toFixed(1)),
    duracionAutoMin: Number((r.duration / 60).toFixed(1)),
    // GeoJSON viene como [lng, lat]; react-native-maps usa latitude/longitude, así que se guarda [lat, lng].
    puntos: r.geometry.coordinates.map(([lng, lat]) => [redondear(lat), redondear(lng)]),
  };
}

async function main() {
  const segmentos = segmentosUnicos();
  console.log(`Tramos a calcular: ${segmentos.length} (servicio: ${BASE_URL})`);
  const resultado = {};
  let fallidos = 0;

  for (let i = 0; i < segmentos.length; i++) {
    const [clave, [a, b]] = segmentos[i];
    try {
      const r = await pedirTramo(terminal(a), terminal(b));
      resultado[clave] = r;
      console.log(`  ${a} -> ${b}: ${r.distanciaKm} km, ${r.puntos.length} puntos`);
    } catch (e) {
      fallidos++;
      console.log(`  ${a} -> ${b}: ERROR ${e.message}`);
    }
    if (i < segmentos.length - 1) await esperar(PAUSA_MS);
  }

  const salida = {
    _aviso: 'Trazados por carretera calculados con OSRM sobre datos de OpenStreetMap (© colaboradores de OSM, ODbL). Son referenciales: no representan paradas ni horarios de buses.',
    meta: { servicio: BASE_URL, perfil: PERFIL, fecha: new Date().toISOString(), total: segmentos.length, fallidos },
    segmentos: resultado,
  };
  fs.writeFileSync(SALIDA, JSON.stringify(salida));
  console.log(`\nListo: ${segmentos.length - fallidos}/${segmentos.length} tramos. Archivo: src/main/data/geometrias.json`);
  if (fallidos > 0) process.exitCode = 1;
}

main();