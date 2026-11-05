/**
 * Orden topológico por el algoritmo de Kahn. Complejidad: O(V + E)
 * Si no se pueden ordenar todos los nodos, el grafo tiene un ciclo (RNF-04).
 * @returns {{ orden: number[], esAciclico: boolean }}
 */
function ordenTopologico(grafo) {
  const n = grafo.nodos.length;
  const gradoEntrada = new Array(n).fill(0);
  const adyacentes = Array.from({ length: n }, () => []);

  for (const a of grafo.aristas) {
    adyacentes[a.desde].push(a.hasta);
    gradoEntrada[a.hasta]++;
  }

  const cola = [];
  for (let i = 0; i < n; i++) if (gradoEntrada[i] === 0) cola.push(i);

  const orden = [];
  for (let k = 0; k < cola.length; k++) {
    const u = cola[k];
    orden.push(u);
    for (const v of adyacentes[u]) {
      if (--gradoEntrada[v] === 0) cola.push(v);
    }
  }

  return { orden, esAciclico: orden.length === n };
}

module.exports = ordenTopologico;
