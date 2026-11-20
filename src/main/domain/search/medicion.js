/**
 * Medición de una búsqueda con performance.now() (node:perf_hooks).
 *
 *   medirBusqueda(buscar, arreglo, clave, comparador, repeticiones) ->
 *     { encontrado, indice, comparaciones, tiempoTotalMs, tiempoPromedioMs, repeticiones }
 *
 * Una búsqueda dura microsegundos, así que se cronometran `repeticiones` ejecuciones seguidas
 * y se divide entre ese número. Las comparaciones son las de una sola ejecución (deterministas).
 */
const { performance } = require('node:perf_hooks');

function medirBusqueda(buscar, arreglo, clave, comparador, repeticiones = 1) {
  if (typeof buscar !== 'function') throw new TypeError('medirBusqueda: `buscar` debe ser una función');
  if (!Number.isInteger(repeticiones) || repeticiones < 1) throw new RangeError('medirBusqueda: repeticiones debe ser un entero >= 1');

  const resultado = buscar(arreglo, clave, comparador); // 1ª ejecución: calienta y fija comparaciones
  const t0 = performance.now();
  for (let i = 0; i < repeticiones; i++) buscar(arreglo, clave, comparador);
  const t1 = performance.now();

  const tiempoTotalMs = t1 - t0;
  return { ...resultado, tiempoTotalMs, tiempoPromedioMs: tiempoTotalMs / repeticiones, repeticiones };
}

module.exports = { medirBusqueda };
