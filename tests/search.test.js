// Pruebas de búsqueda secuencial y binaria sobre el mismo arreglo.
// Ejecutar: node tests/search.test.js   (o npm test)
// Mismo estilo que los demás tests: node:assert, sin dependencias nuevas, sin Array.prototype.sort.
const assert = require('node:assert/strict');
const { busquedaSecuencial } = require('../src/main/domain/search/BusquedaSecuencial');
const { busquedaBinaria } = require('../src/main/domain/search/BusquedaBinaria');
const { medirBusqueda } = require('../src/main/domain/search/medicion');
const { mergeSort } = require('../src/main/domain/sort/MergeSort');
const { compararRutas } = require('../src/main/domain/sort/comparadorRutas');
const { rutas } = require('../src/main/data/rutas.json');

let correctas = 0;
const fallos = [];
function prueba(nombre, cuerpo) {
  try { cuerpo(); correctas++; console.log(`  ✓ ${nombre}`); }
  catch (e) { fallos.push(`${nombre}: ${e.message}`); console.log(`  ✗ ${nombre}\n      ${e.message.split('\n')[0]}`); }
}

const ordenadas = mergeSort(rutas, compararRutas);
const numeros = Array.from({ length: 1000 }, (_, i) => i * 2); // pares 0..1998, ordenados
const techoLog2 = (n) => Math.floor(Math.log2(n)) + 1;

console.log('Búsqueda secuencial y binaria');

prueba('ambas encuentran cada ruta real en el mismo índice', () => {
  for (let i = 0; i < ordenadas.length; i++) {
    const s = busquedaSecuencial(ordenadas, ordenadas[i], compararRutas);
    const b = busquedaBinaria(ordenadas, ordenadas[i], compararRutas);
    assert.equal(s.encontrado, true);
    assert.equal(b.encontrado, true);
    assert.equal(s.indice, i);
    assert.equal(b.indice, i);
  }
});

prueba('ambas coinciden en una clave inexistente (devuelven -1)', () => {
  const clave = { id: 'ZZZ-99', cooperativa: 'Zamora', nombre: 'Zamora - Loja' };
  const s = busquedaSecuencial(ordenadas, clave, compararRutas);
  const b = busquedaBinaria(ordenadas, clave, compararRutas);
  assert.deepEqual([s.encontrado, s.indice], [false, -1]);
  assert.deepEqual([b.encontrado, b.indice], [false, -1]);
});

prueba('secuencial: éxito en la posición k cuesta k+1 comparaciones; fallo cuesta n', () => {
  assert.equal(busquedaSecuencial(numeros, 0).comparaciones, 1);
  assert.equal(busquedaSecuencial(numeros, 1998).comparaciones, 1000);
  assert.equal(busquedaSecuencial(numeros, 7).comparaciones, 1000); // impar: no existe
});

prueba('binaria: nunca supera floor(log2 n)+1 comparaciones, con éxito o con fallo', () => {
  const tope = techoLog2(numeros.length); // 10
  for (let v = -1; v <= 2000; v++) assert.ok(busquedaBinaria(numeros, v).comparaciones <= tope, `valor ${v}`);
});

prueba('binaria con n=1 y n=2 y arreglo vacío', () => {
  assert.deepEqual(busquedaBinaria([5], 5), { encontrado: true, indice: 0, comparaciones: 1 });
  assert.deepEqual(busquedaBinaria([5], 4), { encontrado: false, indice: -1, comparaciones: 1 });
  assert.equal(busquedaBinaria([1, 2], 2).indice, 1);
  assert.deepEqual(busquedaBinaria([], 1), { encontrado: false, indice: -1, comparaciones: 0 });
  assert.deepEqual(busquedaSecuencial([], 1), { encontrado: false, indice: -1, comparaciones: 0 });
});

prueba('no modifican el arreglo de entrada', () => {
  const copia = numeros.slice();
  busquedaSecuencial(numeros, 500); busquedaBinaria(numeros, 500);
  assert.deepEqual(numeros, copia);
});

prueba('validan argumentos', () => {
  assert.throws(() => busquedaSecuencial('x', 1), TypeError);
  assert.throws(() => busquedaBinaria(null, 1), TypeError);
  assert.throws(() => busquedaBinaria([1], 1, 'no'), TypeError);
});

prueba('medirBusqueda devuelve comparaciones y tiempo con performance.now()', () => {
  const m = medirBusqueda(busquedaBinaria, numeros, 1000, undefined, 1000);
  assert.equal(m.encontrado, true);
  assert.equal(m.indice, 500);
  assert.ok(m.comparaciones >= 1 && m.comparaciones <= 10);
  assert.ok(m.tiempoTotalMs >= 0 && m.tiempoPromedioMs >= 0);
  assert.equal(m.repeticiones, 1000);
  assert.throws(() => medirBusqueda(busquedaBinaria, numeros, 1, undefined, 0), RangeError);
});

console.log(`\n${correctas} pruebas correctas, ${fallos.length} fallidas`);
if (fallos.length) { console.error(fallos.join('\n')); process.exit(1); }
