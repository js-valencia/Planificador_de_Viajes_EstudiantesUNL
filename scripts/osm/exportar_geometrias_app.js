// Issue #4 [OSM]: prepara los trazados OSM para la app móvil
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const ENTRADA = path.join(__dirname, '..', '..', 'src', 'main', 'data', 'geometrias.json');
const SALIDA = path.join(__dirname, '..', '..', 'mobile-app', 'src', 'data', 'geometriasOsm.json');
const TOLERANCIA_GRADOS = 0.0002; // ~20 m

// Douglas-Peucker iterativo
function simplificar(puntos, tolerancia) {
  if (puntos.length < 3) return puntos;
  const mantener = new Uint8Array(puntos.length);
  mantener[0] = 1;
  mantener[puntos.length - 1] = 1;
  const pila = [[0, puntos.length - 1]];
  while (pila.length) {
    const [ini, fin] = pila.pop();
    const [ay, ax] = puntos[ini];
    const [by, bx] = puntos[fin];
    const dx = bx - ax;
    const dy = by - ay;
    const largo2 = dx * dx + dy * dy;
    let maxDist = 0;
    let idx = -1;
    for (let i = ini + 1; i < fin; i++) {
      const [py, px] = puntos[i];
      let t = largo2 ? ((px - ax) * dx + (py - ay) * dy) / largo2 : 0;
      t = Math.max(0, Math.min(1, t));
      const d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
      if (d > maxDist) { maxDist = d; idx = i; }
    }
    if (maxDist > tolerancia && idx !== -1) {
      mantener[idx] = 1;
      pila.push([ini, idx], [idx, fin]);
    }
  }
  return puntos.filter((_, i) => mantener[i]);
}

const origen = JSON.parse(fs.readFileSync(ENTRADA, 'utf8'));
const segmentos = {};
let antes = 0;
let despues = 0;
for (const [clave, seg] of Object.entries(origen.segmentos || {})) {
  const reducido = simplificar(seg.puntos, TOLERANCIA_GRADOS);
  antes += seg.puntos.length;
  despues += reducido.length;
  segmentos[clave] = reducido;
}

fs.mkdirSync(path.dirname(SALIDA), { recursive: true });
fs.writeFileSync(SALIDA, JSON.stringify({
  _aviso: 'Trazados por carretera de OSRM sobre datos de OpenStreetMap (© colaboradores de OSM, ODbL). Solo para dibujar; no son paradas ni horarios de buses.',
  segmentos,
}));
const kb = Math.round(fs.statSync(SALIDA).size / 1024);
console.log(`Tramos: ${Object.keys(segmentos).length}. Puntos: ${antes} -> ${despues}. Archivo: mobile-app/src/data/geometriasOsm.json (${kb} KB)`);