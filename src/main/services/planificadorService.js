const fs = require('node:fs');
const path = require('node:path');

const GrafoHorarios = require('../domain/graph/GrafoHorarios');
const ordenTopologico = require('../domain/graph/ordenTopologico');
const Planificador = require('../domain/planning/Planificador');
const { generarFrecuencias, ventanaDeFechas } = require('../domain/datos/GenerarFrecuencias');

function leerJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function cargarDatos(baseDir = path.join(__dirname, '..')) {
  const rutasPath = path.join(baseDir, 'data', 'rutas.json');
  const terminalesPath = path.join(baseDir, 'data', 'terminales.json');

  return {
    rutas: leerJson(rutasPath),
    terminales: leerJson(terminalesPath).terminales,
  };
}

function crearPlanificador(baseDir = path.join(__dirname, '..'), desde = new Date().toISOString()) {
  const { rutas } = cargarDatos(baseDir);
  const instanteConsulta = Date.parse(desde);
  if (Number.isNaN(instanteConsulta)) throw new Error('Fecha y hora de salida no válida');

  const { frecuencias, errores } = generarFrecuencias(rutas.rutas, ventanaDeFechas(instanteConsulta));
  if (errores.length) {
    console.warn('Rutas inválidas:', errores);
  }

  const grafo = new GrafoHorarios(rutas.minutosMinimosTransbordo).cargar(frecuencias);

  if (grafo.errores.length) {
    console.warn('Registros inválidos:', grafo.errores);
  }

  const { esAciclico } = ordenTopologico(grafo);
  if (!esAciclico) {
    throw new Error('El grafo de horarios contiene ciclos');
  }

  return new Planificador(grafo);
}

module.exports = {
  cargarDatos,
  crearPlanificador,
};
