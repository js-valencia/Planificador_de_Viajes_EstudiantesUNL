const assert = require('node:assert/strict');
const { ListaDobleEnlazada } = require('../src/main/domain/datos/ListaDobleEnlazada');

const lista = new ListaDobleEnlazada();
assert.equal(lista.size, 0);
assert.deepEqual(lista.recorrerAdelante(), []);
assert.deepEqual(lista.recorrerAtras(), []);

const nodoMedio = lista.agregarAlFinal('B');
const nodoInicio = lista.agregarAlInicio('A');
const nodoFinal = lista.agregarAlFinal('C');

assert.equal(lista.size, 3);
assert.equal(nodoInicio.siguiente, nodoMedio);
assert.equal(nodoMedio.anterior, nodoInicio);
assert.equal(nodoMedio.siguiente, nodoFinal);
assert.equal(nodoFinal.anterior, nodoMedio);
assert.deepEqual(lista.recorrerAdelante(), ['A', 'B', 'C']);
assert.deepEqual(lista.recorrerAtras(), ['C', 'B', 'A']);
assert.deepEqual([...lista], ['A', 'B', 'C']);
assert.equal(lista.buscar('B'), nodoMedio);
assert.equal(lista.buscar('X'), null);

assert.equal(lista.eliminar('B'), true);
assert.equal(nodoMedio.anterior, null);
assert.equal(nodoMedio.siguiente, null);
assert.deepEqual(lista.recorrerAdelante(), ['A', 'C']);
assert.equal(lista.eliminar('A'), true);
assert.equal(lista.cabeza, nodoFinal);
assert.equal(nodoFinal.anterior, null);
assert.equal(lista.eliminar('C'), true);
assert.equal(lista.cabeza, null);
assert.equal(lista.cola, null);
assert.equal(lista.size, 0);
assert.equal(lista.eliminar('inexistente'), false);

console.log('Lista doblemente enlazada OK');