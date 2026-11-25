// Benchmark de rendimiento: ejecutar desde la raíz con npm run benchmark:sort
'use strict';
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { performance } = require('node:perf_hooks');
const root = path.join(__dirname, '..', '..');
const S = (p) => require(path.join(root, 'src/main', p));
const { generarFrecuencias, ventanaDeFechas } = S('domain/datos/GenerarFrecuencias');
const GrafoHorarios = S('domain/graph/GrafoHorarios');
const ordenTopologico = S('domain/graph/ordenTopologico');
const { floydWarshall } = S('domain/graph/floydWarshall');
const Planificador = S('domain/planning/Planificador');
const { mergeSort } = S('domain/sort/MergeSort');
const { quickSort } = S('domain/sort/QuickSort');
const { compararRutas } = S('domain/sort/comparadorRutas');
const rutasJson = S('data/rutas.json');

const REP = 15;

// ---- Estadística SIN Array.prototype.sort -------------------------------------------------------
// La restricción de la práctica prohíbe usar .sort() de JavaScript para ordenar. Para no depender de cómo
// se interprete (¿solo los datos de rutas o también los cálculos auxiliares?), las muestras de tiempo se
// ordenan con inserción: es independiente de MergeSort/QuickSort (lo que se mide) y para ~15 muestras
// su costo es despreciable.
function ordenarMuestras(a) {
  const r = a.slice();
  for (let i = 1; i < r.length; i++) {
    const v = r[i];
    let j = i - 1;
    while (j >= 0 && r[j] > v) { r[j + 1] = r[j]; j--; }
    r[j + 1] = v;
  }
  return r;
}
// Mediana correcta también para tamaños pares (promedio de los dos valores centrales).
const medianaDe = (ordenado) => {
  const m = ordenado.length >> 1;
  return ordenado.length % 2 ? ordenado[m] : (ordenado[m - 1] + ordenado[m]) / 2;
};
const stats = (a) => {
  const m = a.reduce((x, y) => x + y, 0) / a.length;
  const sd = Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / a.length);
  const s = ordenarMuestras(a);
  return { media: m, sd, mediana: medianaDe(s), min: s[0], max: s[s.length - 1] };
};
const time = (fn, rep = REP) => { const t = []; let r; for (let i = 0; i < rep; i++) { const a = performance.now(); r = fn(); t.push(performance.now() - a); } return { ...stats(t), r }; };
const dia = (i) => new Date(Date.parse('2026-11-02T12:00:00Z') + i * 864e5).toISOString().slice(0, 10);

// =================================================================================================
// Modo 1 (por defecto): rendimiento del grafo y la lista doble
// =================================================================================================
function benchmarkGeneral() {
  const out = { node: process.version, plataforma: `${process.platform} ${process.arch}`, repeticiones: REP };

  // ---- Escenario real: ventana de 2 días (como crearPlanificador) ----
  const desde = '2026-11-02T10:30:00-05:00';
  const fechas = ventanaDeFechas(Date.parse(desde));
  const g1 = time(() => generarFrecuencias(rutasJson.rutas, fechas));
  const frecuencias = g1.r.frecuencias;
  const g2 = time(() => new GrafoHorarios(rutasJson.minutosMinimosTransbordo).cargar(frecuencias));
  const grafo = g2.r;
  const g3 = time(() => ordenTopologico(grafo));
  const V = grafo.nodos.length, E = grafo.aristas.length;
  const eViaje = grafo.aristas.filter(a => a.tipo === 'viaje').length;
  const fw = {};
  for (const c of ['tiempo', 'espera', 'conexiones']) {
    fw[c] = time(() => { const p = new Planificador(grafo); return p.matriz(c); }, 5);
  }
  const plan = new Planificador(grafo); plan.matriz('tiempo');
  const q = time(() => plan.buscarRuta({ origen: 'Loja', destino: 'Cariamanga', desde, criterio: 'tiempo' }), 200);
  const q2 = time(() => plan.buscarRuta({ origen: 'Loja', destino: 'Macará', desde, criterio: 'tiempo' }), 200);
  const tot = time(() => { const p = new Planificador(new GrafoHorarios(20).cargar(generarFrecuencias(rutasJson.rutas, fechas).frecuencias)); return p.buscarRuta({ origen: 'Loja', destino: 'Cariamanga', desde, criterio: 'tiempo' }); }, 5);
  out.real = { fechas, rutas: rutasJson.rutas.length, frecuencias: frecuencias.length, V, E, aristasViaje: eViaje, aristasEspera: E - eViaje,
    generarFrecuencias: g1, construirGrafo: g2, ordenTopologico: g3, floydWarshall: Object.fromEntries(Object.entries(fw).map(([k, v]) => [k, { ...v, r: undefined }])),
    buscarRuta_LojaCariamanga: q, buscarRuta_LojaMacara: q2, totalPrimeraConsulta: tot };
  for (const k of ['generarFrecuencias','construirGrafo','ordenTopologico','buscarRuta_LojaCariamanga','buscarRuta_LojaMacara','totalPrimeraConsulta']) delete out.real[k].r;

  // ---- Escalabilidad: 1..N días de ventana ----
  out.escala = [];
  for (const dias of [1, 2, 3, 4, 5, 6]) {
    const f = Array.from({ length: dias }, (_, i) => dia(i));
    const fr = generarFrecuencias(rutasJson.rutas, f).frecuencias;
    let gr; const tg = time(() => { gr = new GrafoHorarios(20).cargar(fr); }, 5);
    const tt = time(() => ordenTopologico(gr), 10);
    const tf = time(() => floydWarshall(gr.nodos.length, gr.aristas), 3);
    out.escala.push({ dias, frecuencias: fr.length, V: gr.nodos.length, E: gr.aristas.length, construir: tg.mediana, topologico: tt.mediana, floyd: tf.mediana, floydMin: tf.min });
  }
  // Lista doble: operaciones
  const { ListaDobleEnlazada } = S('domain/datos/ListaDobleEnlazada');
  out.lista = [];
  for (const n of [1000, 10000, 100000]) {
    const L = new ListaDobleEnlazada();
    const ta = time(() => { const l = new ListaDobleEnlazada(); for (let i = 0; i < n; i++) l.agregarAlFinal(i); return l; }, 5);
    for (let i = 0; i < n; i++) L.agregarAlFinal(i);
    const tb = time(() => L.buscar(n - 1), 20);
    const tr = time(() => L.recorrerAdelante(), 10);
    out.lista.push({ n, agregarN: ta.mediana, buscarUltimo: tb.mediana, recorrer: tr.mediana });
  }
  console.log(JSON.stringify(out, null, 1));
}

// =================================================================================================
// Modo 2 (--ordenamiento): MergeSort vs QuickSort sobre las rutas del proyecto
// =================================================================================================
const SEMILLA = 20261114;      // fija: mismo desorden de entrada en cada ejecución
const REPETICIONES = 15;       // mediciones válidas por algoritmo y tamaño
const CALENTAMIENTO = 3;       // corridas descartadas (JIT) antes de medir
const TAMANIOS = [11, 100, 1000, 10000, 100000]; // 11 = dataset real; el resto se deriva de él
const N_CASOS = 10000;         // tamaño para la tabla de casos (aleatorio / ordenado / inverso)
const ALGORITMOS = [['MergeSort', mergeSort], ['QuickSort', quickSort]];

// Generador pseudoaleatorio determinista (mulberry32): Math.random() haría irreproducible el benchmark.
function crearAleatorio(semilla) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Fisher-Yates (no usa .sort).
function mezclarDeterminista(arr, aleatorio) {
  const r = arr.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}
// n registros a partir de las rutas reales: se repiten con id único (LOJA-01-000001, ...) para que el
// orden por cooperativa -> nombre -> id sea total y ambos algoritmos deban dar exactamente el mismo resultado.
function construirDataset(base, n) {
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    const b = base[i % base.length];
    const k = Math.floor(i / base.length);
    out[i] = k === 0 ? b : { ...b, id: `${b.id}-${String(k).padStart(6, '0')}` };
  }
  return out;
}
const huella = (arr) => crypto.createHash('sha1').update(arr.map((r) => r.id).join('|')).digest('hex').slice(0, 12);
const estaOrdenado = (arr) => { for (let i = 1; i < arr.length; i++) if (compararRutas(arr[i - 1], arr[i]) > 0) return false; return true; };
const mismosIds = (a, b) => a.length === b.length && a.every((r, i) => r.id === b[i].id);
const gc = typeof global.gc === 'function' ? global.gc : null;
const kb = (bytes) => bytes / 1024;
const f = (x, d = 3) => x.toFixed(d);

// Una "medición" = un sort completo. Antes de cada una se fuerza el GC (fuera del cronómetro) para que
// heapUsed parta de una base limpia; heapUsed se lee con el resultado todavía referenciado.
function medir(algoritmo, entrada) {
  for (let i = 0; i < CALENTAMIENTO; i++) algoritmo(entrada, compararRutas);
  const tiempos = [], antes = [], despues = [], deltas = [];
  let salida;
  for (let i = 0; i < REPETICIONES; i++) {
    salida = null;
    if (gc) gc();
    const h0 = process.memoryUsage().heapUsed;
    const t0 = performance.now();
    const r = algoritmo(entrada, compararRutas);
    const t1 = performance.now();
    const h1 = process.memoryUsage().heapUsed;
    tiempos.push(t1 - t0); antes.push(h0); despues.push(h1); deltas.push(h1 - h0);
    salida = r;
  }
  return {
    tiempoMs: stats(tiempos),
    heapAntesKB: kb(stats(antes).mediana),
    heapDespuesKB: kb(stats(despues).mediana),
    deltaHeapKB: kb(stats(deltas).mediana),
    salida,
  };
}

function correr(etiqueta, entrada) {
  const filas = [];
  const resultados = {};
  for (const [nombre, fn] of ALGORITMOS) {
    const m = medir(fn, entrada);
    if (!estaOrdenado(m.salida)) throw new Error(`${nombre} produjo un resultado NO ordenado (${etiqueta})`);
    resultados[nombre] = m.salida;
    const { salida, ...metricas } = m;
    filas.push({ algoritmo: nombre, ...metricas });
  }
  if (!mismosIds(resultados.MergeSort, resultados.QuickSort)) throw new Error(`MergeSort y QuickSort difieren (${etiqueta})`);
  return { filas, ordenado: resultados.MergeSort };
}

function tablaMd(titulo, cabecera, filas) {
  const linea = (c) => `| ${c.join(' | ')} |`;
  return [`### ${titulo}`, '', linea(cabecera), linea(cabecera.map(() => '---')), ...filas.map(linea), ''].join('\n');
}

function benchmarkOrdenamiento() {
  const base = rutasJson.rutas;
  const aleatorio = crearAleatorio(SEMILLA);
  const salida = [];
  const log = (s = '') => { console.log(s); salida.push(s); };

  log('# Benchmark de ordenamiento: MergeSort vs QuickSort');
  log('');
  log(`- Dataset: src/main/data/rutas.json (${base.length} rutas reales); criterio: cooperativa -> nombre -> id`);
  log(`- Node ${process.version} | ${process.platform} ${process.arch} | semilla ${SEMILLA}`);
  log(`- ${REPETICIONES} mediciones por celda (+${CALENTAMIENTO} de calentamiento descartadas); estadística sin Array.prototype.sort`);
  log(`- Memoria: process.memoryUsage().heapUsed en KB, ${gc ? 'con global.gc() antes de cada medición' : 'SIN --expose-gc (valores más ruidosos; usar npm run benchmark:sort)'}`);
  log('- Δ heap = heapUsed después − antes (incluye el arreglo resultado y los temporales aún no recolectados)');
  log('');

  // ---- 1) Muestra antes / después sobre el dataset real (22 rutas) ----
  const real = mezclarDeterminista(base, aleatorio);
  const rReal = correr('real', real);
  const filasMuestra = real.map((r, i) => [String(i + 1), r.id, rReal.ordenado[i].id, `${rReal.ordenado[i].cooperativa} · ${rReal.ordenado[i].nombre}`]);
  log(tablaMd(`Muestra antes y después (dataset real, ${real.length} rutas; huella de entrada ${huella(real)})`,
    ['Pos.', 'Antes (id)', 'Después (id)', 'Ruta ordenada'], filasMuestra));
  log('MergeSort y QuickSort devuelven la misma secuencia de ids (verificado), y el resultado cumple el comparador.');
  log('');

  // ---- 2) Escalamiento: mismo procedimiento con 11 .. 100 000 registros ----
  const resumen = [];
  const filasEscala = [];
  for (const n of TAMANIOS) {
    const entrada = n === base.length ? real : mezclarDeterminista(construirDataset(base, n), aleatorio);
    const r = n === base.length ? rReal : correr(`n=${n}`, entrada);
    for (const x of r.filas) {
      filasEscala.push([String(n), x.algoritmo, f(x.tiempoMs.mediana), f(x.tiempoMs.media), f(x.tiempoMs.sd), f(x.tiempoMs.min), f(x.tiempoMs.max),
        f(x.heapAntesKB, 1), f(x.heapDespuesKB, 1), f(x.deltaHeapKB, 1)]);
      resumen.push({ n, caso: 'aleatorio', huellaEntrada: huella(entrada), ...x });
    }
  }
  log(tablaMd('Tabla comparativa (entrada aleatoria)',
    ['n', 'Algoritmo', 'Mediana (ms)', 'Media (ms)', 'Desv. (ms)', 'Mín (ms)', 'Máx (ms)', 'heapUsed antes (KB)', 'heapUsed después (KB)', 'Δ heap (KB)'], filasEscala));

  // ---- 3) Casos de entrada con n fijo ----
  const baseN = construirDataset(base, N_CASOS);
  const aleatoria = mezclarDeterminista(baseN, aleatorio);
  const ordenada = mergeSort(baseN, compararRutas);
  const inversa = ordenada.slice().reverse();
  const filasCasos = [];
  for (const [caso, entrada] of [['aleatorio', aleatoria], ['ya ordenado', ordenada], ['inverso', inversa]]) {
    const r = correr(`${caso} n=${N_CASOS}`, entrada);
    for (const x of r.filas) {
      filasCasos.push([caso, x.algoritmo, f(x.tiempoMs.mediana), f(x.tiempoMs.sd), f(x.deltaHeapKB, 1)]);
      resumen.push({ n: N_CASOS, caso, huellaEntrada: huella(entrada), ...x });
    }
  }
  log(tablaMd(`Casos de entrada (n = ${N_CASOS})`, ['Caso', 'Algoritmo', 'Mediana (ms)', 'Desv. (ms)', 'Δ heap (KB)'], filasCasos));

  // ---- Persistencia ----
  const dir = path.join(__dirname, '..', 'resultados', 'ordenamiento');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'benchmark_ordenamiento.md'), salida.join('\n') + '\n');
  fs.writeFileSync(path.join(dir, 'benchmark_ordenamiento.json'), JSON.stringify({
    node: process.version, plataforma: `${process.platform} ${process.arch}`, semilla: SEMILLA, repeticiones: REPETICIONES,
    calentamiento: CALENTAMIENTO, gcForzado: Boolean(gc), resultados: resumen,
  }, null, 1));
  console.log('Resultados guardados en scripts/resultados/ordenamiento/benchmark_ordenamiento.md y .json');
}

if (process.argv.includes('--ordenamiento')) benchmarkOrdenamiento();
else benchmarkGeneral();
