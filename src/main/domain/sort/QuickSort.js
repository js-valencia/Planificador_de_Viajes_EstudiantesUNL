// QuickSort implementado desde cero.

// Comparador por defecto: orden natural ascendente
const comparadorNatural = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

function intercambiar(arr, i, j) {
  const t = arr[i];
  arr[i] = arr[j];
  arr[j] = t;
}

// Elige como pivote la mediana entre el primero, el del medio y el último.
// Evita el peor caso O(n²) en listas que ya vienen ordenadas.
function medianaDeTres(arr, lo, hi, comparador) {
  const mid = lo + ((hi - lo) >> 1);
  if (comparador(arr[mid], arr[lo]) < 0) intercambiar(arr, mid, lo);
  if (comparador(arr[hi], arr[lo]) < 0) intercambiar(arr, hi, lo);
  if (comparador(arr[hi], arr[mid]) < 0) intercambiar(arr, hi, mid);
  return arr[mid];
}

function ordenar(arr, lo, hi, comparador) {
  while (lo < hi) {
    const pivote = medianaDeTres(arr, lo, hi, comparador);

    // Partición en tres zonas: [menores | iguales | mayores].
    // Agrupar los iguales evita trabajo extra con registros repetidos.
    let menor = lo;
    let i = lo;
    let mayor = hi;
    while (i <= mayor) {
      const c = comparador(arr[i], pivote);
      if (c < 0) {
        intercambiar(arr, menor++, i++);
      } else if (c > 0) {
        intercambiar(arr, i, mayor--);
      } else {
        i++;
      }
    }

    // Se recorre recursivamente la parte más pequeña y se sigue con un bucle
    // sobre la más grande: la profundidad de recursión nunca pasa de O(log n).
    if (menor - lo < hi - mayor) {
      ordenar(arr, lo, menor - 1, comparador);
      lo = mayor + 1;
    } else {
      ordenar(arr, mayor + 1, hi, comparador);
      hi = menor - 1;
    }
  }
}

function quickSort(lista, comparador = comparadorNatural) {
  if (!Array.isArray(lista)) throw new TypeError('quickSort: se esperaba un arreglo');
  if (typeof comparador !== 'function') throw new TypeError('quickSort: el comparador debe ser una función');

  const copia = lista.slice(); // no se modifica la lista original
  ordenar(copia, 0, copia.length - 1, comparador);
  return copia;
}

module.exports = { quickSort };