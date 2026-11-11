class NodoDoble {
  constructor(valor) {
    this.valor = valor;
    this.anterior = null;
    this.siguiente = null;
  }
}

class ListaDobleEnlazada {
  constructor() {
    this.cabeza = null;
    this.cola = null;
    this.longitud = 0;
  }

  get size() {
    return this.longitud;
  }

  agregarAlInicio(valor) {
    const nodo = new NodoDoble(valor);
    if (this.cabeza === null) {
      this.cabeza = nodo;
      this.cola = nodo;
    } else {
      nodo.siguiente = this.cabeza;
      this.cabeza.anterior = nodo;
      this.cabeza = nodo;
    }
    this.longitud++;
    return nodo;
  }

  agregarAlFinal(valor) {
    const nodo = new NodoDoble(valor);
    if (this.cola === null) {
      this.cabeza = nodo;
      this.cola = nodo;
    } else {
      nodo.anterior = this.cola;
      this.cola.siguiente = nodo;
      this.cola = nodo;
    }
    this.longitud++;
    return nodo;
  }

  buscar(valor) {
    let nodo = this.cabeza;
    while (nodo !== null) {
      if (nodo.valor === valor) return nodo;
      nodo = nodo.siguiente;
    }
    return null;
  }

  eliminar(valor) {
    const nodo = this.buscar(valor);
    if (nodo === null) return false;

    if (nodo.anterior === null) this.cabeza = nodo.siguiente;
    else nodo.anterior.siguiente = nodo.siguiente;

    if (nodo.siguiente === null) this.cola = nodo.anterior;
    else nodo.siguiente.anterior = nodo.anterior;

    nodo.anterior = null;
    nodo.siguiente = null;
    this.longitud--;
    return true;
  }

  recorrerAdelante() {
    const valores = [];
    for (let nodo = this.cabeza; nodo !== null; nodo = nodo.siguiente) {
      valores.push(nodo.valor);
    }
    return valores;
  }

  recorrerAtras() {
    const valores = [];
    for (let nodo = this.cola; nodo !== null; nodo = nodo.anterior) {
      valores.push(nodo.valor);
    }
    return valores;
  }

  *[Symbol.iterator]() {
    for (let nodo = this.cabeza; nodo !== null; nodo = nodo.siguiente) {
      yield nodo.valor;
    }
  }
}

module.exports = { ListaDobleEnlazada, NodoDoble };