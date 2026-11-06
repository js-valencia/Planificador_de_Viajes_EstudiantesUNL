// Benchmark de rendimiento: ejecutar desde la raíz del proyecto -> node benchmark.js
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const root = process.cwd();
const S = (p) => require(path.join(root, 'src/main', p));
const { generarFrecuencias, ventanaDeFechas } = S('domain/datos/GenerarFrecuencias');
const GrafoHorarios = S('domain/graph/GrafoHorarios');
const ordenTopologico = S('domain/graph/ordenTopologico');
const { floydWarshall } = S('domain/graph/floydWarshall');
const Planificador = S('domain/planning/Planificador');
const rutasJson = S('data/rutas.json');

const REP = 15;
const stats = (a) => {
  const m = a.reduce((x, y) => x + y, 0) / a.length;
  const sd = Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / a.length);
  const s = [...a].sort((x, y) => x - y);
  return { media: m, sd, mediana: s[Math.floor(s.length / 2)], min: s[0], max: s[s.length - 1] };
};
const time = (fn, rep = REP) => { const t = []; let r; for (let i = 0; i < rep; i++) { const a = performance.now(); r = fn(); t.push(performance.now() - a); } return { ...stats(t), r }; };
const dia = (i) => new Date(Date.parse('2026-11-02T12:00:00Z') + i * 864e5).toISOString().slice(0, 10);

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