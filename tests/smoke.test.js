const assert = require('node:assert/strict');
const path = require('node:path');
const { cooperativas } = require('../src/main/data/cooperativas.json');

const { crearPlanificador, cargarDatos } = require('../src/main/services/planificadorService');

const baseDir = path.join(__dirname, '..', 'src', 'main');
const { terminales } = cargarDatos(baseDir);
const desde = '2026-11-02T10:30:00-05:00';
const planificador = crearPlanificador(baseDir, desde);

const ruta = planificador.buscarRuta({
  origen: 'Loja',
  destino: 'Cariamanga',
  desde,
  criterio: 'tiempo',
});

assert.ok(Array.isArray(terminales), 'Debe cargar las terminales');
assert.ok(terminales.some((t) => t.nombre === 'Catamayo'), 'Debe incluir Catamayo');
assert.deepEqual(cooperativas.map((c) => c.nombre).sort(), ['Catamayo', 'Loja'], 'Debe incluir solo las dos cooperativas');
assert.ok(ruta, 'Debe encontrar una ruta válida');
assert.ok(ruta.tramos.length > 0, 'La ruta debe tener tramos');
assert.equal(ruta.tramos[0].desde, 'Loja', 'Debe iniciar en Loja');
assert.equal(ruta.tramos[0].cooperativa, 'Loja', 'Debe usar la cooperativa de los datos de ruta');
assert.equal(ruta.criterio, 'tiempo', 'Debe respetar el criterio solicitado');

console.log('Smoke test OK');
