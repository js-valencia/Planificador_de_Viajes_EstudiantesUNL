// Pruebas HTTP de la API Express (levanta el servidor en un puerto libre).
// Ejecutar: node tests/api.test.js   (o npm test)
const assert = require('node:assert/strict');
const app = require('../src/main/view/servidor');

let correctas = 0;
const fallos = [];
async function prueba(nombre, cuerpo) {
  try { await cuerpo(); correctas++; console.log(`  ✓ ${nombre}`); }
  catch (e) { fallos.push(`${nombre}: ${e.message}`); console.log(`  ✗ ${nombre}\n      ${e.message.split('\n')[0]}`); }
}

async function main() {
  const servidor = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const base = `http://127.0.0.1:${servidor.address().port}`;
  const get = (ruta) => fetch(`${base}${ruta}`);
  const ruta = (params) => get(`/api/ruta?${new URLSearchParams(params)}`);
  const valida = { origen: 'Loja', destino: 'Machala', desde: '2026-11-25T08:00:00-05:00', criterio: 'tiempo' };

  console.log('API REST');

  await prueba('GET /api/health responde {ok:true} con CORS', async () => {
    const r = await get('/api/health');
    assert.equal(r.status, 200);
    assert.equal(r.headers.get('access-control-allow-origin'), '*');
    assert.deepEqual(await r.json(), { ok: true });
  });

  await prueba('GET /api/terminales devuelve terminales con coordenadas y criterios', async () => {
    const data = await (await get('/api/terminales')).json();
    assert.ok(data.terminales.length >= 2);
    assert.ok(data.terminales.every((t) => typeof t.nombre === 'string' && typeof t.lat === 'number' && typeof t.lng === 'number'));
    assert.deepEqual(data.criterios, ['tiempo', 'espera', 'conexiones']);
  });

  await prueba('GET /api/ruta devuelve un itinerario con el contrato que usa la app', async () => {
    const r = await ruta(valida);
    assert.equal(r.status, 200);
    const { ruta: itinerario } = await r.json();
    assert.ok(itinerario.tramos.length > 0);
    for (const t of itinerario.tramos) {
      for (const campo of ['cooperativa', 'desde', 'hasta', 'salida', 'llegada']) assert.equal(typeof t[campo], 'string');
      assert.ok(!Number.isNaN(Date.parse(t.salida)));
    }
    for (const campo of ['transbordos', 'esperaTotalMin', 'duracionViajeMin', 'esperaInicialMin']) {
      assert.equal(typeof itinerario[campo], 'number');
    }
  });

  await prueba('GET /api/ruta devuelve ruta:null cuando no hay conexión', async () => {
    const r = await ruta({ ...valida, origen: 'Machala', destino: 'Loja' });
    assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), { ruta: null });
  });

  await prueba('rechaza entradas inválidas con 400 y mensaje JSON (RNF-07)', async () => {
    const casos = [
      { ...valida, origen: 'Quito' },
      { ...valida, destino: 'Loja' },
      { ...valida, criterio: 'barato' },
      { ...valida, desde: 'mañana' },
      { ...valida, desde: '2026-11-25 08:00' },
      { ...valida, desde: '2026-11-25T8:00:00-05:00' },
      { ...valida, desde: '2026-13-25T08:00:00-05:00' },
    ];
    for (const params of casos) {
      const r = await ruta(params);
      assert.equal(r.status, 400, JSON.stringify(params));
      assert.equal(typeof (await r.json()).error, 'string');
    }
  });

  await prueba('rutas desconocidas responden 404 JSON y no se expone el código del servidor', async () => {
    for (const p of ['/api/nada', '/servidor.js']) {
      const r = await get(p);
      assert.equal(r.status, 404, p);
      assert.match(r.headers.get('content-type'), /application\/json/);
    }
  });

  await prueba('GET / sirve el cliente web', async () => {
    const r = await get('/');
    assert.equal(r.status, 200);
    assert.match(r.headers.get('content-type'), /text\/html/);
  });

  await prueba('consultas repetidas reutilizan el planificador y responden igual', async () => {
    const a = await (await ruta(valida)).json();
    const b = await (await ruta({ ...valida, desde: '2026-11-25T08:00:00-05:00' })).json();
    assert.deepEqual(a, b);
  });

  await prueba('X-Cache marca MISS la primera vez y HIT al repetir; stats refleja el acierto', async () => {
    const params = { ...valida, desde: '2026-11-25T10:07:00-05:00' }; // instante no usado antes
    const primera = await ruta(params);
    const segunda = await ruta(params);
    assert.equal(primera.headers.get('x-cache'), 'MISS');
    assert.equal(segunda.headers.get('x-cache'), 'HIT');
    assert.deepEqual(await primera.json(), await segunda.json());
    const stats = await (await get('/api/cache/stats')).json();
    assert.ok(stats.resultados.aciertos >= 1);
  });

  servidor.close();
  console.log(`\n${correctas} pruebas correctas, ${fallos.length} fallidas`);
  if (fallos.length) { console.error(fallos.join('\n')); process.exit(1); }
}

main();
