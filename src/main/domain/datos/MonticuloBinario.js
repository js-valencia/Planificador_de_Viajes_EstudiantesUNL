const comparadorPorDefecto = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

class MonticuloBinario {
  constructor(comparador = comparadorPorDefecto) {
    if (typeof comparador !== 'function') throw new Error('El comparador debe ser una función');
    this.comparador = comparador;
    this.datos = [];
  }

  /** Construye un montículo a partir de un arreglo en O(n). No modifica el arreglo original. */
  static desdeArreglo(arreglo, comparador) {
    const monticulo = new MonticuloBinario(comparador);
    monticulo.datos = arreglo.slice();
    for (let i = (monticulo.datos.length >> 1) - 1; i >= 0; i--) monticulo.bajar(i);
    return monticulo;
  }

  get size() {
    return this.datos.length;
  }

  estaVacio() {
    return this.datos.length === 0;
  }

  /** Devuelve el elemento con más prioridad sin sacarlo (undefined si está vacío). */
  ver() {
    return this.datos[0];
  }

  insertar(valor) {
    this.datos.push(valor);
    this.subir(this.datos.length - 1);
    return this.datos.length;
  }

  /** Saca y devuelve el elemento con más prioridad (undefined si está vacío). */
  extraer() {
    const n = this.datos.length;
    if (n === 0) return undefined;
    const raiz = this.datos[0];
    const ultimo = this.datos.pop();
    if (n > 1) {
      this.datos[0] = ultimo;
      this.bajar(0);
    }
    return raiz;
  }

  vaciar() {
    this.datos = [];
  }

  /** Copia de los elementos en el orden de prioridad. No destruye el montículo. */
  ordenados() {
    const copia = MonticuloBinario.desdeArreglo(this.datos, this.comparador);
    const salida = [];
    while (!copia.estaVacio()) salida.push(copia.extraer());
    return salida;
  }

  subir(i) {
    const { datos, comparador } = this;
    const valor = datos[i];
    while (i > 0) {
      const padre = (i - 1) >> 1;
      if (comparador(valor, datos[padre]) >= 0) break;
      datos[i] = datos[padre];
      i = padre;
    }
    datos[i] = valor;
  }

  bajar(i) {
    const { datos, comparador } = this;
    const n = datos.length;
    const valor = datos[i];
    while (true) {
      let hijo = 2 * i + 1;
      if (hijo >= n) break;
      if (hijo + 1 < n && comparador(datos[hijo + 1], datos[hijo]) < 0) hijo++;
      if (comparador(datos[hijo], valor) >= 0) break;
      datos[i] = datos[hijo];
      i = hijo;
    }
    datos[i] = valor;
  }

  *[Symbol.iterator]() {
    yield* this.datos; 
  }
}

/** Heapsort: ordena con un montículo. O(n log n). Devuelve un arreglo nuevo. */
function heapSort(arreglo, comparador = comparadorPorDefecto) {
  return MonticuloBinario.desdeArreglo(arreglo, comparador).ordenados();
}

module.exports = { MonticuloBinario, heapSort, comparadorPorDefecto };