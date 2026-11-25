const os = require('node:os');
const path = require('node:path');
const express = require('express');

const { crearPlanificador, cargarDatos } = require('../services/planificadorService');
const { ventanaDeFechas } = require('../domain/datos/GenerarFrecuencias');

const baseDir = path.join(__dirname, '..');
const { terminales: terminalesDatos } = cargarDatos(baseDir);
const nombresTerminales = terminalesDatos.map((t) => t.nombre);
const criterios = ['tiempo', 'espera', 'conexiones'];

// Fecha y hora ISO 8601 con zona explícita: 2026-11-25T08:00:00-05:00 (o Z).
// Date.parse por sí solo acepta formatos ambiguos, como "2026-11-25 8:00" en hora local del servidor.
const ISO_CON_ZONA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

// El grafo depende solo de la ventana de fechas (día consultado y el siguiente), así que
// se reutiliza entre peticiones en lugar de releer los JSON y recalcular Floyd-Warshall.
const MAX_PLANIFICADORES = 14;
const planificadores = new Map();

function planificadorPara(desde) {
  const clave = ventanaDeFechas(Date.parse(desde)).join('|');
  let planificador = planificadores.get(clave);
  if (!planificador) {
    planificador = crearPlanificador(baseDir, desde);
    planificadores.set(clave, planificador);
    if (planificadores.size > MAX_PLANIFICADORES) {
      planificadores.delete(planificadores.keys().next().value);
    }
  }
  return planificador;
}

const app = express();
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Cliente web de referencia. Se sirve solo index.html: express.static(__dirname)
// publicaba también el código fuente de este servidor.
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Solo operaciones de lectura (RNF-06)
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/terminales', (req, res) => {
  res.json({ terminales: terminalesDatos, criterios });
});

app.get('/api/ruta', (req, res) => {
  const { origen, destino, desde, criterio = 'tiempo' } = req.query;

  // Validación de entradas (RNF-07)
  if (!nombresTerminales.includes(origen) || !nombresTerminales.includes(destino)) {
    return res.status(400).json({ error: 'Origen o destino no válido' });
  }
  if (origen === destino) {
    return res.status(400).json({ error: 'El origen y el destino deben ser distintos' });
  }
  if (!criterios.includes(criterio)) {
    return res.status(400).json({ error: 'Criterio no válido' });
  }
  if (typeof desde !== 'string' || !ISO_CON_ZONA.test(desde) || Number.isNaN(Date.parse(desde))) {
    return res.status(400).json({ error: 'Fecha y hora no válidas (formato esperado: AAAA-MM-DDTHH:MM:SS-05:00)' });
  }

  const ruta = planificadorPara(desde).buscarRuta({ origen, destino, desde, criterio });
  res.json({ ruta }); // ruta = null cuando no hay conexión válida (RF-07)
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

app.use((error, req, res, next) => {
  console.error('Error en la API:', error);
  if (res.headersSent) return next(error);
  res.status(500).json({ error: 'Error interno del servidor' });
});

if (require.main === module) {
  const PUERTO = Number(process.env.PORT) || 3001;
  const HOST = process.env.HOST || '0.0.0.0';
  app.listen(PUERTO, HOST, () => {
    console.log(`Planificador escuchando en http://${HOST}:${PUERTO}`);
    console.log(`Prueba local: http://localhost:${PUERTO}/api/health`);
    // IPs de la red local: son las que debe usar el teléfono (Expo Go o APK preview).
    const ips = Object.values(os.networkInterfaces()).flat()
      .filter((i) => i && i.family === 'IPv4' && !i.internal)
      .map((i) => `http://${i.address}:${PUERTO}`);
    if (ips.length) console.log(`Desde el teléfono (misma red): ${ips.join('  ')}`);
  });
}

module.exports = app;
