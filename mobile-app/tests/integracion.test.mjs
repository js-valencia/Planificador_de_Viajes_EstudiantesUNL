// Integración real app ↔ backend: el mismo cliente HTTP que usa la app (src/http.ts)
// contra el servidor Express del repositorio, más los escenarios de fallo de red.
import assert from 'node:assert/strict';
import http from 'node:http';
import { createRequire } from 'node:module';
import { crearClienteApi, ApiError } from '../src/http.ts';
import { instanteConsulta } from '../src/fechas.ts';
import { crearArnes } from './comun.mjs';

const require = createRequire(import.meta.url);
const app = require('../../src/main/view/servidor.js');

const escuchar = (servidor) => new Promise((ok) => servidor.listen(0, '127.0.0.1', () => ok(servidor)));
const url = (s) => `http://127.0.0.1:${s.address().port}`;

const t = crearArnes('Integración cliente móvil ↔ backend');
const backend = await escuchar(http.createServer(app));
const cliente = crearClienteApi(url(backend));

await t.prueba('health y terminales', async () => {
  assert.equal(await cliente.verificarSalud(), true);
  const { terminales, criterios } = await cliente.obtenerTerminales();
  assert.ok(terminales.some((x) => x.nombre === 'Loja'));
  assert.deepEqual(criterios, ['tiempo', 'espera', 'conexiones']);
});

await t.prueba('buscarRuta con los parámetros exactos que arma App.tsx', async () => {
  for (const criterio of ['tiempo', 'espera', 'conexiones']) {
    const ruta = await cliente.buscarRuta({ origen: 'Loja', destino: 'Machala', desde: instanteConsulta('2026-11-25', '08:00'), criterio });
    assert.ok(ruta && ruta.tramos.length > 0, criterio);
    assert.equal(ruta.tramos[0].desde, 'Loja');
    assert.equal(ruta.tramos.at(-1).hasta, 'Machala');
  }
});

await t.prueba('sin conexión devuelve null (la app muestra "No existe una conexión válida")', async () => {
  assert.equal(await cliente.buscarRuta({ origen: 'Machala', destino: 'Loja', desde: instanteConsulta('2026-11-25', '08:00'), criterio: 'tiempo' }), null);
});

await t.prueba('los errores 400 del backend llegan con su mensaje', async () => {
  await assert.rejects(
    cliente.buscarRuta({ origen: 'Loja', destino: 'Loja', desde: instanteConsulta('2026-11-25', '08:00'), criterio: 'tiempo' }),
    (e) => e instanceof ApiError && e.tipo === 'http' && e.status === 400 && /distintos/.test(e.message),
  );
});

await t.prueba('backend apagado → error de red claro', async () => {
  const s = await escuchar(http.createServer());
  const direccion = url(s);
  await new Promise((ok) => s.close(ok));
  await assert.rejects(crearClienteApi(direccion).obtenerTerminales(), (e) => e.tipo === 'red' && e.message.includes(direccion));
});

await t.prueba('backend colgado → timeout', async () => {
  const s = await escuchar(http.createServer(() => {}));
  await assert.rejects(crearClienteApi(url(s), { timeoutMs: 300 }).obtenerTerminales(), (e) => e.tipo === 'timeout');
  s.closeAllConnections(); s.close();
});

await t.prueba('otro servidor (HTML) en ese puerto → error de formato', async () => {
  const s = await escuchar(http.createServer((req, res) => { res.setHeader('content-type', 'text/html'); res.end('<h1>hola</h1>'); }));
  await assert.rejects(crearClienteApi(url(s)).obtenerTerminales(), (e) => e.tipo === 'formato');
  s.close();
});

await t.prueba('sin URL configurada → mensaje de configuración', async () => {
  await assert.rejects(crearClienteApi('', { problemaConfiguracion: 'falta URL' }).obtenerTerminales(), (e) => e.tipo === 'config' && e.message === 'falta URL');
});

backend.close();
t.fin();
