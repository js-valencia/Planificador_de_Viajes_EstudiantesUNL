// QuickSort implementado desde cero

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

    let i = lo;
    let j = hi;
    while (i <= j) {
      while (comparador(arr[i], pivote) < 0) i++;
      while (comparador(arr[j], pivote) > 0) j--;
      if (i <= j) {
        intercambiar(arr, i, j);
        i++;
        j--;
      }
    }

    if (j - lo < hi - i) {
      ordenar(arr, lo, j, comparador);
      lo = i;
    } else {
      ordenar(arr, i, hi, comparador);
      hi = j;
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