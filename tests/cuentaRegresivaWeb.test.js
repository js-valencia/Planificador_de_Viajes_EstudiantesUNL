// Prueba la lógica de la cuenta regresiva del cliente web (src/main/view/index.html).
// Se extrae el bloque delimitado por <cuenta-regresiva> y se ejecuta tal cual, sin navegador.
// Ejecutar también con otra zona: TZ=Asia/Tokyo node tests/cuentaRegresivaWeb.test.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'main', 'view', 'index.html'), 'utf8');
const bloque = /\/\/ <cuenta-regresiva>([\s\S]*?)\/\/ <\/cuenta-regresiva>/.exec(html);
assert.ok(bloque, 'No se encontró el bloque <cuenta-regresiva> en index.html');
const { cuentaRegresiva, unidadesCuentaRegresiva } = new Function(`${bloque[1]}\nreturn { cuentaRegresiva, unidadesCuentaRegresiva };`)();

const salida = Date.parse('2026-11-25T08:00:00-05:00');
const cr = (faltanMs) => cuentaRegresiva(salida, salida - faltanMs);
const S = 1000, M = 60 * S, H = 60 * M, D = 24 * H;

assert.deepEqual(cr(2 * D + 3 * H + 4 * M + 5 * S), { estado: 'pendiente', dias: 2, horas: 3, minutos: 4, segundos: 5 });
assert.deepEqual(cr(59 * S), { estado: 'pendiente', dias: 0, horas: 0, minutos: 0, segundos: 59 });
assert.equal(cr(1).segundos, 1, 'redondea hacia arriba');
assert.equal(cr(0).estado, 'saliendo', 'a la hora exacta: saliendo');
assert.equal(cr(-(M - 1)).estado, 'saliendo');
for (const pasado of [-M, -5 * M, -3 * D]) {
  assert.deepEqual(cr(pasado), { estado: 'salido', dias: 0, horas: 0, minutos: 0, segundos: 0 }, 'sin cuenta negativa');
}
assert.deepEqual(cuentaRegresiva(salida, Date.parse('2026-11-25T12:59:50Z')),
  { estado: 'pendiente', dias: 0, horas: 0, minutos: 0, segundos: 10 }, 'independiente de la zona del equipo');
assert.deepEqual(cuentaRegresiva(Date.parse('2026-11-26T06:00:00-05:00'), Date.parse('2026-11-26T04:30:00Z')),
  { estado: 'pendiente', dias: 0, horas: 6, minutos: 30, segundos: 0 }, 'cruce de medianoche');
assert.equal(cuentaRegresiva(NaN, 0), null);

const texto = (n) => unidadesCuentaRegresiva(cr(n)).map((u) => `${u.valor}${u.etiqueta}`).join(' ');
assert.equal(texto(2 * D + 3 * H + 4 * M + 5 * S), '02días 03horas 04min 05seg');
assert.equal(texto(3 * H + 9 * S), '03horas 00min 09seg');
assert.equal(texto(9 * S), '00min 09seg');

console.log(`Cuenta regresiva web OK (TZ del proceso: ${process.env.TZ ?? 'sistema'})`);
