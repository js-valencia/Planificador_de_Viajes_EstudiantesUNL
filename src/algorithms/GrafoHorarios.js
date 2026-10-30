/**
 * Grafo dirigido de eventos de transporte.
 * Cada nodo es una salida o una llegada con fecha y hora absolutas.
 * Cada arista tiene como peso el tiempo en minutos:
 *   - "viaje": salida -> llegada de una misma frecuencia.
 *   - "espera": llegada -> salida posterior en la misma terminal (transbordo).
 * Como toda arista avanza en el tiempo, el grafo es acíclico (DAG).
 */
class GrafoHorarios {
  constructor(minutosMinimosTransbordo = 10) {
    this.minutosMinimosTransbordo = minutosMinimosTransbordo;
    this.nodos = [];
    this.aristas = [];
    this.errores = [];
  }

  agregarNodo(datos) {
    const nodo = { id: this.nodos.length, ...datos };
    this.nodos.push(nodo);
    return nodo;
  }

  agregarArista(desde, hasta, peso, tipo, cooperativa = null) {
    this.aristas.push({ desde, hasta, peso, tipo, cooperativa });
  }

  /** Carga las frecuencias y descarta (reportando) las que son inválidas. */
  cargar(frecuencias) {
    for (const f of frecuencias) {
      const salida = Date.parse(f.salida);
      const llegada = Date.parse(f.llegada);

      if (Number.isNaN(salida) || Number.isNaN(llegada) || llegada <= salida) {
        this.errores.push({ id: f.id, motivo: 'La llegada debe ser posterior a la salida' });
        continue;
      }

      const nSalida = this.agregarNodo({ terminal: f.origen, tipo: 'salida', instante: salida, frecuencia: f.id });
      const nLlegada = this.agregarNodo({ terminal: f.destino, tipo: 'llegada', instante: llegada, frecuencia: f.id });
      this.agregarArista(nSalida.id, nLlegada.id, (llegada - salida) / 60000, 'viaje', f.cooperativa);
    }
    this.conectarTransbordos();
    return this;
  }

  /** Une cada llegada con las salidas posteriores de la misma terminal (RNF-05). */
  conectarTransbordos() {
    const minimo = this.minutosMinimosTransbordo * 60000;
    const llegadas = this.nodos.filter((n) => n.tipo === 'llegada');
    const salidas = this.nodos.filter((n) => n.tipo === 'salida');

    for (const ll of llegadas) {
      for (const sa of salidas) {
        if (sa.terminal === ll.terminal && sa.instante >= ll.instante + minimo) {
          this.agregarArista(ll.id, sa.id, (sa.instante - ll.instante) / 60000, 'espera');
        }
      }
    }
  }
}

module.exports = GrafoHorarios;
