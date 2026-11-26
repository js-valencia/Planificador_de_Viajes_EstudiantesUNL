const fs = require('node:fs');
const path = require('node:path');

const CacheTTL = require('./CacheTTL');
const { crearPlanificador } = require('./planificadorService');
const { ventanaDeFechas } = require('../domain/datos/GenerarFrecuencias');

/**
 * Huella barata de los datos que alimentan el grafo (rutas y horarios): fecha de
 * modificación + tamaño de rutas.json. Dos fs.statSync por consulta cuestan microsegundos,
 * frente a releer y reparsear el JSON. terminales.json no entra: no interviene en el
 * cálculo del itinerario.
 */
function versionDeDatos(baseDir) {
  const { mtimeMs, size } = fs.statSync(path.join(baseDir, 'data', 'rutas.json'));
  return `${mtimeMs}:${size}`;
}

const MIN = 60 * 1000;

/**
 * Dos niveles de caché, ambos con TTL y atados a la misma versión de datos:
 *  1. planificadores: grafo + matrices Floyd-Warshall, uno por ventana de fechas
 *     (día consultado y siguiente). Es lo más caro (decenas de ms por criterio).
 *  2. resultados: itinerario (o null = "sin conexión") por consulta exacta.
 *
 * Clave del resultado = origen | destino | criterio | instante en ms UTC.
 * El instante sale de Date.parse(desde), así "…T08:00:00-05:00" y "…T13:00:00Z" comparten
 * entrada. No se redondea: la salida debe ser >= desde y esperaInicialMin depende del
 * segundo exacto, así que redondear podría servir un resultado distinto del real.
 */
function crearServicioConsultas({
  baseDir,
  ttlResultadosMs = 5 * MIN,
  ttlPlanificadoresMs = 30 * MIN,
  maxResultados = 500,
  maxPlanificadores = 14,
  ahora = Date.now,
  obtenerVersion = () => versionDeDatos(baseDir),
  crear = crearPlanificador,
} = {}) {
  const planificadores = new CacheTTL({ ttlMs: ttlPlanificadoresMs, maxEntradas: maxPlanificadores, ahora });
  const resultados = new CacheTTL({ ttlMs: ttlResultadosMs, maxEntradas: maxResultados, ahora });
  let version = obtenerVersion();
  let invalidacionesDeDatos = 0;

  function invalidar() {
    planificadores.limpiar();
    resultados.limpiar();
    invalidacionesDeDatos++;
  }

  /** Si rutas.json cambió, descarta ambos niveles antes de responder. */
  function revisarDatos() {
    let actual;
    try {
      actual = obtenerVersion();
    } catch {
      // Sin poder verificar la versión no se puede garantizar que el caché sea vigente.
      invalidar();
      version = null;
      return;
    }
    if (actual !== version) {
      version = actual;
      invalidar();
    }
  }

  function planificadorPara(desde) {
    const clave = ventanaDeFechas(Date.parse(desde)).join('|');
    let planificador = planificadores.get(clave);
    if (!planificador) {
      planificador = planificadores.set(clave, crear(baseDir, desde));
    }
    return planificador;
  }

  /**
   * @returns {{ ruta: object|null, cache: 'HIT'|'MISS' }}
   * El itinerario cacheado es compartido: quien lo reciba no debe mutarlo.
   */
  function buscarRuta({ origen, destino, desde, criterio = 'tiempo' }) {
    revisarDatos();
    const instante = Date.parse(desde);
    const clave = JSON.stringify([origen, destino, criterio, instante]);

    const guardado = resultados.get(clave);
    if (guardado !== undefined) return { ruta: guardado.ruta, cache: 'HIT' };

    const ruta = planificadorPara(desde).buscarRuta({ origen, destino, desde, criterio });
    resultados.set(clave, { ruta }); // se guarda también null: "sin conexión" es un resultado válido
    return { ruta, cache: 'MISS' };
  }

  function estadisticas() {
    return {
      resultados: resultados.estadisticas(),
      planificadores: planificadores.estadisticas(),
      invalidacionesPorCambioDeDatos: invalidacionesDeDatos,
    };
  }

  return { buscarRuta, invalidar, estadisticas, purgarVencidos: () => resultados.purgarVencidos() + planificadores.purgarVencidos() };
}

module.exports = { crearServicioConsultas, versionDeDatos };
