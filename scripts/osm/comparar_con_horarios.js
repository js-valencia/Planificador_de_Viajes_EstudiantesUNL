// Comparación #4 [OSM]: tiempo de bus (rutas.json) contra tiempo en auto (OSRM).
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { rutas } = require('../../src/main/data/rutas.json');

const DIR = path.join(__dirname, '..', 'resultados', 'osm');
const { resultados } = JSON.parse(fs.readFileSync(path.join(DIR, 'osrm_resultados.json'), 'utf8'));

const COOPERATIVAS_ESTIMADAS = new Set(['Loja']);

const mediana = (xs) => {
  const o = [...xs].sort((a, b) => a - b);
  const m = Math.floor(o.length / 2);
  return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2;
};

const autoPorPar = new Map();
for (const r of resultados) if (!r.error) autoPorPar.set(`${r.origen}|${r.destino}`, r);

const filas = [];
for (const ruta of rutas) {
  const p = ruta.paradas;
  for (let i = 0; i < p.length - 1; i++) {
    for (let j = i + 1; j < p.length; j++) {
      const o = autoPorPar.get(`${p[i].terminal}|${p[j].terminal}`);
      if (!o) continue;
      const busMin = p[j].minutos - p[i].minutos;
      filas.push({
        ruta: ruta.id,
        cooperativa: ruta.cooperativa,
        origen: p[i].terminal,
        destino: p[j].terminal,
        busMin,
        autoMin: o.duracionMin,
        distanciaKm: o.distanciaKm,
        razon: busMin / o.duracionMin,
        fuente: COOPERATIVAS_ESTIMADAS.has(ruta.cooperativa) ? 'estimado' : 'verificado',
      });
    }
  }
}

const resumen = {};
for (const fuente of ['estimado', 'verificado']) {
  const f = filas.filter((x) => x.fuente === fuente);
  resumen[fuente] = f.length
    ? { tramos: f.length, medianaRazon: mediana(f.map((x) => x.razon)), busMasRapidoQueAuto: f.filter((x) => x.razon < 1).length }
    : { tramos: 0 };
}

function generarMarkdown() {
  const f1 = (x) => x.toFixed(1);
  const f2 = (x) => x.toFixed(2);
  const L = [];
  L.push('# Comparación bus y auto: rutas.json contra OSRM (issue #4)', '');
  L.push('- Bus: minutos entre paradas de `rutas.json`. En la cooperativa Loja son estimados; en la cooperativa Catamayo, verificados.');
  L.push('- Auto: duración calculada por OSRM (perfil `driving`) con datos de OpenStreetMap, sin paradas ni esperas.');
  L.push('- Razón = minutos de bus / minutos en auto. Mayor que 1 significa que el bus tarda más.', '');
  L.push('## Tramos comparados', '');
  L.push('| Ruta | Tramo | Bus (min) | Auto (min) | Distancia (km) | Razón bus/auto | Tiempo de bus |');
  L.push('| --- | --- | --- | --- | --- | --- | --- |');
  for (const x of filas) {
    L.push(`| ${x.ruta} | ${x.origen} - ${x.destino} | ${x.busMin} | ${f1(x.autoMin)} | ${f1(x.distanciaKm)} | ${f2(x.razon)} | ${x.fuente} |`);
  }
  L.push('', '## Resumen', '');
  L.push('| Tiempo de bus | Tramos | Mediana de la razón | Tramos donde el bus es más rápido que el auto |');
  L.push('| --- | --- | --- | --- |');
  for (const [fuente, r] of Object.entries(resumen)) {
    if (r.tramos) L.push(`| ${fuente} | ${r.tramos} | ${f2(r.medianaRazon)} | ${r.busMasRapidoQueAuto} |`);
  }
  L.push('');
  return L.join('\n');
}

fs.writeFileSync(path.join(DIR, 'comparacion_bus_auto.json'), JSON.stringify({ resumen, tramos: filas }, null, 2));
fs.writeFileSync(path.join(DIR, 'comparacion_bus_auto.md'), generarMarkdown());
console.log(`Listo: ${filas.length} tramos comparados. Archivos en scripts/resultados/osm/`);
console.log(resumen);