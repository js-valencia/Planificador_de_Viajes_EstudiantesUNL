const fs = require('node:fs');
const path = require('node:path');
const GrafoHorarios = require('./algorithms/GrafoHorarios');
const ordenTopologico = require('./algorithms/ordenTopologico');
const Planificador = require('./model/planificador');

const datos = JSON.parse(fs.readFileSync(path.join(__dirname, 'model', 'horarios.json'), 'utf8'));

const grafo = new GrafoHorarios(datos.minutosMinimosTransbordo).cargar(datos.frecuencias);

if (grafo.errores.length) console.warn('Registros inválidos:', grafo.errores);

const { esAciclico } = ordenTopologico(grafo);
console.log(`Nodos: ${grafo.nodos.length} | Aristas: ${grafo.aristas.length} | Grafo acíclico: ${esAciclico}`);
if (!esAciclico) process.exit(1);

const hora = (d) => d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Guayaquil' });

const planificador = new Planificador(grafo);
const consulta = { origen: 'Catamayo', destino: 'Cariamanga', desde: '2026-11-02T06:30:00-05:00' };

for (const criterio of ['tiempo', 'espera', 'conexiones']) {
  const r = planificador.buscarRuta({ ...consulta, criterio });
  console.log(`\n=== ${consulta.origen} -> ${consulta.destino} (criterio: ${criterio}) ===`);
  if (!r) {
    console.log('No existe una conexión válida para los parámetros ingresados.');
    continue;
  }
  r.tramos.forEach((t) => console.log(`${t.desde} ${hora(t.salida)} -> ${t.hasta} ${hora(t.llegada)} (Coop. ${t.cooperativa})`));
  console.log(`Transbordos: ${r.transbordos} | Espera entre buses: ${r.esperaTotalMin} min | Duración: ${r.duracionViajeMin} min`);
}
