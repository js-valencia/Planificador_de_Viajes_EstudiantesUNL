// Fechas y horas siempre en hora de Ecuador, sin importar la zona del teléfono.
// Ejecutar también con otra zona: TZ=Asia/Tokyo npm test
import assert from 'node:assert/strict';
import * as f from '../src/fechas.ts';
import { crearArnes } from './comun.mjs';

const t = crearArnes(`Fechas en hora de Ecuador (TZ del proceso: ${process.env.TZ ?? 'sistema'})`);
const instante = Date.parse('2026-11-26T03:10:00Z'); // 25/11 22:10 en Ecuador

await t.prueba('fechaEcuador usa UTC-5 aunque en UTC ya sea el día siguiente', () => {
  assert.equal(f.fechaEcuador(instante), '2026-11-25');
});

await t.prueba('horaSiguienteEcuador redondea a la siguiente media hora', () => {
  assert.equal(f.horaSiguienteEcuador(instante), '23:00');
  assert.equal(f.horaSiguienteEcuador(Date.parse('2026-11-25T13:00:00Z')), '08:30');
});

await t.prueba('horaEcuador12 formatea en 12 h y en hora de Ecuador', () => {
  assert.equal(f.horaEcuador12('2026-11-25T14:02:00.000Z'), '9:02 a. m.');
  assert.equal(f.horaEcuador12('2026-11-25T17:00:00.000Z'), '12:00 p. m.');
  assert.equal(f.horaEcuador12('2026-11-26T05:30:00.000Z'), '12:30 a. m.');
  assert.equal(f.horaEcuador12('no-es-fecha'), '--:--');
});

await t.prueba('valida fecha y hora antes de consultar', () => {
  assert.ok(f.esFechaValida('2026-11-25'));
  assert.ok(!f.esFechaValida('2026-02-30'));
  assert.ok(!f.esFechaValida('25/11/2026'));
  assert.ok(f.esHoraValida('07:30'));
  assert.ok(!f.esHoraValida('7:30'));
  assert.ok(!f.esHoraValida('24:00'));
});

await t.prueba('instanteConsulta produce el formato que acepta el backend', () => {
  assert.equal(f.instanteConsulta('2026-11-25', '08:00'), '2026-11-25T08:00:00-05:00');
});

// ---- Cuenta regresiva hasta la salida del bus ----
const salida = Date.parse(f.instanteConsulta('2026-11-25', '08:00')); // 13:00 UTC
const cr = (faltanMs) => f.cuentaRegresiva(salida, salida - faltanMs);
const S = 1000, M = 60 * S, H = 60 * M, D = 24 * H;

await t.prueba('cuentaRegresiva descompone días, horas, minutos y segundos', () => {
  assert.deepEqual(cr(2 * D + 3 * H + 4 * M + 5 * S), { estado: 'pendiente', dias: 2, horas: 3, minutos: 4, segundos: 5 });
  assert.deepEqual(cr(59 * S), { estado: 'pendiente', dias: 0, horas: 0, minutos: 0, segundos: 59 });
  assert.deepEqual(cr(H), { estado: 'pendiente', dias: 0, horas: 1, minutos: 0, segundos: 0 });
});

await t.prueba('cuentaRegresiva redondea hacia arriba y llega a 0 justo en la hora de salida', () => {
  assert.equal(cr(1).segundos, 1);
  assert.equal(cr(1500).segundos, 2);
  assert.equal(cr(0).estado, 'saliendo');
});

await t.prueba('cuentaRegresiva: saliendo durante el primer minuto y luego salido, sin negativos', () => {
  assert.equal(cr(-1).estado, 'saliendo');
  assert.equal(cr(-(M - 1)).estado, 'saliendo');
  for (const pasado of [-M, -5 * M, -3 * D]) {
    assert.deepEqual(cr(pasado), { estado: 'salido', dias: 0, horas: 0, minutos: 0, segundos: 0 });
  }
});

await t.prueba('cuentaRegresiva usa la hora de Ecuador, no la del dispositivo', () => {
  assert.deepEqual(f.cuentaRegresiva(salida, Date.parse('2026-11-25T12:59:50Z')),
    { estado: 'pendiente', dias: 0, horas: 0, minutos: 0, segundos: 10 });
  const madrugada = Date.parse(f.instanteConsulta('2026-11-26', '06:00'));
  assert.deepEqual(f.cuentaRegresiva(madrugada, Date.parse('2026-11-26T04:30:00Z')),
    { estado: 'pendiente', dias: 0, horas: 6, minutos: 30, segundos: 0 });
});

await t.prueba('cuentaRegresiva rechaza fechas inválidas', () => {
  assert.equal(f.cuentaRegresiva(NaN, 0), null);
  assert.equal(f.cuentaRegresiva(Date.parse('no-es-fecha'), 0), null);
});

await t.prueba('unidadesCuentaRegresiva muestra días y horas solo cuando corresponden', () => {
  const texto = (n) => f.unidadesCuentaRegresiva(cr(n)).map((u) => `${u.valor}${u.etiqueta}`).join(' ');
  assert.equal(texto(2 * D + 3 * H + 4 * M + 5 * S), '02días 03horas 04min 05seg');
  assert.equal(texto(D + 5 * S), '01días 00horas 00min 05seg');
  assert.equal(texto(3 * H + 9 * S), '03horas 00min 09seg');
  assert.equal(texto(7 * M + 9 * S), '07min 09seg');
  assert.equal(texto(9 * S), '00min 09seg');
});

t.fin();
