// Demo: búsqueda secuencial vs binaria sobre el MISMO arreglo ordenado.
// Ejecutar desde la raíz del proyecto: npm run demo:busqueda
'use strict';
const { busquedaSecuencial } = require('../../src/main/domain/search/BusquedaSecuencial');
const { busquedaBinaria } = require('../../src/main/domain/search/BusquedaBinaria');
const { medirBusqueda } = require('../../src/main/domain/search/medicion');
const { mergeSort } = require('../../src/main/domain/sort/MergeSort');
const { compararRutas } = require('../../src/main/domain/sort/comparadorRutas');
const { rutas } = require('../../src/main/data/rutas.json');

const arreglo = mergeSort(rutas, compararRutas); // mismo arreglo ordenado para ambas
const claves = [
  ['exitosa (primera)', arreglo[0]],
  ['exitosa (última)', arreglo[arreglo.length - 1]],
  ['fallida', { id: 'ZZZ-99', cooperativa: 'Zamora', nombre: 'Zamora - Loja' }],
];

for (const [etiqueta, clave] of claves) {
  console.log(`\nBúsqueda ${etiqueta}`);
  for (const [nombre, fn] of [['Secuencial', busquedaSecuencial], ['Binaria', busquedaBinaria]]) {
    const m = medirBusqueda(fn, arreglo, clave, compararRutas, 10000);
    console.log(`  ${nombre.padEnd(10)} encontrado=${m.encontrado} indice=${m.indice} comparaciones=${m.comparaciones} tiempo=${m.tiempoPromedioMs.toFixed(6)} ms`);
  }
}
