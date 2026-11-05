const fs = require('node:fs');
const path = require('node:path');
const express = require('express');

const GrafoHorarios = require('../js/algorithms/GrafoHorarios');
const ordenTopologico = require('../js/algorithms/ordenTopologico');
const Planificador = require('../js/model/planificador');
const generarFrecuencias = require('../js/model/generarFrecuencias');
const { hoyEcuador, sumarDias } = require('../js/model/expandirRutas');

const archivoModelo = path.join(__dirname, '..', 'js', 'model');
const datos = JSON.parse(
  fs.readFileSync(path.join(archivoModelo, 'horarios.json'), 'utf8')
);
const { _aviso, ...coordenadas } = JSON.parse(
  fs.readFileSync(path.join(archivoModelo, 'terminales.json'), 'utf8')
);
const archivoTrazosCache = path.join(archivoModelo, 'trazos-cache.json');

const terminales = [...new Set(datos.rutas.flatMap((ruta) => ruta.paradas.map((parada) => parada.terminal)))]
  .sort((a, b) => a.localeCompare(b, 'es'));
const terminalOrigen = datos.terminalOrigen;
const destinos = Object.entries(datos.cantones)
  .map(([terminal, canton]) => ({
    terminal,
    canton,
    etiqueta: canton,
  }))
  .sort((a, b) => a.canton.localeCompare(b.canton, 'es'));
const etiquetas = Object.fromEntries(terminales.map((terminal) => {
  const canton = datos.cantones[terminal];
  if (canton) return [terminal, terminal === canton ? canton : `${canton} (${terminal})`];
  if (terminal === terminalOrigen) return [terminal, 'Loja (Terminal Terrestre)'];
  if (terminal === 'Machala') return [terminal, 'Machala (El Oro)'];
  return [terminal, terminal];
}));
const criterios = ['tiempo', 'espera', 'conexiones'];
const fechaInicio = hoyEcuador();
const fechas = { desde: fechaInicio, hasta: sumarDias(fechaInicio, 2) };
const ZONA = 'America/Guayaquil';
const RE_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const RE_DESDE = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}):00-05:00$/;
const cacheTrazos = new Map();

if (fs.existsSync(archivoTrazosCache)) {
  const trazosGuardados = JSON.parse(fs.readFileSync(archivoTrazosCache, 'utf8'));
  for (const [clave, trazo] of Object.entries(trazosGuardados)) {
    const paradas = clave.split('|');
    const inicio = coordenadas[paradas[0]];
    const fin = coordenadas[paradas.at(-1)];
    const primerPunto = trazo.coordenadas?.[0];
    const ultimoPunto = trazo.coordenadas?.at(-1);
    const coincideConCoordenada = (punto, terminal) =>
      punto && terminal &&
      Math.abs(punto[0] - terminal.lat) < 0.05 &&
      Math.abs(punto[1] - terminal.lng) < 0.05;

    if (
      Array.isArray(trazo.coordenadas) &&
      Number.isFinite(trazo.distanciaKm) &&
      coincideConCoordenada(primerPunto, inicio) &&
      coincideConCoordenada(ultimoPunto, fin)
    ) {
      cacheTrazos.set(clave, trazo);
    }
  }
}

function esFechaValida(fecha) {
  if (!RE_FECHA.test(fecha)) return false;
  const instante = Date.parse(`${fecha}T00:00:00Z`);
  return !Number.isNaN(instante) && new Date(instante).toISOString().slice(0, 10) === fecha;
}

function diaSiguiente(fecha) {
  const instante = Date.parse(`${fecha}T12:00:00-05:00`) + 24 * 60 * 60 * 1000;
  return new Date(instante).toLocaleDateString('en-CA', { timeZone: ZONA });
}

function sumarMinutos(hhmm, minutos) {
  const [hora, minuto] = hhmm.split(':').map(Number);
  const total = (hora * 60 + minuto + minutos) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function horasDisponibles(origen, destino) {
  const horas = new Set();
  for (const ruta of datos.rutas) {
    const indiceOrigen = ruta.paradas.findIndex((parada) => parada.terminal === origen);
    const indiceDestino = ruta.paradas.findIndex((parada) => parada.terminal === destino);
    if (indiceOrigen >= 0 && indiceDestino > indiceOrigen) {
      for (const salida of ruta.salidas) {
        horas.add(sumarMinutos(salida, ruta.paradas[indiceOrigen].min));
      }
    }
  }
  return [...horas].sort();
}

function distanciaKm(coordenadasRuta) {
  const R = 6371;
  let total = 0;
  for (let i = 1; i < coordenadasRuta.length; i++) {
    const [lat1, lon1] = coordenadasRuta[i - 1].map((valor) => valor * Math.PI / 180);
    const [lat2, lon2] = coordenadasRuta[i].map((valor) => valor * Math.PI / 180);
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    total += 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  return total;
}

function guardarTrazo(clave, trazo) {
  const trazos = new Map(cacheTrazos);
  trazos.set(clave, trazo);
  fs.writeFileSync(
    archivoTrazosCache,
    `${JSON.stringify(Object.fromEntries(trazos), null, 2)}\n`,
    'utf8'
  );
  cacheTrazos.set(clave, trazo);
}

async function obtenerTrazo(paradas) {
  const clave = paradas.join('|');
  if (cacheTrazos.has(clave)) return cacheTrazos.get(clave);

  const coordenadasParadas = paradas.map((terminal) => coordenadas[terminal]);
  const coordenadasRectas = coordenadasParadas.map(({ lat, lng }) => [lat, lng]);
  const trazoAproximado = {
    coordenadas: coordenadasRectas,
    distanciaKm: distanciaKm(coordenadasRectas),
    aproximado: true,
  };

  try {
    const puntos = coordenadasParadas.map(({ lat, lng }) => `${lng},${lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${puntos}?overview=full&geometries=geojson`;
    const respuesta = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!respuesta.ok) return trazoAproximado;

    const datosRuta = await respuesta.json();
    const ruta = datosRuta.routes?.[0];
    if (datosRuta.code !== 'Ok' || !ruta?.geometry?.coordinates?.length) return trazoAproximado;

    const trazo = {
      coordenadas: ruta.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
      distanciaKm: ruta.distance / 1000,
      aproximado: false,
    };
    try {
      guardarTrazo(clave, trazo);
    } catch (error) {
      console.error(`No se pudo guardar el trazo ${clave} en caché:`, error.message);
    }
    return trazo;
  } catch (error) {
    if (error.code !== 'ETIMEDOUT' && error.name !== 'TimeoutError' && error.name !== 'AbortError') {
      console.warn(`No se pudo obtener el trazo ${clave}:`, error.message);
    }
    return trazoAproximado;
  }
}

const cache = new Map();
function planificadorPara(fecha) {
  if (!cache.has(fecha)) {
    if (cache.size > 30) cache.clear();
    const grafo = new GrafoHorarios(datos.minutosMinimosTransbordo).cargar(
      generarFrecuencias(datos.rutas, [fecha, diaSiguiente(fecha)])
    );
    if (grafo.errores.length) console.warn('Registros inválidos:', grafo.errores);
    if (!ordenTopologico(grafo).esAciclico) {
      throw new Error('El grafo de horarios contiene ciclos');
    }
    cache.set(fecha, new Planificador(grafo));
  }
  return cache.get(fecha);
}

const app = express();
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/terminales', (req, res) => {
  res.json({ terminales, origen: terminalOrigen, destinos, etiquetas, criterios, coordenadas, fechas });
});

app.get('/api/horarios', (req, res) => {
  const { origen, destino } = req.query;
  if (!terminales.includes(origen) || !terminales.includes(destino) || origen === destino) {
    return res.status(400).json({ error: 'Origen o destino no válido' });
  }
  return res.json({ horas: horasDisponibles(origen, destino) });
});

app.get('/api/trazo', async (req, res) => {
  const { paradas: consultaParadas } = req.query;
  if (typeof consultaParadas !== 'string') {
    return res.status(400).json({ error: 'Debe indicar las paradas del recorrido' });
  }
  const paradas = consultaParadas.split(',');
  if (paradas.length < 2 || paradas.some((terminal) => !terminales.includes(terminal))) {
    return res.status(400).json({ error: 'Una o más terminales no son válidas' });
  }
  const sinCoordenadas = paradas.filter((terminal) => !coordenadas[terminal]);
  if (sinCoordenadas.length) {
    return res.status(400).json({ error: `No hay coordenadas para: ${sinCoordenadas.join(', ')}` });
  }
  return res.json(await obtenerTrazo(paradas));
});

app.get('/api/ruta', (req, res) => {
  const { origen, destino, desde, criterio = 'tiempo' } = req.query;
  if (!terminales.includes(origen) || !terminales.includes(destino)) {
    return res.status(400).json({ error: 'Origen o destino no válido' });
  }
  if (origen !== terminalOrigen) {
    return res.status(400).json({ error: `El viaje debe salir desde la Terminal Terrestre (${terminalOrigen})` });
  }
  if (origen === destino) {
    return res.status(400).json({ error: 'El origen y el destino deben ser distintos' });
  }
  if (!criterios.includes(criterio)) {
    return res.status(400).json({ error: 'Criterio no válido' });
  }

  const coincidencia = typeof desde === 'string' ? RE_DESDE.exec(desde) : null;
  if (!coincidencia || !esFechaValida(coincidencia[1]) || Number.isNaN(Date.parse(desde))) {
    return res.status(400).json({ error: 'Fecha y hora no válidas' });
  }
  if (!horasDisponibles(origen, destino).includes(coincidencia[2])) {
    return res.status(400).json({ error: 'Esa hora no corresponde a una salida del horario' });
  }

  const ruta = planificadorPara(coincidencia[1]).buscarRuta({
    origen,
    destino,
    desde,
    criterio,
    salidaExacta: true,
  });
  return res.json({ ruta });
});

const PUERTO = process.env.PORT || 3000;
app.listen(PUERTO, () => {
  console.log(`Planificador en http://localhost:${PUERTO}`);
});
