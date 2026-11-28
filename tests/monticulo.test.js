const assert = require('node:assert/strict');
const { MonticuloBinario, heapSort } = require('../src/main/domain/datos/MonticuloBinario');
const { mergeSort } = require('../src/main/domain/sort/MergeSort');
const { compararRutas } = require('../src/main/domain/sort/comparadorRutas');
const { rutas } = require('../src/main/data/rutas.json');

const vacio = new MonticuloBinario();
assert.equal(vacio.size, 0);
assert.equal(vacio.estaVacio(), true);
assert.equal(vacio.ver(), undefined);
assert.equal(vacio.extraer(), undefined);

const min = new MonticuloBinario();
[5, 3, 8, 1, 9, 2, 7].forEach((n) => min.insertar(n));
assert.equal(min.size, 7);
assert.equal(min.ver(), 1);
assert.deepEqual(min.ordenados(), [1, 2, 3, 5, 7, 8, 9]);
assert.equal(min.size, 7, 'ordenados() no debe destruir el montículo');
const salida = [];
while (!min.estaVacio()) salida.push(min.extraer());
assert.deepEqual(salida, [1, 2, 3, 5, 7, 8, 9]);

const max = new MonticuloBinario((a, b) => b - a);
[4, 10, 2, 6].forEach((n) => max.insertar(n));
assert.equal(max.extraer(), 10);
assert.equal(max.extraer(), 6);

const dup = MonticuloBinario.desdeArreglo([2, 2, 1, 1, 3]);
assert.deepEqual(dup.ordenados(), [1, 1, 2, 2, 3]);
const uno = new MonticuloBinario();
uno.insertar(42);
assert.equal(uno.extraer(), 42);
assert.equal(uno.size, 0);

const original = [3, 1, 2];
MonticuloBinario.desdeArreglo(original);
assert.deepEqual(original, [3, 1, 2]);

assert.throws(() => new MonticuloBinario('no soy función'), /comparador/);

let semilla = 12345;
const azar = () => (semilla = (semilla * 1103515245 + 12345) % 2147483648) / 2147483648;
const aleatorios = Array.from({ length: 500 }, () => Math.floor(azar() * 1000));
const m = new MonticuloBinario();
aleatorios.forEach((n, i) => {
  m.insertar(n);
  if (i % 7 === 0) m.extraer();
});
for (let i = 1; i < m.datos.length; i++) {
  assert.ok(m.comparador(m.datos[(i - 1) >> 1], m.datos[i]) <= 0, 'padre debe tener prioridad >= hijo');
}

assert.deepEqual(heapSort(aleatorios, (a, b) => a - b), mergeSort(aleatorios, (a, b) => a - b));
assert.deepEqual(heapSort([]), []);

const porHeap = heapSort(rutas, compararRutas);
const porMerge = mergeSort(rutas, compararRutas);
assert.equal(porHeap.length, rutas.length);
assert.deepEqual(porHeap.map((r) => r.id), porMerge.map((r) => r.id));

console.log('monticulo.test.js OK');