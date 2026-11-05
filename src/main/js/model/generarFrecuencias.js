/**
 * Expande cada salida en viajes entre todos los pares ordenados de paradas.
 */
function generarFrecuencias(rutas, fechas) {
  const frecuencias = [];

  for (const fecha of fechas) {
    for (const ruta of rutas) {
      for (const hhmm of ruta.salidas) {
        const base = Date.parse(`${fecha}T${hhmm}:00-05:00`);
        const paradas = ruta.paradas;

        for (let i = 0; i < paradas.length - 1; i++) {
          for (let j = i + 1; j < paradas.length; j++) {
            frecuencias.push({
              id: `${ruta.id}-${fecha}-${hhmm}-${i}${j}`,
              cooperativa: ruta.cooperativa,
              origen: paradas[i].terminal,
              destino: paradas[j].terminal,
              salida: new Date(base + paradas[i].min * 60000).toISOString(),
              llegada: new Date(base + paradas[j].min * 60000).toISOString(),
              via: paradas.slice(i + 1, j).map((parada) => parada.terminal),
            });
          }
        }
      }
    }
  }

  return frecuencias;
}

module.exports = generarFrecuencias;
