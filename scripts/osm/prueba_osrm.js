// Evaluación #4 [OSM]: rutas por carretera con OSRM entre las terminales del proyecto.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { terminales } = require('../../src/main/data/terminales.json');

const BASE_URL = process.env.OSRM_URL || 'https://router.project-osrm.org';
const PERFIL = 'driving';
const USER_AGENT = 'PlanificadorViajesUNL-EvaluacionOSM/1.0 (proyecto academico, Universidad Nacional de Loja)';
const PAUSA_MS = Number(process.env.OSRM_PAUSA_MS ?? 1100); // el servidor de demostración pide máx. 1 petición por segundo
const TIMEOUT_MS = 20000;

const ORIGEN_BASE = 'Loja';
const PARES_EXTRA = [
  ['Catamayo', 'Catacocha'],
  ['Cariamanga', 'Macará'],
  ['Macará', 'Zapotillo'],
];

function buscarTerminal(nombre) {
  const t = terminales.find((x) => x.nombre === nombre);
  if (!t) throw new Error(`No existe la terminal "${nombre}" en terminales.json`);
  return t;
}

function construirPares() {
  const base = buscarTerminal(ORIGEN_BASE);
  const pares = terminales.filter((t) => t.nombre !== base.nombre).map((t) => [base, t]);
  for (const [a, b] of PARES_EXTRA) pares.push([buscarTerminal(a), buscarTerminal(b)]);
  return pares;
}

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// OSRM recibe las coordenadas como longitud,latitud 
async function pedirRuta(origen, destino) {
  const coords = `${origen.lng},${origen.lat};${destino.lng},${destino.lat}`;
  const url = `${BASE_URL}/route/v1/${PERFIL}/${coords}?overview=simplified&geometries=geojson&steps=false`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.code !== 'Ok') throw new Error(`${json.code} ${json.message || ''}`.trim());
  const ruta = json.routes[0];
  const [wo, wd] = json.waypoints;
  return {
    distanciaKm: ruta.distance / 1000,
    duracionMin: ruta.duration / 60,
    geometria: ruta.geometry,
    desvioOrigenM: wo.distance,
    desvioDestinoM: wd.distance,
    calleOrigen: wo.name || '',
    calleDestino: wd.name || '',
  };
}

function generarMarkdown(meta, filas) {
  const f1 = (x) => x.toFixed(1);
  const celda = (s) => (s ? s.replace(/\|/g, '/') : '(sin nombre)');
  const L = [];
  L.push('# Evaluación OSM: rutas con OSRM entre terminales (issue #4)', '');
  L.push(`- Servicio: OSRM (${meta.baseUrl}), perfil \`${meta.perfil}\``);
  L.push(`- Fecha de la prueba: ${meta.fecha} | Node ${meta.node}`);
  L.push(`- Pares probados: ${meta.total} (${meta.exitosos} con ruta, ${meta.fallidos} con error)`);
  L.push('- Datos de mapa: © colaboradores de OpenStreetMap (ODbL). Enrutamiento: OSRM.', '');
  L.push('## Resultados', '');
  L.push('| Origen | Destino | Distancia (km) | Duración en auto (min) | Desvío origen (m) | Desvío destino (m) | Vía origen | Vía destino |');
  L.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const r of filas) {
    if (r.error) {
      L.push(`| ${r.origen} | ${r.destino} | error: ${r.error} | | | | | |`);
    } else {
      L.push(`| ${r.origen} | ${r.destino} | ${f1(r.distanciaKm)} | ${f1(r.duracionMin)} | ${Math.round(r.desvioOrigenM)} | ${Math.round(r.desvioDestinoM)} | ${celda(r.calleOrigen)} | ${celda(r.calleDestino)} |`);
    }
  }
  L.push('', '## Cómo leer la tabla', '');
  L.push('- La duración es la de un vehículo liviano por calles y carreteras. No incluye paradas, esperas ni horarios de las cooperativas.');
  L.push('- "Desvío" es la distancia entre la coordenada de la terminal y el punto de la vía más cercano usado por OSRM. Un desvío grande indica que la coordenada no cae sobre una calle.');
  return L.join('\n') + '\n';
}

async function main() {
  const pares = construirPares();
  console.log(`Consultando ${pares.length} pares en ${BASE_URL} (pausa de ${PAUSA_MS} ms entre peticiones)...`);

  const filas = [];
  const rutasGeojson = [];
  for (let i = 0; i < pares.length; i++) {
    const [o, d] = pares[i];
    try {
      const r = await pedirRuta(o, d);
      filas.push({ origen: o.nombre, destino: d.nombre, ...r, geometria: undefined });
      rutasGeojson.push({
        type: 'Feature',
        properties: { origen: o.nombre, destino: d.nombre, distanciaKm: Number(r.distanciaKm.toFixed(1)), duracionMin: Number(r.duracionMin.toFixed(1)) },
        geometry: r.geometria,
      });
      console.log(`  ${o.nombre} -> ${d.nombre}: ${r.distanciaKm.toFixed(1)} km, ${r.duracionMin.toFixed(1)} min`);
    } catch (e) {
      filas.push({ origen: o.nombre, destino: d.nombre, error: e.message });
      console.log(`  ${o.nombre} -> ${d.nombre}: ERROR ${e.message}`);
    }
    if (i < pares.length - 1) await esperar(PAUSA_MS);
  }

  const exitosos = filas.filter((x) => !x.error).length;
  const meta = {
    baseUrl: BASE_URL,
    perfil: PERFIL,
    fecha: new Date().toISOString(),
    node: process.version,
    total: filas.length,
    exitosos,
    fallidos: filas.length - exitosos,
  };

  const dir = path.join(__dirname, '..', 'resultados', 'osm');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'osrm_resultados.json'), JSON.stringify({ meta, resultados: filas }, null, 2));
  fs.writeFileSync(path.join(dir, 'osrm_rutas.geojson'), JSON.stringify({ type: 'FeatureCollection', features: rutasGeojson }));
  fs.writeFileSync(path.join(dir, 'osrm_resultados.md'), generarMarkdown(meta, filas));
  console.log(`\nListo: ${exitosos}/${filas.length} rutas. Archivos en scripts/resultados/osm/`);
  if (exitosos === 0) process.exitCode = 1;
}

main();