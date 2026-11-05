const MINUTO = 60000;
const DESFASE_ECUADOR = 5 * 3600000; // UTC-5 todo el año

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
    const p = ruta.paradas;
    const validas =
      Array.isArray(p) && p.length >= 2 && p[0].minutos === 0 &&
      p.every((x, i) => i === 0 || x.minutos > p[i - 1].minutos);
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
        for (let i = 0; i < p.length - 1; i++) {
          for (let j = i + 1; j < p.length; j++) {
            frecuencias.push({
              id: `${ruta.id}|${fecha}|${hora}|${i}-${j}`,
              cooperativa: ruta.cooperativa,
              origen: p[i].terminal,
              destino: p[j].terminal,
              salida: new Date(base + p[i].minutos * MINUTO).toISOString(),
              llegada: new Date(base + p[j].minutos * MINUTO).toISOString(),
            });
          }
        }
      }
    }
  }
  return { frecuencias, errores };
}

module.exports = { generarFrecuencias, ventanaDeFechas, fechaEcuador };