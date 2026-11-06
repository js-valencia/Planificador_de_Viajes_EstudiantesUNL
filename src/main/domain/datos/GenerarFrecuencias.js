const MINUTO = 60000;
const DESFASE_ECUADOR = 5 * 3600000; // UTC-5 todo el año
const { ListaDobleEnlazada } = require('./ListaDobleEnlazada');

function crearListaParadas(paradas) {
  const lista = new ListaDobleEnlazada();
  if (Array.isArray(paradas)) {
    for (const parada of paradas) lista.agregarAlFinal(parada);
  }
  return lista;
}

/** Fecha (AAAA-MM-DD) en hora de Ecuador de un instante. */
function fechaEcuador(instante) {
  return new Date(instante - DESFASE_ECUADOR).toISOString().slice(0, 10);
}

/** Fecha de la consulta y la siguiente, para no perder viajes que cruzan la medianoche. */
function ventanaDeFechas(instante) {
  return [fechaEcuador(instante), fechaEcuador(instante + 24 * 3600000)];
}

function diaSemana(fecha) {
  return new Date(`${fecha}T12:00:00-05:00`).getUTCDay(); // 0 = domingo
}

/**
 * Convierte cada ruta (una sola vez en el JSON) en frecuencias concretas.
 * Por cada salida y cada par de paradas (i < j) se genera una frecuencia,
 * de modo que el estudiante pueda subir o bajar en cualquier parada.
 * @returns {{ frecuencias: object[], errores: object[] }}
 */
function generarFrecuencias(rutas, fechas) {
  const frecuencias = [];
  const errores = [];

  for (const ruta of rutas) {
    const listaParadas = crearListaParadas(ruta.paradas);
    const nodosParada = [];
    for (let nodo = listaParadas.cabeza; nodo !== null; nodo = nodo.siguiente) {
      nodosParada.push(nodo);
    }
    const paradasRuta = nodosParada.map((nodo) => ({
      terminal: nodo.valor.terminal,
      anterior: nodo.anterior ? nodo.anterior.valor.terminal : null,
      siguiente: nodo.siguiente ? nodo.siguiente.valor.terminal : null,
    }));
    const validas =
      nodosParada.length >= 2 && nodosParada[0].valor.minutos === 0 &&
      nodosParada.every((nodo, i) => i === 0 || nodo.valor.minutos > nodosParada[i - 1].valor.minutos);
    if (!validas) {
      errores.push({ id: ruta.id, motivo: 'Las paradas deben ser al menos 2, iniciar en 0 minutos y estar en orden creciente' });
      continue;
    }

    for (const fecha of fechas) {
      if (Array.isArray(ruta.dias) && !ruta.dias.includes(diaSemana(fecha))) continue;

      for (const hora of ruta.salidas) {
        const base = /^([01]\d|2[0-3]):[0-5]\d$/.test(hora) ? Date.parse(`${fecha}T${hora}:00-05:00`) : NaN;
        if (Number.isNaN(base)) {
          errores.push({ id: ruta.id, motivo: `Hora de salida no válida: ${hora}` });
          continue;
        }
        for (let i = 0; i < nodosParada.length - 1; i++) {
          for (let j = i + 1; j < nodosParada.length; j++) {
            const paradaOrigen = nodosParada[i].valor;
            const paradaDestino = nodosParada[j].valor;
            frecuencias.push({
              id: `${ruta.id}|${fecha}|${hora}|${i}-${j}`,
              cooperativa: ruta.cooperativa,
              nombreRuta: ruta.nombre,
              cantones: ruta.cantones || [],
              paradasRuta,
              origen: paradaOrigen.terminal,
              destino: paradaDestino.terminal,
              salida: new Date(base + paradaOrigen.minutos * MINUTO).toISOString(),
              llegada: new Date(base + paradaDestino.minutos * MINUTO).toISOString(),
            });
          }
        }
      }
    }
  }
  return { frecuencias, errores };
}

module.exports = { generarFrecuencias, crearListaParadas, ventanaDeFechas, fechaEcuador };