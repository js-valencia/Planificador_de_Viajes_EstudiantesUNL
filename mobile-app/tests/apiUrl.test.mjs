// Resolución de la URL del backend en cada escenario de ejecución.
import assert from 'node:assert/strict';
import { resolverApiUrl, hostDesdeHostUri } from '../src/apiUrl.ts';
import { crearArnes } from './comun.mjs';

const t = crearArnes('Resolución de la URL de la API');

await t.prueba('Expo Go en LAN: usa la IP de la computadora que sirve Metro', () => {
  const r = resolverApiUrl({ hostUri: '192.168.16.24:8081', plataforma: 'android', esDesarrollo: true });
  assert.deepEqual(r, { url: 'http://192.168.16.24:3001', fuente: 'expo-host' });
});

await t.prueba('EXPO_PUBLIC_API_URL tiene prioridad y se le quitan las barras finales', () => {
  const r = resolverApiUrl({ envUrl: ' https://api.ejemplo.ec/ ', hostUri: '192.168.0.5:8081', plataforma: 'android', esDesarrollo: true });
  assert.deepEqual(r, { url: 'https://api.ejemplo.ec', fuente: 'env' });
});

await t.prueba('una variable vacía no anula la detección automática (antes `??` la dejaba vacía)', () => {
  const r = resolverApiUrl({ envUrl: '', hostUri: '10.0.0.7:8081', plataforma: 'ios', esDesarrollo: true });
  assert.equal(r.url, 'http://10.0.0.7:3001');
});

await t.prueba('una URL mal escrita se informa en lugar de usarse', () => {
  const r = resolverApiUrl({ envUrl: '192.168.1.10:3001', plataforma: 'android', esDesarrollo: false });
  assert.equal(r.url, '');
  assert.match(r.problema, /no es una URL válida/);
});

await t.prueba('con --tunnel no se inventa http://xxx.exp.direct:3001', () => {
  const r = resolverApiUrl({ hostUri: 'abc-anon-8081.exp.direct', plataforma: 'android', esDesarrollo: true });
  assert.equal(r.url, '');
  assert.match(r.problema, /--tunnel/);
});

await t.prueba('emulador sin hostUri: 10.0.2.2 en Android y localhost en iOS', () => {
  assert.equal(resolverApiUrl({ plataforma: 'android', esDesarrollo: true }).url, 'http://10.0.2.2:3001');
  assert.equal(resolverApiUrl({ plataforma: 'ios', esDesarrollo: true }).url, 'http://localhost:3001');
});

await t.prueba('APK release sin URL: explica el problema (no usa localhost)', () => {
  const r = resolverApiUrl({ plataforma: 'android', esDesarrollo: false });
  assert.equal(r.url, '');
  assert.equal(r.fuente, 'ninguna');
  assert.match(r.problema, /EXPO_PUBLIC_API_URL/);
});

await t.prueba('hostDesdeHostUri admite IPv6 y esquemas', () => {
  assert.equal(hostDesdeHostUri('[::1]:8081'), '[::1]');
  assert.equal(hostDesdeHostUri('exp://192.168.1.2:8081/--/'), '192.168.1.2');
});

t.fin();
