const { floydWarshall, reconstruirCamino } = require('../algorithms/floydWarshall');

const CRITERIOS = {
  // menor tiempo total: viaje + esperas
  tiempo: (a) => a.peso,
  // menor tiempo de espera: solo cuentan las esperas
  espera: (a) => (a.tipo === 'espera' ? a.peso : 0),
  // menos conexiones: cada transbordo cuesta 1
  conexiones: (a) => (a.tipo === 'espera' ? 1 : 0),
};

class Planificador {
  constructor(grafo) {
    this.grafo = grafo;
    this.matrices = {}; // se calcula una vez por criterio
  }

  matriz(criterio) {
    if (!this.matrices[criterio]) {
      const peso = CRITERIOS[criterio];
      const aristas = this.grafo.aristas.map((a) => ({ ...a, peso: peso(a) }));
      this.matrices[criterio] = floydWarshall(this.grafo.nodos.length, aristas);
    }
    return this.matrices[criterio];
  }

  /**
   * @param {{origen:string, destino:string, desde:string, criterio?:string}} consulta
   * @returns {object|null} Itinerario o null si no existe conexión válida (RF-07).
   */
  buscarRuta({ origen, destino, desde, criterio = 'tiempo' }) {
    if (!CRITERIOS[criterio]) throw new Error(`Criterio no válido: ${criterio}`);
    const instanteDesde = Date.parse(desde);
    if (Number.isNaN(instanteDesde)) throw new Error('Fecha y hora de salida no válida');

    const { dist, sig } = this.matriz(criterio);
    const { nodos } = this.grafo;
    const salidas = nodos.filter((n) => n.terminal === origen && n.tipo === 'salida' && n.instante >= instanteDesde);
    const llegadas = nodos.filter((n) => n.terminal === destino && n.tipo === 'llegada');

    let mejor = null;
    for (const s of salidas) {
      for (const l of llegadas) {
        const costo = dist[s.id][l.id];
        if (costo === Infinity) continue;
        // desempate: llegar más temprano
        if (!mejor || costo < mejor.costo || (costo === mejor.costo && l.instante < mejor.llegada.instante)) {
          mejor = { costo, salida: s, llegada: l };
        }
      }
    }
    if (!mejor) return null;

    const camino = reconstruirCamino(sig, mejor.salida.id, mejor.llegada.id).map((id) => nodos[id]);
    return this.armarItinerario(camino, instanteDesde, criterio);
  }

  armarItinerario(camino, instanteDesde, criterio) {
    const tramos = [];
    let esperaTotal = 0;
    for (let i = 0; i < camino.length - 1; i++) {
      const a = camino[i];
      const b = camino[i + 1];
      if (a.tipo === 'salida') {
        const arista = this.grafo.aristas.find((x) => x.desde === a.id && x.hasta === b.id && x.tipo === 'viaje');
        tramos.push({
          cooperativa: arista.cooperativa,
          desde: a.terminal,
          hasta: b.terminal,
          salida: new Date(a.instante),
          llegada: new Date(b.instante),
        });
      } else {
        esperaTotal += (b.instante - a.instante) / 60000;
      }
    }
    const inicio = camino[0].instante;
    const fin = camino[camino.length - 1].instante;
    return {
      criterio,
      tramos,
      transbordos: tramos.length - 1,
      esperaTotalMin: esperaTotal,
      duracionViajeMin: (fin - inicio) / 60000,
      esperaInicialMin: (inicio - instanteDesde) / 60000,
    };
  }
}

module.exports = Planificador;
