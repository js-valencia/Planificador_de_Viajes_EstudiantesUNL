const assert = require('node:assert/strict');
const path = require('node:path');

const { crearPlanificador, cargarDatos } = require('../src/main/services/planificadorService');

const baseDir = path.join(__dirname, '..', 'src', 'main');
const { terminales } = cargarDatos(baseDir);
const planificador = crearPlanificador(baseDir);

const ruta = planificador.buscarRuta({
  origen: 'Catamayo',
  destino: 'Cariamanga',
  desde: '2026-11-02T06:30:00-05:00',
  criterio: 'tiempo',
});

assert.ok(Array.isArray(terminales), 'Debe cargar las terminales');
assert.ok(terminales.some((t) => t.nombre === 'Catamayo'), 'Debe incluir Catamayo');
assert.ok(ruta, 'Debe encontrar una ruta válida');
assert.ok(ruta.tramos.length > 0, 'La ruta debe tener tramos');
assert.equal(ruta.criterio, 'tiempo', 'Debe respetar el criterio solicitado');

console.log('Smoke test OK');
