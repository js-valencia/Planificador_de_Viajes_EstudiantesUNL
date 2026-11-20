// Corrección del Benchmark #18: búsqueda secuencial vs binaria sobre archivos indexados.
// Mide POR SEPARADO: (A) tiempo de acceso al archivo y (B) comparaciones/tiempo de búsqueda.
// Metodología: scripts/results/metodologia_busqueda.md (issue #15).
// Ejecutar desde la raíz del proyecto: node scripts/benchmark_busqueda.js
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const { busquedaSecuencial } = require('../src/main/domain/search/BusquedaSecuencial');
const { busquedaBinaria } = require('../src/main/domain/search/BusquedaBinaria');
const { medirBusqueda } = require('../src/main/domain/search/medicion');
const { compararRutas } = require('../src/main/domain/sort/comparadorRutas');
const { CONFIG_BUSQUEDA, construirDatasetOrdenado, generarClaves } = require('../src/main/domain/datos/DatasetBusqueda');

// ---- Parámetros: una sola fuente de verdad (DatasetBusqueda.js, ver metodología) ----
const {
  semilla: SEMILLA,
  tamanios: TAMANOS,
  repeticionesInternas: REPS, // REPS[algoritmo][n]
  medicionesPorClave: MEDICIONES,
  calentamiento: CALENTAMIENTO,
} = CONFIG_BUSQUEDA;
const ALGORITMOS = [
  ['secuencial', busquedaSecuencial],
  ['binaria', busquedaBinaria],
];

// ---- Utilidades ----
// Ordenamiento por inserción (la metodología prohíbe .sort())
function ordenarInsercion(muestras) {
  const a = muestras.slice();
  for (let i = 1; i < a.length; i++) {
    const v = a[i];
    let j = i - 1;
    while (j >= 0 && a[j] > v) { a[j + 1] = a[j]; j--; }
    a[j + 1] = v;
  }
  return a;
}

function estadisticas(muestras) {
  const n = muestras.length;
  const o = ordenarInsercion(muestras);
  const media = muestras.reduce((s, x) => s + x, 0) / n;
  const varianza = muestras.reduce((s, x) => s + (x - media) ** 2, 0) / (n > 1 ? n - 1 : 1);
  const mediana = n % 2 ? o[(n - 1) / 2] : (o[n / 2 - 1] + o[n / 2]) / 2;
  return { media, mediana, desviacion: Math.sqrt(varianza), min: o[0], max: o[n - 1] };
}

const promedio = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;

// ---- Claves de búsqueda (generadas por DatasetBusqueda.generarClaves) ----
// Aplana { exitosas, fallidas } al formato del benchmark y asigna la categoría de la metodología.
function construirClaves(arreglo) {
  const { exitosas, fallidas } = generarClaves(arreglo);
  const categoriaExitosa = (etiqueta) => (etiqueta.startsWith('aleatoria') ? 'exitosa-aleatorias' : `exitosa-${etiqueta}`);
  return [
    ...exitosas.map((c) => ({ categoria: categoriaExitosa(c.etiqueta), etiqueta: c.etiqueta, clave: c.clave, esperado: c.indiceEsperado })),
    ...fallidas.map((c) => ({ categoria: 'fallida', etiqueta: c.etiqueta, clave: c.clave, esperado: -1 })),
  ];
}

// Comprobación previa: ambos algoritmos deben coincidir con lo esperado
function verificar(arreglo, claves) {
  for (const c of claves) {
    for (const [nombre, fn] of ALGORITMOS) {
      const r = fn(arreglo, c.clave, compararRutas);
      const ok = c.esperado === -1 ? !r.encontrado : r.encontrado && r.indice === c.esperado;
      if (!ok) throw new Error(`Verificación fallida: ${nombre}, clave "${c.etiqueta}", n=${arreglo.length}`);
    }
  }
}

// ---- (A) Tiempo de acceso al archivo  ----
function medirAccesoArchivo(arreglo) {
  const ruta = path.join(os.tmpdir(), `indice_busqueda_${arreglo.length}_${process.pid}.json`);
  fs.writeFileSync(ruta, JSON.stringify(arreglo));
  try {
    const bytes = fs.statSync(ruta).size;
    const lectura = [];
    const parseo = [];
    for (let i = 0; i < CALENTAMIENTO + MEDICIONES; i++) {
      const t0 = performance.now();
      const texto = fs.readFileSync(ruta, 'utf8');
      const t1 = performance.now();
      JSON.parse(texto);
      const t2 = performance.now();
      if (i >= CALENTAMIENTO) { lectura.push(t1 - t0); parseo.push(t2 - t1); }
    }
    const l = estadisticas(lectura);
    const p = estadisticas(parseo);
    return { bytes, lecturaMs: l, parseoMs: p, totalMedioMs: l.media + p.media };
  } finally {
    fs.unlinkSync(ruta);
  }
}

// ---- (B) Búsqueda: comparaciones y tiempo ----
function medirClave(fn, arreglo, clave, reps) {
  for (let i = 0; i < CALENTAMIENTO; i++) medirBusqueda(fn, arreglo, clave, compararRutas, reps);
  const tiempos = [];
  let ultima;
  for (let i = 0; i < MEDICIONES; i++) {
    ultima = medirBusqueda(fn, arreglo, clave, compararRutas, reps);
    tiempos.push(ultima.tiempoPromedioMs);
  }
  return { comparaciones: ultima.comparaciones, tiempoMs: estadisticas(tiempos) };
}

function agregarPorCategoria(detalle) {
  const grupos = {};
  const categoriaFinal = (c) => c;
  for (const d of detalle) (grupos[categoriaFinal(d.categoria)] ||= []).push(d);
  const salida = {};

  for (const [cat, items] of Object.entries(grupos)) {
    salida[cat] = {
      claves: items.length,
      tiempoMedioMs: promedio(items.map((x) => x.tiempoMs.media)),
      desviacionMediaMs: promedio(items.map((x) => x.tiempoMs.desviacion)),
      comparacionesMedias: promedio(items.map((x) => x.comparaciones)),
    };
  }
  return salida;
}

// ---- Ejecución ----
function main() {
  const resultados = {
    meta: { node: process.version, plataforma: `${process.platform} ${process.arch}`, semilla: SEMILLA, mediciones: MEDICIONES, calentamiento: CALENTAMIENTO, fecha: new Date().toISOString() },
    tamanos: [],
  };

  for (const n of TAMANOS) {
    console.log(`\n== n = ${n} ==`);
    const arreglo = construirDatasetOrdenado(n);
    const claves = construirClaves(arreglo);
    verificar(arreglo, claves);
    console.log('  verificación previa OK');

    console.log('  (A) acceso al archivo...');
    const archivo = medirAccesoArchivo(arreglo);

    const busqueda = {};
    for (const [nombre, fn] of ALGORITMOS) {
      console.log(`  (B) búsqueda ${nombre}...`);
      const reps = REPS[nombre][n];
      const detalle = claves.map((c) => ({ categoria: c.categoria, etiqueta: c.etiqueta, ...medirClave(fn, arreglo, c.clave, reps) }));
      busqueda[nombre] = { repeticionesPorMedicion: reps, porCategoria: agregarPorCategoria(detalle) };
    }
    resultados.tamanos.push({ n, archivo, busqueda });
  }

  const dir = path.join(__dirname, 'results');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'benchmark_busqueda.json'), JSON.stringify(resultados, null, 2));
  fs.writeFileSync(path.join(dir, 'benchmark_busqueda.md'), generarMarkdown(resultados));
  console.log('\nListo: scripts/results/benchmark_busqueda.json y benchmark_busqueda.md');
}

// ---- Reporte Markdown ----
function generarMarkdown(r) {
  const f = (x, d = 6) => x.toFixed(d);
  const L = [];
  L.push('# Benchmark búsqueda en archivos indexados (issue #18)', '');
  L.push(`- Node ${r.meta.node} | ${r.meta.plataforma} | semilla ${r.meta.semilla}`);
  L.push(`- ${r.meta.mediciones} mediciones válidas por clave, ${r.meta.calentamiento} de calentamiento descartadas`);
  L.push('- Acceso al archivo y búsqueda se miden por separado.', '');

  L.push('## A. Tiempo de acceso al archivo', '');
  L.push('| n | Tamaño (KB) | Lectura media (ms) | Parseo JSON medio (ms) | Total medio (ms) |', '| --- | --- | --- | --- | --- |');
  for (const t of r.tamanos) {
    const a = t.archivo;
    L.push(`| ${t.n} | ${(a.bytes / 1024).toFixed(1)} | ${f(a.lecturaMs.media, 3)} | ${f(a.parseoMs.media, 3)} | ${f(a.totalMedioMs, 3)} |`);
  }

  L.push('', '## B. Búsqueda: comparaciones y tiempo', '');
  for (const t of r.tamanos) {
    L.push(`### n = ${t.n}`, '');
    L.push('| Categoría | Sec. comparaciones | Bin. comparaciones | Sec. tiempo (ms) | Bin. tiempo (ms) | Razón tiempo sec/bin |', '| --- | --- | --- | --- | --- | --- |');
    for (const cat of Object.keys(t.busqueda.secuencial.porCategoria)) {
      const s = t.busqueda.secuencial.porCategoria[cat];
      const b = t.busqueda.binaria.porCategoria[cat];
      L.push(`| ${cat} | ${s.comparacionesMedias.toFixed(1)} | ${b.comparacionesMedias.toFixed(1)} | ${f(s.tiempoMedioMs)} | ${f(b.tiempoMedioMs)} | ${(s.tiempoMedioMs / b.tiempoMedioMs).toFixed(1)}x |`);
    }
    L.push('');
  }
  return L.join('\n') + '\n';
}

main();