// Pruebas del caché de consultas (TTL, clave, invalidación). No requiere Express.
// Ejecutar: node tests/cache.test.js   (o npm test)
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const CacheTTL = require('../src/main/services/CacheTTL');
const { crearServicioConsultas } = require('../src/main/services/consultasService');

const SRC = path.join(__dirname, '..', 'src', 'main');
let correctas = 0;
const fallos = [];
function prueba(nombre, cuerpo) {
  try { cuerpo(); correctas++; console.log(`  ✓ ${nombre}`); }
  catch (e) { fallos.push(`${nombre}: ${e.message}`); console.log(`  ✗ ${nombre}\n      ${e.message.split('\n')[0]}`); }
}
function reloj(inicio = 1_000_000) {
  const r = { t: inicio, ahora: () => r.t, avanzar(ms) { r.t += ms; } };
  return r;
}
// Copia de los datos en un directorio temporal para poder modificar rutas.json.
function copiaDeDatos() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'planificador-cache-'));
  fs.mkdirSync(path.join(dir, 'data'));
  for (const f of ['rutas.json', 'terminales.json']) fs.copyFileSync(path.join(SRC, 'data', f), path.join(dir, 'data', f));
  return dir;
}
const consulta = { origen: 'Loja', destino: 'Machala', desde: '2026-11-25T08:00:00-05:00', criterio: 'tiempo' };

console.log('CacheTTL');

prueba('devuelve lo guardado mientras no venza y cuenta aciertos/fallos', () => {
  const r = reloj(); const c = new CacheTTL({ ttlMs: 1000, ahora: r.ahora });
  assert.equal(c.get('a'), undefined);
  c.set('a', 1);
  r.avanzar(999);
  assert.equal(c.get('a'), 1);
  const s = c.estadisticas();
  assert.equal(s.aciertos, 1); assert.equal(s.fallos, 1);
});

prueba('una entrada vencida no se sirve y se elimina', () => {
  const r = reloj(); const c = new CacheTTL({ ttlMs: 1000, ahora: r.ahora });
  c.set('a', 1);
  r.avanzar(1000);
  assert.equal(c.get('a'), undefined);
  assert.equal(c.tamano, 0);
  assert.equal(c.estadisticas().vencimientos, 1);
});

prueba('expulsa la menos usada recientemente al superar maxEntradas', () => {
  const c = new CacheTTL({ ttlMs: 1000, maxEntradas: 2 });
  c.set('a', 1); c.set('b', 2);
  c.get('a');            // 'b' pasa a ser la menos reciente
  c.set('c', 3);
  assert.equal(c.get('b'), undefined);
  assert.equal(c.get('a'), 1);
  assert.equal(c.get('c'), 3);
  assert.equal(c.estadisticas().expulsiones, 1);
});

prueba('purgarVencidos elimina solo las vencidas', () => {
  const r = reloj(); const c = new CacheTTL({ ttlMs: 1000, ahora: r.ahora });
  c.set('a', 1); r.avanzar(600); c.set('b', 2); r.avanzar(600);
  assert.equal(c.purgarVencidos(), 1);
  assert.equal(c.get('b'), 2);
});

console.log('\nServicio de consultas');

prueba('una consulta repetida reutiliza el resultado (HIT) y es idéntico al calculado', () => {
  const s = crearServicioConsultas({ baseDir: SRC });
  const a = s.buscarRuta(consulta);
  const b = s.buscarRuta({ ...consulta });
  assert.equal(a.cache, 'MISS'); assert.equal(b.cache, 'HIT');
  assert.deepEqual(b.ruta, a.ruta);
  assert.ok(a.ruta && a.ruta.tramos.length > 0);
});

prueba('el resultado cacheado coincide con el de un planificador nuevo', () => {
  const { crearPlanificador } = require('../src/main/services/planificadorService');
  const s = crearServicioConsultas({ baseDir: SRC });
  s.buscarRuta(consulta);
  const guardado = s.buscarRuta(consulta).ruta;
  const directo = crearPlanificador(SRC, consulta.desde).buscarRuta(consulta);
  assert.deepEqual(guardado, directo);
});

prueba('la clave distingue origen, destino, criterio e instante', () => {
  const s = crearServicioConsultas({ baseDir: SRC });
  s.buscarRuta(consulta);
  for (const cambio of [{ destino: 'Catamayo' }, { origen: 'Catamayo' }, { criterio: 'conexiones' }, { desde: '2026-11-25T08:01:00-05:00' }]) {
    assert.equal(s.buscarRuta({ ...consulta, ...cambio }).cache, 'MISS', JSON.stringify(cambio));
  }
});

prueba('el mismo instante escrito con otra zona comparte entrada', () => {
  const s = crearServicioConsultas({ baseDir: SRC });
  s.buscarRuta(consulta);
  assert.equal(s.buscarRuta({ ...consulta, desde: '2026-11-25T13:00:00Z' }).cache, 'HIT');
});

prueba('"sin conexión" (null) también se cachea', () => {
  const s = crearServicioConsultas({ baseDir: SRC });
  const inv = { ...consulta, origen: 'Machala', destino: 'Loja' };
  assert.equal(s.buscarRuta(inv).ruta, null);
  const otra = s.buscarRuta(inv);
  assert.equal(otra.cache, 'HIT'); assert.equal(otra.ruta, null);
});

prueba('un resultado vencido se recalcula, no se sirve', () => {
  const r = reloj();
  const s = crearServicioConsultas({ baseDir: SRC, ttlResultadosMs: 1000, ahora: r.ahora });
  s.buscarRuta(consulta);
  r.avanzar(999);
  assert.equal(s.buscarRuta(consulta).cache, 'HIT');
  r.avanzar(2);
  assert.equal(s.buscarRuta(consulta).cache, 'MISS');
});

prueba('si rutas.json cambia, no se sirve el resultado anterior', () => {
  const dir = copiaDeDatos();
  try {
    const s = crearServicioConsultas({ baseDir: dir });
    const antes = s.buscarRuta(consulta);
    assert.equal(s.buscarRuta(consulta).cache, 'HIT');

    // Se elimina la ruta usada y se actualiza la fecha de modificación.
    const archivo = path.join(dir, 'data', 'rutas.json');
    const datos = JSON.parse(fs.readFileSync(archivo, 'utf8'));
    datos.rutas = datos.rutas.filter((x) => !x.paradas.some((p) => p.terminal === 'Machala'));
    fs.writeFileSync(archivo, JSON.stringify(datos));
    const futuro = new Date(Date.now() + 5000);
    fs.utimesSync(archivo, futuro, futuro);

    const despues = s.buscarRuta(consulta);
    assert.equal(despues.cache, 'MISS');
    assert.ok(antes.ruta, 'antes había itinerario');
    assert.equal(despues.ruta, null, 'ya no existen rutas a Machala');
    assert.equal(s.estadisticas().invalidacionesPorCambioDeDatos, 1);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

prueba('invalidar() descarta resultados y planificadores', () => {
  let creados = 0;
  const { crearPlanificador } = require('../src/main/services/planificadorService');
  const s = crearServicioConsultas({ baseDir: SRC, crear: (...a) => { creados++; return crearPlanificador(...a); } });
  s.buscarRuta(consulta); s.invalidar();
  assert.equal(s.buscarRuta(consulta).cache, 'MISS');
  assert.equal(creados, 2);
});

prueba('si no se puede verificar la versión de los datos, se invalida (falla hacia lo seguro)', () => {
  let falla = false;
  const s = crearServicioConsultas({ baseDir: SRC, obtenerVersion: () => { if (falla) throw new Error('sin acceso'); return 'v1'; } });
  s.buscarRuta(consulta);
  falla = true;
  assert.equal(s.buscarRuta(consulta).cache, 'MISS');
});

prueba('consultas de días distintos reutilizan el planificador de su ventana', () => {
  let creados = 0;
  const { crearPlanificador } = require('../src/main/services/planificadorService');
  const s = crearServicioConsultas({ baseDir: SRC, crear: (...a) => { creados++; return crearPlanificador(...a); } });
  s.buscarRuta(consulta);
  s.buscarRuta({ ...consulta, desde: '2026-11-25T09:00:00-05:00', criterio: 'espera' });
  assert.equal(creados, 1);
  s.buscarRuta({ ...consulta, desde: '2026-11-26T09:00:00-05:00' });
  assert.equal(creados, 2);
});

console.log(`\n${correctas} pruebas correctas, ${fallos.length} fallidas`);
if (fallos.length) { console.error(fallos.join('\n')); process.exit(1); }
