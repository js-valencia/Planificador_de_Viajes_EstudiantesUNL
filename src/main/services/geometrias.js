'use strict';
const fs = require('node:fs');
const path = require('node:path');

const ARCHIVO = path.join(__dirname, '..', 'data', 'geometrias.json');
const TOLERANCIA_GRADOS = 0.0002; 

let segmentos = null;

function cargar() {
  if (segmentos) return segmentos;
  try {
    segmentos = JSON.parse(fs.readFileSync(ARCHIVO, 'utf8')).segmentos || {};
  } catch {
    segmentos = {}; 
  }
  return segmentos;
}

// Douglas-Peucker iterativo (evita desbordar la pila con miles de puntos).
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

function segmento(a, b) {
  const datos = cargar();
  if (datos[`${a}|${b}`]) return datos[`${a}|${b}`].puntos;
  if (datos[`${b}|${a}`]) return [...datos[`${b}|${a}`].puntos].reverse(); 
  return null;
}

function trazadoTramo(paradasRuta, desde, hasta) {
  if (!Array.isArray(paradasRuta)) return null;
  const nombres = paradasRuta.map((p) => p.terminal);
  const i = nombres.indexOf(desde);
  const j = nombres.indexOf(hasta);
  if (i === -1 || j === -1 || i === j) return null;

  const paso = i < j ? 1 : -1;
  let puntos = [];
  for (let k = i; k !== j; k += paso) {
    const seg = segmento(nombres[k], nombres[k + paso]);
    if (!seg) return null; 
    puntos = puntos.concat(puntos.length ? seg.slice(1) : seg);
  }
  return simplificar(puntos, TOLERANCIA_GRADOS).map(([latitude, longitude]) => ({ latitude, longitude }));
}

module.exports = { trazadoTramo, simplificar };