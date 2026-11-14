/**
 * MergeSort (ordenamiento por mezcla).
 *
 * Interfaz común con QuickSort para poder comparar ambos algoritmos:
 *   ordenar(arreglo, comparador?) -> arreglo NUEVO ordenado
 *
 * - `comparador(a, b)` devuelve < 0 si a va antes que b, > 0 si va después, 0 si son iguales
 *   (mismo contrato que Array.prototype.sort). Por defecto compara con < y >.
 * - No modifica el arreglo original.
 * - No usa Array.prototype.sort.
 *
 * Complejidad:
 *   Tiempo:  O(n log n) en el mejor, promedio y peor caso (siempre divide a la mitad
 *            -> log n niveles, y cada nivel mezcla n elementos).
 *   Espacio: O(n) auxiliar (una copia de trabajo + un búfer de mezcla) y O(log n) de pila
 *            de recursión.
 *   Es estable: los elementos iguales conservan su orden relativo original.
 */

const comparadorPorDefecto = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/** Mezcla las mitades ordenadas [inicio, medio) y [medio, fin) de `datos` usando `aux`. */
function mezclar(datos, aux, inicio, medio, fin, comparador) {
  let i = inicio;
  let j = medio;
  let k = inicio;

  while (i < medio && j < fin) {
    // `<= 0` toma primero el de la izquierda en empates: garantiza estabilidad.
    if (comparador(datos[i], datos[j]) <= 0) aux[k++] = datos[i++];
    else aux[k++] = datos[j++];
  }
  while (i < medio) aux[k++] = datos[i++];
  while (j < fin) aux[k++] = datos[j++];

  for (let p = inicio; p < fin; p++) datos[p] = aux[p];
}

function ordenarRango(datos, aux, inicio, fin, comparador) {
  if (fin - inicio < 2) return;
  const medio = inicio + ((fin - inicio) >> 1);
  ordenarRango(datos, aux, inicio, medio, comparador);
  ordenarRango(datos, aux, medio, fin, comparador);
  mezclar(datos, aux, inicio, medio, fin, comparador);
}

/**
 * @template T
 * @param {T[]} arreglo registros a ordenar (no se modifica)
 * @param {(a: T, b: T) => number} [comparador]
 * @returns {T[]} nuevo arreglo ordenado
 */
function ordenar(arreglo, comparador = comparadorPorDefecto) {
  if (!Array.isArray(arreglo)) throw new TypeError('MergeSort: se esperaba un arreglo');
  if (typeof comparador !== 'function') throw new TypeError('MergeSort: el comparador debe ser una función');

  const datos = arreglo.slice();
  ordenarRango(datos, new Array(datos.length), 0, datos.length, comparador);
  return datos;
}

module.exports = { ordenar, mergeSort: ordenar, comparadorPorDefecto };
