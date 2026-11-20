const { mergeSort } = require('../sort/MergeSort');
const { compararRutas } = require('../sort/comparadorRutas');
const { rutas: RUTAS_BASE } = require('../../data/rutas.json');

const CONFIG_BUSQUEDA = Object.freeze({
  semilla: 20261118,
  tamanios: [1000, 50000, 500000],
  clavesAleatoriasPorTamanio: 20,   // claves exitosas extra, elegidas al azar con la semilla
  calentamiento: 5,                 // ejecuciones descartadas (JIT) antes de medir cada clave
  medicionesPorClave: 30,           // mediciones válidas por (algoritmo, n, clave)
  // Una medición = `repeticionesInternas` ejecuciones seguidas / ese número (búsquedas de microsegundos
  // no se pueden cronometrar de una en una). Se ajusta para que cada medición dure varios ms.
  repeticionesInternas: {
    secuencial: { 1000: 100, 50000: 5, 500000: 1 },
    binaria: { 1000: 5000, 50000: 5000, 500000: 5000 },
  },
});

// Generador pseudoaleatorio determinista (mulberry32); Math.random() haría irreproducible el benchmark.
function crearAleatorio(semilla) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function construirDatasetOrdenado(n, base = RUTAS_BASE) {
  if (!Number.isInteger(n) || n < 1) throw new RangeError('construirDatasetOrdenado: n debe ser un entero >= 1');
  const datos = new Array(n);
  for (let i = 0; i < n; i++) {
    const b = base[i % base.length];
    const k = Math.floor(i / base.length);
    datos[i] = k === 0 ? b : { ...b, id: `${b.id}-${String(k).padStart(6, '0')}` };
  }
  return mergeSort(datos, compararRutas);
}

/**
 * Claves exitosas (existen en el arreglo) y fallidas (no existen).
 *  - exitosas: primera (mejor caso secuencial), mitad, última (peor caso secuencial) y K aleatorias
 *    (caso promedio).
 *  - fallidas: menor que todas, intermedia (cae entre dos registros) y mayor que todas.
 */
function generarClaves(arreglo, semilla = CONFIG_BUSQUEDA.semilla, aleatorias = CONFIG_BUSQUEDA.clavesAleatoriasPorTamanio) {
  const n = arreglo.length;
  const aleatorio = crearAleatorio(semilla + n);
  const exitosas = [
    { etiqueta: 'primera', indiceEsperado: 0, clave: arreglo[0] },
    { etiqueta: 'mitad', indiceEsperado: n >> 1, clave: arreglo[n >> 1] },
    { etiqueta: 'ultima', indiceEsperado: n - 1, clave: arreglo[n - 1] },
  ];
  const usados = new Set([0, n >> 1, n - 1]);
  const objetivo = Math.min(aleatorias, Math.max(0, n - usados.size));
  for (let i = 0; i < objetivo; ) {
    const idx = Math.floor(aleatorio() * n);
    if (usados.has(idx)) continue;
    usados.add(idx);
    exitosas.push({ etiqueta: `aleatoria-${++i}`, indiceEsperado: idx, clave: arreglo[idx] });
  }
  const medio = arreglo[n >> 1];
  const fallidas = [
    { etiqueta: 'menor-que-todas', clave: { id: 'AAA-00', cooperativa: 'Aaa', nombre: 'Aaa - Loja' } },
    { etiqueta: 'intermedia', clave: { ...medio, id: `${medio.id}-x` } },
    { etiqueta: 'mayor-que-todas', clave: { id: 'ZZZ-99', cooperativa: 'Zamora', nombre: 'Zamora - Loja' } },
  ];
  return { exitosas, fallidas };
}

module.exports = { CONFIG_BUSQUEDA, crearAleatorio, construirDatasetOrdenado, generarClaves };
