const assert = require('node:assert/strict');
const { CONFIG_BUSQUEDA, construirDatasetOrdenado, generarClaves } = require('../src/main/domain/datos/DatasetBusqueda');
const { compararRutas } = require('../src/main/domain/sort/comparadorRutas');
const { busquedaSecuencial } = require('../src/main/domain/search/BusquedaSecuencial');
const { busquedaBinaria } = require('../src/main/domain/search/BusquedaBinaria');

let correctas = 0;
const fallos = [];
function prueba(nombre, cuerpo) {
  try { cuerpo(); correctas++; console.log(`  ✓ ${nombre}`); }
  catch (e) { fallos.push(`${nombre}: ${e.message}`); console.log(`  ✗ ${nombre}\n      ${e.message.split('\n')[0]}`); }
}

console.log('Datos y claves de búsqueda (issue #15)');
const datos = construirDatasetOrdenado(1000);

prueba('el conjunto tiene n registros y está estrictamente ordenado', () => {
  assert.equal(datos.length, 1000);
  for (let i = 1; i < datos.length; i++) assert.ok(compararRutas(datos[i - 1], datos[i]) < 0);
});
prueba('es determinista: dos generaciones dan los mismos ids', () => {
  const otro = construirDatasetOrdenado(1000);
  assert.ok(datos.every((r, i) => r.id === otro[i].id));
});
prueba('las claves exitosas existen en el índice esperado (ambos algoritmos)', () => {
  for (const k of generarClaves(datos).exitosas) {
    assert.equal(busquedaSecuencial(datos, k.clave, compararRutas).indice, k.indiceEsperado);
    assert.equal(busquedaBinaria(datos, k.clave, compararRutas).indice, k.indiceEsperado);
  }
});
prueba('las claves fallidas no existen y el secuencial recorre los n registros', () => {
  for (const k of generarClaves(datos).fallidas) {
    const s = busquedaSecuencial(datos, k.clave, compararRutas);
    assert.equal(s.encontrado, false);
    assert.equal(s.comparaciones, datos.length);
    assert.equal(busquedaBinaria(datos, k.clave, compararRutas).encontrado, false);
  }
});
prueba('mismas claves con la misma semilla; hay 3 + K exitosas y 3 fallidas', () => {
  const a = generarClaves(datos), b = generarClaves(datos);
  assert.deepEqual(a.exitosas.map((k) => k.indiceEsperado), b.exitosas.map((k) => k.indiceEsperado));
  assert.equal(a.exitosas.length, 3 + CONFIG_BUSQUEDA.clavesAleatoriasPorTamanio);
  assert.equal(a.fallidas.length, 3);
});
prueba('la configuración pide exactamente 1.000, 50.000 y 500.000 registros', () => {
  assert.deepEqual(CONFIG_BUSQUEDA.tamanios, [1000, 50000, 500000]);
});

console.log(`\n${correctas} correctas, ${fallos.length} con fallos`);
if (fallos.length) { console.error(fallos.join('\n')); process.exit(1); }
