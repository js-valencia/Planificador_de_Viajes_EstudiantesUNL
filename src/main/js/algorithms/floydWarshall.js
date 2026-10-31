/**
 * Floyd-Warshall: tiempos mínimos entre todos los pares de nodos.
 * Complejidad: O(V^3) en tiempo y O(V^2) en espacio.
 * @param {number} n Cantidad de nodos.
 * @param {{desde:number, hasta:number, peso:number}[]} aristas
 * @returns {{ dist: number[][], sig: (number|null)[][] }}
 */
function floydWarshall(n, aristas) {
  const dist = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 0 : Infinity))
  );
  const sig = Array.from({ length: n }, () => new Array(n).fill(null));

  for (const a of aristas) {
    if (a.peso < dist[a.desde][a.hasta]) {
      dist[a.desde][a.hasta] = a.peso;
      sig[a.desde][a.hasta] = a.hasta;
    }
  }

  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      if (dist[i][k] === Infinity) continue;
      for (let j = 0; j < n; j++) {
        const nuevo = dist[i][k] + dist[k][j];
        if (nuevo < dist[i][j]) {
          dist[i][j] = nuevo;
          sig[i][j] = sig[i][k];
        }
      }
    }
  }

  return { dist, sig };
}

/** Reconstruye la lista de nodos del camino mínimo de i a j. */
function reconstruirCamino(sig, i, j) {
  if (i !== j && sig[i][j] === null) return [];
  const camino = [i];
  while (i !== j) {
    i = sig[i][j];
    camino.push(i);
  }
  return camino;
}

module.exports = { floydWarshall, reconstruirCamino };
