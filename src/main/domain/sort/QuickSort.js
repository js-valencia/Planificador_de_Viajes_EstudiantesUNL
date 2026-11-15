// QuickSort implementado desde cero.
const comparadorNatural = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

function intercambiar(arr, i, j) {
  const t = arr[i];
  arr[i] = arr[j];
  arr[j] = t;
}

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