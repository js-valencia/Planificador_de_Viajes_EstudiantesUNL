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

t.fin();
