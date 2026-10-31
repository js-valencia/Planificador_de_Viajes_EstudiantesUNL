const fs = require('node:fs');
const path = require('node:path');
const express = require('express');

const GrafoHorarios = require('../js/algorithms/GrafoHorarios');
const ordenTopologico = require('../js/algorithms/ordenTopologico');
const Planificador = require('../js/model/planificador');

const datos = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'js', 'model', 'horarios.json'), 'utf8')
);
const grafo = new GrafoHorarios(datos.minutosMinimosTransbordo).cargar(datos.frecuencias);

if (grafo.errores.length) console.warn('Registros inválidos:', grafo.errores);

const { esAciclico } = ordenTopologico(grafo);
if (!esAciclico) throw new Error('El grafo de horarios contiene ciclos');

const planificador = new Planificador(grafo);
const terminales = [...new Set(grafo.nodos.map((n) => n.terminal))].sort();
const criterios = ['tiempo', 'espera', 'conexiones'];

const app = express();
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/terminales', (req, res) => {
  res.json({ terminales, criterios });
});

app.get('/api/ruta', (req, res) => {
  const { origen, destino, desde, criterio = 'tiempo' } = req.query;

  if (!terminales.includes(origen) || !terminales.includes(destino)) {
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
  return res.json({ ruta });
});

const PUERTO = process.env.PORT || 3000;
app.listen(PUERTO, () => {
  console.log(`Planificador en http://localhost:${PUERTO}`);
});
