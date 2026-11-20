/**
 * Búsqueda binaria (iterativa).
 *
 *   buscar(arreglo, clave, comparador?) -> { encontrado, indice, comparaciones }
 *
 * PRECONDICIÓN: el arreglo debe estar ORDENADO con el mismo comparador que se pasa aquí
 * (por ejemplo mergeSort(rutas, compararRutas) y luego buscar con compararRutas).
 *
 * - Una "comparación" = una llamada a `comparador(elemento, clave)` (cada iteración cuesta 1).
 * - No modifica el arreglo y no usa sort / indexOf / find.
 *
 * Complejidad: O(log n). Peor caso y búsqueda fallida ≈ floor(log2 n) + 1. Espacio O(1).
 */

const comparadorPorDefecto = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

function validar(arreglo, comparador) {
  if (!Array.isArray(arreglo)) throw new TypeError('BusquedaBinaria: se esperaba un arreglo');
  if (typeof comparador !== 'function') throw new TypeError('BusquedaBinaria: el comparador debe ser una función');
}

function busquedaBinaria(arreglo, clave, comparador = comparadorPorDefecto) {
  validar(arreglo, comparador);
  let bajo = 0;
  let alto = arreglo.length - 1;
  let comparaciones = 0;
  while (bajo <= alto) {
    const medio = bajo + ((alto - bajo) >> 1);
    comparaciones++;
    const r = comparador(arreglo[medio], clave);
    if (r === 0) return { encontrado: true, indice: medio, comparaciones };
    if (r < 0) bajo = medio + 1;
    else alto = medio - 1;
  }
  return { encontrado: false, indice: -1, comparaciones };
}

module.exports = { busquedaBinaria, buscar: busquedaBinaria };
