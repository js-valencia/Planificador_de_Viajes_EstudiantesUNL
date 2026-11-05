const path = require('node:path');
const express = require('express');

const { crearPlanificador, cargarDatos } = require('../services/planificadorService');

const baseDir = path.join(__dirname, '..');
const planificador = crearPlanificador(baseDir);
const { terminales: terminalesDatos } = cargarDatos(baseDir);
const nombresTerminales = terminalesDatos.map((t) => t.nombre);
const criterios = ['tiempo', 'espera', 'conexiones'];

const app = express();
app.use(express.static(__dirname));

// Solo operaciones de lectura (RNF-06)
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
  if (typeof desde !== 'string' || Number.isNaN(Date.parse(desde))) {
    return res.status(400).json({ error: 'Fecha y hora no válidas' });
  }

  const ruta = planificador.buscarRuta({ origen, destino, desde, criterio });
  res.json({ ruta }); // ruta = null cuando no hay conexión válida (RF-07)
});

const PUERTO = process.env.PORT || 3000;
app.listen(PUERTO, () => console.log(`Planificador en http://localhost:${PUERTO}`));