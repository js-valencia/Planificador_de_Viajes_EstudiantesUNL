/**
 * Convierte las rutas de horarios.json (que se repiten todos los días)
 * en frecuencias con fecha y hora completas, que es lo que necesita el grafo.
 * Cada parada de una ruta genera una frecuencia: Loja -> parada.
 */
const MS_DIA = 24 * 60 * 60 * 1000;
const ZONA = '-05:00'; // Ecuador continental
const generarFrecuencias = require('./generarFrecuencias');

/** Fecha de hoy en Ecuador, formato AAAA-MM-DD. */
function hoyEcuador() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
}

/** Suma días a una fecha AAAA-MM-DD. */
function sumarDias(fecha, dias) {
  const ms = Date.parse(`${fecha}T12:00:00${ZONA}`) + dias * MS_DIA;
  return new Date(ms).toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
}

function expandirRutas(datos, fechaInicio = hoyEcuador()) {
  const base = Date.parse(`${fechaInicio}T00:00:00${ZONA}`);
  if (Number.isNaN(base)) throw new Error('Fecha de inicio no válida');

  const dias = datos.diasProgramados ?? 3;
  const fechas = Array.from({ length: dias }, (_, dia) => sumarDias(fechaInicio, dia));
  return generarFrecuencias(datos.rutas, fechas);
}

module.exports = { expandirRutas, hoyEcuador, sumarDias };
