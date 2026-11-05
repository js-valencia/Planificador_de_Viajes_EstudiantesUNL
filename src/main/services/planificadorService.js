const fs = require('node:fs');
const path = require('node:path');

const GrafoHorarios = require('../domain/graph/GrafoHorarios');
const ordenTopologico = require('../domain/graph/ordenTopologico');
const Planificador = require('../domain/planning/Planificador');

function leerJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function cargarDatos(baseDir = path.join(__dirname, '..')) {
  const horariosPath = path.join(baseDir, 'data', 'horarios.json');
  const terminalesPath = path.join(baseDir, 'data', 'terminales.json');

  return {
    horarios: leerJson(horariosPath),
    terminales: leerJson(terminalesPath).terminales,
  };
}

function crearPlanificador(baseDir = path.join(__dirname, '..')) {
  const { horarios } = cargarDatos(baseDir);
  const grafo = new GrafoHorarios(horarios.minutosMinimosTransbordo).cargar(horarios.frecuencias);

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
