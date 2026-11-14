const assert = require('node:assert/strict');
const { ordenar } = require('../src/main/domain/sort/MergeSort');

// Casos básicos
assert.deepEqual(ordenar([]), []);
assert.deepEqual(ordenar([1]), [1]);
assert.deepEqual(ordenar([3, 1, 2]), [1, 2, 3]);
assert.deepEqual(ordenar([5, 4, 3, 2, 1]), [1, 2, 3, 4, 5]);
assert.deepEqual(ordenar([2, 2, 1, 1, 3, 3]), [1, 1, 2, 2, 3, 3]);
assert.deepEqual(ordenar(['b', 'c', 'a']), ['a', 'b', 'c']);

// No modifica el arreglo original y devuelve uno nuevo
const original = [4, 2, 9, 1];
const copia = original.slice();
const resultado = ordenar(original);
assert.deepEqual(original, copia, 'No debe modificar el arreglo original');
assert.notEqual(resultado, original, 'Debe devolver un arreglo nuevo');

// Comparador personalizado sobre registros de ruta, y estabilidad
const registros = [
  { id: 1, destino: 'Cariamanga', minutos: 180 },
  { id: 2, destino: 'Catamayo', minutos: 45 },
  { id: 3, destino: 'Macará', minutos: 180 },
  { id: 4, destino: 'Catamayo', minutos: 30 },
  { id: 5, destino: 'Alamor', minutos: 180 },
];
const porMinutos = ordenar(registros, (a, b) => a.minutos - b.minutos);
assert.deepEqual(porMinutos.map((r) => r.id), [4, 2, 1, 3, 5], 'Ordena por minutos y es estable');
assert.deepEqual(registros.map((r) => r.id), [1, 2, 3, 4, 5], 'Registros originales intactos');

// Validación de argumentos
assert.throws(() => ordenar('abc'), TypeError);
assert.throws(() => ordenar([1], 'x'), TypeError);

// Aleatorio contra el orden de referencia (el .sort() solo se usa aquí, para verificar)
for (let t = 0; t < 200; t++) {
  const n = Math.floor(Math.random() * 300);
  const a = Array.from({ length: n }, () => Math.floor(Math.random() * 100));
  assert.deepEqual(ordenar(a, (x, y) => x - y), [...a].sort((x, y) => x - y));
}

// Arreglo grande (sin desbordar la pila)
const grande = Array.from({ length: 200000 }, (_, i) => (i * 7919) % 100003);
const g = ordenar(grande);
for (let i = 1; i < g.length; i++) assert.ok(g[i - 1] <= g[i]);

console.log('MergeSort test OK');
