// Pruebas del planificador sobre los datos reales (todas las combinaciones origen/destino/criterio).
// Ejecutar: node tests/planificador.test.js   (o npm test)
const assert = require('node:assert/strict');
const path = require('node:path');
const { crearPlanificador, cargarDatos } = require('../src/main/services/planificadorService');

const baseDir = path.join(__dirname, '..', 'src', 'main');
const { terminales } = cargarDatos(baseDir);
const nombres = terminales.map((t) => t.nombre);
const CRITERIOS = ['tiempo', 'espera', 'conexiones'];

let correctas = 0;
const fallos = [];
function prueba(nombre, cuerpo) {
  try { cuerpo(); correctas++; console.log(`  ✓ ${nombre}`); }
  catch (e) { fallos.push(`${nombre}: ${e.message}`); console.log(`  ✗ ${nombre}\n      ${e.message.split('\n')[0]}`); }
}

const llegada = (ruta) => Date.parse(ruta.tramos.at(-1).llegada);
const consultas = ['2026-11-25T08:00:00-05:00', '2026-11-25T21:00:00-05:00', '2026-11-29T06:00:00-05:00'];

console.log('Planificador de rutas');

prueba('ninguna combinación lanza excepciones y los itinerarios son coherentes', () => {
  for (const desde of consultas) {
    const p = crearPlanificador(baseDir, desde);
    for (const origen of nombres) for (const destino of nombres) {
      if (origen === destino) continue;
      for (const criterio of CRITERIOS) {
        const r = p.buscarRuta({ origen, destino, desde, criterio });
        if (!r) continue;
        assert.equal(r.tramos[0].desde, origen);
        assert.equal(r.tramos.at(-1).hasta, destino);
        assert.ok(Date.parse(r.tramos[0].salida) >= Date.parse(desde), 'no sale antes de la hora pedida');
        for (let i = 1; i < r.tramos.length; i++) {
          assert.equal(r.tramos[i].desde, r.tramos[i - 1].hasta, 'los tramos son contiguos');
          assert.ok(Date.parse(r.tramos[i].salida) > Date.parse(r.tramos[i - 1].llegada), 'transbordo posterior a la llegada');
        }
        assert.equal(r.transbordos, r.tramos.length - 1);
        assert.ok(r.esperaTotalMin >= 0 && r.esperaInicialMin >= 0);
      }
    }
  }
});

prueba('"Menor tiempo total" cuenta la espera inicial: Loja → Cariamanga a las 08:00', () => {
  const desde = '2026-11-25T08:00:00-05:00';
  const p = crearPlanificador(baseDir, desde);
  const r = p.buscarRuta({ origen: 'Loja', destino: 'Cariamanga', desde, criterio: 'tiempo' });
  // Antes recomendaba salir 11:00 y llegar 13:00 aunque existía una opción que llega 11:17.
  assert.ok(r, 'debe existir ruta');
  assert.ok(llegada(r) <= Date.parse('2026-11-25T11:17:00-05:00'), `llega ${r.tramos.at(-1).llegada}`);
});

prueba('"Menor tiempo total" nunca llega más tarde que otro criterio', () => {
  for (const desde of consultas) {
    const p = crearPlanificador(baseDir, desde);
    for (const origen of nombres) for (const destino of nombres) {
      if (origen === destino) continue;
      const rt = p.buscarRuta({ origen, destino, desde, criterio: 'tiempo' });
      for (const criterio of ['espera', 'conexiones']) {
        const otra = p.buscarRuta({ origen, destino, desde, criterio });
        if (!otra) continue;
        assert.ok(rt, `${origen}→${destino}: si ${criterio} encuentra ruta, tiempo también`);
        assert.ok(llegada(rt) <= llegada(otra), `${origen}→${destino} ${desde}: tiempo llega después que ${criterio}`);
      }
    }
  }
});

prueba('"Menos conexiones" no usa más transbordos que los otros criterios', () => {
  const desde = consultas[0];
  const p = crearPlanificador(baseDir, desde);
  for (const origen of nombres) for (const destino of nombres) {
    if (origen === destino) continue;
    const rc = p.buscarRuta({ origen, destino, desde, criterio: 'conexiones' });
    for (const criterio of ['tiempo', 'espera']) {
      const otra = p.buscarRuta({ origen, destino, desde, criterio });
      if (otra) assert.ok(rc.transbordos <= otra.transbordos);
    }
  }
});

prueba('devuelve null cuando no hay conexión (RF-07) y valida el criterio', () => {
  const desde = consultas[0];
  const p = crearPlanificador(baseDir, desde);
  assert.equal(p.buscarRuta({ origen: 'Machala', destino: 'Loja', desde, criterio: 'tiempo' }), null);
  assert.throws(() => p.buscarRuta({ origen: 'Loja', destino: 'Machala', desde, criterio: 'otro' }));
});

console.log(`\n${correctas} pruebas correctas, ${fallos.length} fallidas`);
if (fallos.length) { console.error(fallos.join('\n')); process.exit(1); }
