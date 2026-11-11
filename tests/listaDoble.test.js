const assert = require('node:assert/strict');
const { ListaDobleEnlazada } = require('../src/main/domain/datos/ListaDobleEnlazada');
const { crearListaParadas, generarFrecuencias } = require('../src/main/domain/datos/GenerarFrecuencias');
const GrafoHorarios = require('../src/main/domain/graph/GrafoHorarios');
const Planificador = require('../src/main/domain/planning/Planificador');
const { rutas } = require('../src/main/data/rutas.json');

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

const paradas = crearListaParadas([
	{ terminal: 'Loja', minutos: 0 },
	{ terminal: 'Catacocha', minutos: 135 },
	{ terminal: 'Macará', minutos: 225 },
]);
assert.equal(paradas.cabeza.siguiente.valor.terminal, 'Catacocha');
assert.equal(paradas.cabeza.siguiente.anterior, paradas.cabeza);
assert.equal(paradas.cola.anterior.valor.terminal, 'Catacocha');
assert.equal(paradas.cola.anterior.siguiente, paradas.cola);

const { frecuencias, errores } = generarFrecuencias([{
	id: 'TEST-01',
	cooperativa: 'Loja',
	paradas: paradas.recorrerAdelante(),
	salidas: ['06:00'],
}], ['2026-11-02']);
assert.deepEqual(errores, []);
assert.equal(frecuencias.length, 3, 'Debe generar las mismas tres combinaciones de paradas');
assert.deepEqual(frecuencias.map(({ origen, destino }) => [origen, destino]), [
	['Loja', 'Catacocha'],
	['Loja', 'Macará'],
	['Catacocha', 'Macará'],
]);

const rutaMacara = rutas.find((ruta) => ruta.id === 'LOJA-03');
const frecuenciasMacara = generarFrecuencias([rutaMacara], ['2026-11-02']).frecuencias;
const grafo = new GrafoHorarios(20).cargar(frecuenciasMacara);
const planificador = new Planificador(grafo);
const viaje = planificador.buscarRuta({
	origen: 'Loja',
	destino: 'Macará',
	desde: '2026-11-02T06:00:00-05:00',
});
assert.equal(viaje.tramos[0].nombreRuta, 'Loja - Macará x Catacocha');
assert.deepEqual(viaje.tramos[0].cantones, ['Paltas', 'Macará']);
assert.deepEqual(viaje.tramos[0].paradasRuta, [
	{ terminal: 'Loja', anterior: null, siguiente: 'Catacocha' },
	{ terminal: 'Catacocha', anterior: 'Loja', siguiente: 'Macará' },
	{ terminal: 'Macará', anterior: 'Catacocha', siguiente: null },
]);

console.log('Lista doblemente enlazada OK');