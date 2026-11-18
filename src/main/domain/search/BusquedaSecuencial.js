/**
 * Búsqueda secuencial (lineal).
 *
 *   buscar(arreglo, clave, comparador?) -> { encontrado, indice, comparaciones }
 *
 * - `comparador(a, b)`: negativo si a va antes, positivo si va después, 0 si son equivalentes.
 *   Para rutas se usa `compararRutas` (el mismo de MergeSort/QuickSort).
 * - Una "comparación" = una llamada a `comparador(elemento, clave)`.
 * - No modifica el arreglo y no usa sort / indexOf / find. No requiere arreglo ordenado.
 *
 * Complejidad: O(n). Mejor caso 1 comparación; búsqueda fallida n. Espacio O(1).
 */

const comparadorPorDefecto = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

function validar(arreglo, comparador) {
  if (!Array.isArray(arreglo)) throw new TypeError('BusquedaSecuencial: se esperaba un arreglo');
  if (typeof comparador !== 'function') throw new TypeError('BusquedaSecuencial: el comparador debe ser una función');
}

function busquedaSecuencial(arreglo, clave, comparador = comparadorPorDefecto) {
  validar(arreglo, comparador);
  let comparaciones = 0;
  for (let i = 0; i < arreglo.length; i++) {
    comparaciones++;
    if (comparador(arreglo[i], clave) === 0) return { encontrado: true, indice: i, comparaciones };
  }
  return { encontrado: false, indice: -1, comparaciones };
}

module.exports = { busquedaSecuencial, buscar: busquedaSecuencial };
