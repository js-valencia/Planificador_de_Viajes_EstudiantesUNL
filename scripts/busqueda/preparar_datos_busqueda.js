'use strict';
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { performance } = require('node:perf_hooks');
const { CONFIG_BUSQUEDA: C, construirDatasetOrdenado, generarClaves } = require('../../src/main/domain/datos/DatasetBusqueda');
const { compararRutas } = require('../../src/main/domain/sort/comparadorRutas');
const { busquedaSecuencial } = require('../../src/main/domain/search/BusquedaSecuencial');
const { busquedaBinaria } = require('../../src/main/domain/search/BusquedaBinaria');

const huella = (arr) => crypto.createHash('sha1').update(arr.map((r) => r.id).join('|')).digest('hex').slice(0, 12);
// Orden ESTRICTO (< 0): ningún par de registros es equivalente, así que la posición de cada clave es única.
const estrictamenteOrdenado = (arr) => { for (let i = 1; i < arr.length; i++) if (compararRutas(arr[i - 1], arr[i]) >= 0) return false; return true; };
const techoLog2 = (n) => Math.floor(Math.log2(n)) + 1;
const miles = (n) => n.toLocaleString('es-EC');

const manifiesto = { node: process.version, semilla: C.semilla, criterioOrden: 'cooperativa -> nombre -> id', config: C, conjuntos: [] };

for (const n of C.tamanios) {
  const t0 = performance.now();
  const datos = construirDatasetOrdenado(n);
  const msGeneracion = performance.now() - t0;
  if (datos.length !== n) throw new Error(`n=${n}: se generaron ${datos.length} registros`);
  if (!estrictamenteOrdenado(datos)) throw new Error(`n=${n}: el arreglo NO está estrictamente ordenado`);

  const { exitosas, fallidas } = generarClaves(datos);
  const claves = [];
  for (const k of exitosas) {
    const s = busquedaSecuencial(datos, k.clave, compararRutas);
    const b = busquedaBinaria(datos, k.clave, compararRutas);
    if (!(s.encontrado && b.encontrado && s.indice === k.indiceEsperado && b.indice === k.indiceEsperado)) throw new Error(`n=${n}: la clave exitosa ${k.etiqueta} no se encuentra donde se esperaba`);
    claves.push({ tipo: 'exitosa', etiqueta: k.etiqueta, indice: k.indiceEsperado, id: k.clave.id, compSecuencial: s.comparaciones, compBinaria: b.comparaciones });
  }
  for (const k of fallidas) {
    const s = busquedaSecuencial(datos, k.clave, compararRutas);
    const b = busquedaBinaria(datos, k.clave, compararRutas);
    if (s.encontrado || b.encontrado) throw new Error(`n=${n}: la clave fallida ${k.etiqueta} SÍ existe en el arreglo`);
    claves.push({ tipo: 'fallida', etiqueta: k.etiqueta, indice: -1, id: k.clave.id, compSecuencial: s.comparaciones, compBinaria: b.comparaciones });
  }
  manifiesto.conjuntos.push({ n, huella: huella(datos), primerId: datos[0].id, ultimoId: datos[n - 1].id, techoLog2: techoLog2(n), msGeneracionYOrden: Math.round(msGeneracion), claves });
  console.log(`n=${miles(n).padStart(7)}  ordenado ✓  huella ${huella(datos)}  claves ${claves.length} verificadas  (${Math.round(msGeneracion)} ms)`);
}

// ---- Metodología (generada desde CONFIG_BUSQUEDA para que el documento nunca difiera del código) ----
const filasTam = manifiesto.conjuntos.map((c) => `| ${miles(c.n)} | ${c.huella} | ${c.primerId} | ${c.ultimoId} | ${c.techoLog2} |`);
const filasRep = C.tamanios.map((n) => `| ${miles(n)} | ${C.repeticionesInternas.secuencial[n]} | ${C.repeticionesInternas.binaria[n]} | ${C.medicionesPorClave} | ${C.calentamiento} |`);
const md = `# Datos y metodología: búsqueda secuencial vs binaria (issue #15)

- Node ${process.version} | semilla ${C.semilla} | criterio de orden: cooperativa -> nombre -> id (\`compararRutas\`)
- Reproducir: \`npm run datos:busqueda\` (genera y verifica) y luego el benchmark de búsqueda.

## 1. Conjuntos ordenados

Cada conjunto parte de las 11 rutas reales de \`rutas.json\`, repetidas con id único (LOJA-01-000001, ...), y se ordena con el MergeSort del proyecto (sin \`.sort()\`). Se verifica que el orden sea estricto (sin empates) y que \`n\` coincida. No se guardan los 500.000 registros en disco: se regeneran con la semilla y la huella (SHA-1 de los ids, 12 caracteres) confirma que son idénticos.

| n | Huella | Primer id | Último id | ⌊log2 n⌋+1 |
| --- | --- | --- | --- | --- |
${filasTam.join('\n')}

## 2. Búsquedas exitosas y fallidas

Ambos algoritmos reciben **el mismo arreglo ordenado** y **la misma clave** (comparador \`compararRutas\`). Una comparación = una llamada al comparador.

| Tipo | Clave | Qué representa | Comparaciones esperadas (sec. / bin.) |
| --- | --- | --- | --- |
| Exitosa | primera posición | mejor caso secuencial | 1 / ≈ ⌊log2 n⌋ |
| Exitosa | posición n/2 | caso intermedio | ≈ n/2 / ≈ ⌊log2 n⌋ |
| Exitosa | última posición | peor caso secuencial | n / ≈ ⌊log2 n⌋ |
| Exitosa | ${C.clavesAleatoriasPorTamanio} posiciones aleatorias (semilla) | caso promedio | ≈ n/2 / ≈ ⌊log2 n⌋ |
| Fallida | menor que todas (\`AAA-00\`) | no existe, cae antes del primero | n / ≈ ⌊log2 n⌋ |
| Fallida | intermedia (id de la mitad + \`-x\`) | no existe, cae entre dos registros | n / ≈ ⌊log2 n⌋ |
| Fallida | mayor que todas (\`ZZZ-99\`) | no existe, cae después del último | n / ≈ ⌊log2 n⌋ |

Antes de medir, el script comprueba con ambos algoritmos que cada clave exitosa está en el índice esperado y que ninguna fallida existe.

## 3. Repeticiones

| n | Ejecuciones por medición (secuencial) | Ejecuciones por medición (binaria) | Mediciones válidas por clave | Calentamiento (descartadas) |
| --- | --- | --- | --- | --- |
${filasRep.join('\n')}

Una búsqueda dura microsegundos (binaria) o milisegundos (secuencial en 500.000), así que una **medición** cronometra varias ejecuciones seguidas con \`performance.now()\` y divide entre ese número (\`medirBusqueda\`). Las ejecuciones por medición se reducen en los tamaños grandes del secuencial para que el benchmark termine en minutos.

## 4. Cómo se calculan los promedios

1. **Por clave:** de las ${C.medicionesPorClave} mediciones válidas se calculan media, mediana, desviación estándar, mínimo y máximo (ordenando las muestras con inserción, sin \`.sort()\`). No se descartan valores atípicos; la mediana sirve de control.
2. **Por categoría y tamaño:** el tiempo reportado es la **media de las medias por clave**; todas las claves pesan igual. Categorías: exitosa-primera, exitosa-mitad, exitosa-última, exitosa-aleatorias (promedio de las ${C.clavesAleatoriasPorTamanio}) y fallida (promedio de las 3 claves fallidas, más el detalle por clave).
3. **Comparaciones:** son deterministas (no varían entre repeticiones), se registran una vez por clave y se promedian igual por categoría.
4. **Tabla final:** por cada n (1.000 / 50.000 / 500.000) y algoritmo: tiempo medio (ms), desviación, comparaciones medias y la razón secuencial/binaria.
5. **Reproducibilidad:** semilla fija, mismo Node y misma máquina; se anotan versión de Node y plataforma en los resultados.

## 5. Mecanismo de archivos utilizado
El proyecto almacena sus datos en archivos JSON (\`terminales.json\` y \`rutas.json\`), que se leen con \`fs.readFileSync\` y \`JSON.parse\`. Para este benchmark se usó ese mismo mecanismo: se guarda el arreglo ordenado en un archivo JSON, se mide por separado el tiempo de lectura y de parseo, y luego se mide la búsqueda sobre el arreglo cargado.
El proyecto no cuenta con archivos indexados propiamente dichos (con una estructura de índice aparte). Por eso, el arreglo ordenado cumple el papel de índice, ya que la búsqueda binaria depende de ese orden. Es una adaptación del mecanismo de archivos del proyecto.
`;
const dir = path.join(__dirname, '..', 'resultados', 'busqueda');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'datos_busqueda.json'), JSON.stringify(manifiesto, null, 1));
fs.writeFileSync(path.join(dir, 'metodologia_busqueda.md'), md);
console.log('Guardado: scripts/resultados/busqueda/datos_busqueda.json y scripts/resultados/busqueda/metodologia_busqueda.md');
