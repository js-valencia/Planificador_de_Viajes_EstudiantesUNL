// Mide la latencia de buscarRuta ANTES (planificador reutilizado, sin caché de resultados:
// el comportamiento previo del servidor) y DESPUÉS (caché de resultados con TTL).
// Cada escenario corre en un proceso Node aparte para que ninguno herede el JIT del otro.
// Ejecutar: node scripts/cache/benchmark_cache.js [--solicitudes 2000] [--repeticiones 5]
// Resultados: scripts/resultados/cache/benchmark_cache.{json,md}
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const SRC = path.join(__dirname, '..', '..', 'src', 'main');
const arg = (nombre, defecto) => {
  const i = process.argv.indexOf(`--${nombre}`);
  return i >= 0 ? process.argv[i + 1] : defecto;
};

// Generador pseudoaleatorio determinista (mulberry32) para que ambos escenarios vean la misma carga.
function prng(semilla) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function cargaDeTrabajo(n) {
  const rnd = prng(20261125);
  const terminales = JSON.parse(fs.readFileSync(path.join(SRC, 'data', 'terminales.json'), 'utf8')).terminales.map((t) => t.nombre);
  const horas = ['06:00', '07:30', '08:00', '09:30', '12:00', '15:00', '17:30', '20:00'];
  const criterios = ['tiempo', 'espera', 'conexiones'];
  const distintas = [];
  while (distintas.length < 40) {
    const origen = rnd() < 0.7 ? 'Loja' : terminales[Math.floor(rnd() * terminales.length)];
    const destino = terminales[Math.floor(rnd() * terminales.length)];
    if (origen === destino) continue;
    distintas.push({
      origen, destino,
      criterio: criterios[Math.floor(rnd() * 3)],
      desde: `2026-11-25T${horas[Math.floor(rnd() * horas.length)]}:00-05:00`,
    });
  }
  // 80 % de las solicitudes caen en las 10 consultas más populares, el resto en las 30 restantes.
  return Array.from({ length: n }, () => (rnd() < 0.8 ? distintas[Math.floor(rnd() * 10)] : distintas[10 + Math.floor(rnd() * 30)]));
}

function percentil(ordenados, p) {
  return ordenados[Math.min(ordenados.length - 1, Math.ceil(p * ordenados.length) - 1)];
}

function resumen(tiempos) {
  const o = [...tiempos].sort((a, b) => a - b);
  const suma = o.reduce((x, y) => x + y, 0);
  return { n: o.length, mediaMs: suma / o.length, p50Ms: percentil(o, 0.5), p95Ms: percentil(o, 0.95), maxMs: o[o.length - 1], totalMs: suma };
}

function ejecutarEscenario(nombre, n) {
  const { crearPlanificador } = require('../../src/main/services/planificadorService');
  const { crearServicioConsultas } = require('../../src/main/services/consultasService');
  const { ventanaDeFechas } = require('../../src/main/domain/datos/GenerarFrecuencias');
  const carga = cargaDeTrabajo(n);

  let buscar;
  let servicio = null;
  if (nombre === 'antes') {
    // Réplica del comportamiento previo de servidor.js: planificador por ventana, sin caché de resultados.
    const planificadores = new Map();
    buscar = (c) => {
      const clave = ventanaDeFechas(Date.parse(c.desde)).join('|');
      let p = planificadores.get(clave);
      if (!p) { p = crearPlanificador(SRC, c.desde); planificadores.set(clave, p); }
      return p.buscarRuta(c);
    };
  } else {
    servicio = crearServicioConsultas({ baseDir: SRC });
    buscar = (c) => servicio.buscarRuta(c).ruta;
  }

  const tiempos = [];
  for (const c of carga) {
    const t0 = process.hrtime.bigint();
    buscar(c);
    tiempos.push(Number(process.hrtime.bigint() - t0) / 1e6);
  }
  const salida = { escenario: nombre, global: resumen(tiempos), primeraConsultaMs: tiempos[0] };
  if (servicio) salida.cache = servicio.estadisticas().resultados;
  return salida;
}

if (arg('escenario')) {
  process.stdout.write(JSON.stringify(ejecutarEscenario(arg('escenario'), Number(arg('solicitudes', 2000)))));
  return;
}

const n = Number(arg('solicitudes', 2000));
const repeticiones = Number(arg('repeticiones', 5));
const corridas = { antes: [], despues: [] };
for (let i = 0; i < repeticiones; i++) {
  for (const esc of ['antes', 'despues']) {
    const r = spawnSync(process.execPath, [__filename, '--escenario', esc, '--solicitudes', String(n)], { encoding: 'utf8' });
    if (r.status !== 0) { console.error(r.stderr); process.exit(1); }
    corridas[esc].push(JSON.parse(r.stdout));
  }
}
const mediana = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const agregar = (lista) => ({
  mediaMs: mediana(lista.map((r) => r.global.mediaMs)),
  p50Ms: mediana(lista.map((r) => r.global.p50Ms)),
  p95Ms: mediana(lista.map((r) => r.global.p95Ms)),
  maxMs: mediana(lista.map((r) => r.global.maxMs)),
  totalMs: mediana(lista.map((r) => r.global.totalMs)),
  primeraConsultaMs: mediana(lista.map((r) => r.primeraConsultaMs)),
});
const antes = agregar(corridas.antes);
const despues = agregar(corridas.despues);
const cache = corridas.despues[0].cache;
const informe = { fecha: new Date().toISOString(), node: process.version, solicitudes: n, consultasDistintas: 40, repeticiones, antes, despues, cacheDespues: cache };
const dir = path.join(__dirname, '..', 'resultados', 'cache');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'benchmark_cache.json'), JSON.stringify(informe, null, 2));

const f = (x) => x.toFixed(3);
const md = `# Benchmark del caché de consultas

- Fecha: ${informe.fecha} · Node ${informe.node}
- Carga: ${n} solicitudes sintéticas sobre 40 consultas distintas (80 % en las 10 más populares), misma semilla en ambos escenarios.
- ${repeticiones} corridas por escenario, cada una en un proceso nuevo; se reporta la **mediana** de las corridas.
- Mide el servicio (\`buscarRuta\`), sin red ni Express.

| Métrica | Antes (sin caché de resultados) | Después (con caché, TTL 5 min) |
|---|---:|---:|
| Media por consulta (ms) | ${f(antes.mediaMs)} | ${f(despues.mediaMs)} |
| p50 (ms) | ${f(antes.p50Ms)} | ${f(despues.p50Ms)} |
| p95 (ms) | ${f(antes.p95Ms)} | ${f(despues.p95Ms)} |
| Máximo (ms) | ${f(antes.maxMs)} | ${f(despues.maxMs)} |
| Tiempo total de la carga (ms) | ${f(antes.totalMs)} | ${f(despues.totalMs)} |
| Primera consulta (arranque en frío, ms) | ${f(antes.primeraConsultaMs)} | ${f(despues.primeraConsultaMs)} |

Caché de resultados tras la carga: ${cache.aciertos} aciertos, ${cache.fallos} fallos (tasa de aciertos ${(cache.tasaAciertos * 100).toFixed(1)} %), ${cache.vencimientos} vencimientos, ${cache.expulsiones} expulsiones.

## Cómo leerlo

- "Antes" ya reutilizaba el grafo y las matrices Floyd-Warshall por ventana de fechas; lo que se añade es evitar el recorrido de salidas × llegadas y el armado del itinerario en consultas repetidas. Por eso el beneficio en la media es moderado y los máximos (primera consulta de cada criterio, que calcula la matriz) no cambian: el caché de resultados no acelera los fallos.
- La tasa de aciertos depende de la carga real. Con la carga sintética de arriba es alta porque se repiten pocas consultas; en producción habrá que verificarla con \`GET /api/cache/stats\`.
`;
fs.writeFileSync(path.join(dir, 'benchmark_cache.md'), md);
console.log(md);
