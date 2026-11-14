// Issue #11 - Pruebas del comparador multicriterio y de QuickSort / MergeSort.
// Ejecutar: node tests/sort.test.js   (o npm test)
// Mismo estilo que los demás tests del proyecto: node:assert, sin dependencias nuevas.
// No usa Array.prototype.sort(): el orden esperado se escribe a mano o se verifica con el comparador.
const assert = require('node:assert/strict');
const path = require('node:path');
const { compararRutas, crearComparador } = require('../src/main/domain/sort/comparadorRutas');
const { rutas } = require('../src/main/data/rutas.json');

const dirSort = path.join(__dirname, '..', 'src', 'main', 'domain', 'sort');

// Carga un algoritmo de los compañeros. Si su módulo aún no exporta la función (Issues #9 / #10 pendientes),
// devuelve null y las pruebas de ese algoritmo se marcan como PENDIENTE en lugar de fallar.
function cargarAlgoritmo(archivo, nombreFuncion) {
  try {
    const modulo = require(path.join(dirSort, archivo));
    const fn = typeof modulo === 'function' ? modulo : modulo[nombreFuncion];
    return typeof fn === 'function' ? fn : null;
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') return null;
    throw error;
  }
}

const algoritmos = [
  { nombre: 'QuickSort', fn: cargarAlgoritmo('QuickSort.js', 'quickSort') },
  { nombre: 'MergeSort', fn: cargarAlgoritmo('MergeSort.js', 'mergeSort') },
];

let correctas = 0;
let pendientes = 0;
const fallos = [];

function prueba(nombre, cuerpo) {
  try {
    cuerpo();
    correctas++;
    console.log(`  ✓ ${nombre}`);
  } catch (error) {
    fallos.push(`${nombre}: ${error.message}`);
    console.log(`  ✗ ${nombre}\n      ${error.message.split('\n')[0]}`);
  }
}

// ---------- Datos de prueba ----------
const reg = (id, cooperativa, nombre) => ({ id, cooperativa, nombre });

// Siempre devuelve objetos nuevos (cada prueba trabaja con su propia copia).
const crearRegistros = () => [
  reg('CAT-02', 'Catamayo', 'Catamayo - Loja'),
  reg('LOJA-10', 'Loja', 'Loja - Alamor'),
  reg('LOJA-03', 'Loja', 'Loja - Macará x Catacocha'),
  reg('CAT-01', 'Catamayo', 'Catamayo - Loja'), // mismo nombre y cooperativa que CAT-02: decide el id
  reg('LOJA-02', 'Loja', 'Loja - Alamor'),      // mismo nombre y cooperativa que LOJA-10: decide el id
  reg('CAT-05', 'Catamayo', 'Catamayo - Amaluza'),
  reg('LOJA-01', 'Loja', 'Loja - Zapotillo'),
];

// Orden esperado: cooperativa -> nombre -> id
const idsEsperados = ['CAT-05', 'CAT-01', 'CAT-02', 'LOJA-02', 'LOJA-10', 'LOJA-03', 'LOJA-01'];

const ids = (arreglo) => arreglo.map((r) => r.id);
const clave = (r) => `${r.cooperativa}|${r.nombre}|${r.id}`;

function estaOrdenado(arreglo, comparador) {
  for (let i = 1; i < arreglo.length; i++) {
    if (comparador(arreglo[i - 1], arreglo[i]) > 0) return false;
  }
  return true;
}

function mismosRegistros(a, b) {
  const cuenta = new Map();
  for (const r of a) cuenta.set(clave(r), (cuenta.get(clave(r)) || 0) + 1);
  for (const r of b) cuenta.set(clave(r), (cuenta.get(clave(r)) || 0) - 1);
  return a.length === b.length && [...cuenta.values()].every((v) => v === 0);
}

// Generador pseudoaleatorio con semilla fija: los datos son siempre los mismos (pruebas reproducibles).
function mulberry32(semilla) {
  let s = semilla >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pocos valores posibles -> muchos duplicados exactos (mismo id, cooperativa y nombre).
function crearRegistrosAleatorios(cantidad, semilla) {
  const azar = mulberry32(semilla);
  const coops = ['Loja', 'Catamayo'];
  const nombres = ['Alamor', 'Amaluza', 'Cariamanga', 'Catacocha', 'Macará', 'Zapotillo'];
  return Array.from({ length: cantidad }, () => {
    const cooperativa = coops[Math.floor(azar() * coops.length)];
    const nombre = `${cooperativa} - ${nombres[Math.floor(azar() * nombres.length)]}`;
    return reg(`R-${Math.floor(azar() * 12)}`, cooperativa, nombre);
  });
}

// ---------- 1. Comparador (siempre se ejecuta) ----------
console.log('Comparador compararRutas');

prueba('devuelve negativo, positivo o cero', () => {
  assert.ok(compararRutas(reg('1', 'Catamayo', 'X'), reg('1', 'Loja', 'X')) < 0);
  assert.ok(compararRutas(reg('1', 'Loja', 'X'), reg('1', 'Catamayo', 'X')) > 0);
  assert.equal(compararRutas(reg('1', 'Loja', 'X'), reg('1', 'Loja', 'X')), 0);
});

prueba('prioridad 1: la cooperativa manda sobre nombre e id', () => {
  const a = reg('LOJA-99', 'Catamayo', 'Zzz');
  const b = reg('LOJA-01', 'Loja', 'Aaa');
  assert.ok(compararRutas(a, b) < 0);
});

prueba('prioridad 2: con igual cooperativa, el nombre manda sobre el id', () => {
  const a = reg('LOJA-99', 'Loja', 'Loja - Alamor');
  const b = reg('LOJA-01', 'Loja', 'Loja - Zapotillo');
  assert.ok(compararRutas(a, b) < 0);
});

prueba('prioridad 3: con igual cooperativa y nombre, decide el id', () => {
  const a = reg('LOJA-02', 'Loja', 'Loja - Alamor');
  const b = reg('LOJA-10', 'Loja', 'Loja - Alamor');
  assert.ok(compararRutas(a, b) < 0);
  assert.ok(compararRutas(b, a) > 0);
});

prueba('el id numérico se compara como número (LOJA-2 antes que LOJA-10)', () => {
  assert.ok(compararRutas(reg('LOJA-2', 'Loja', 'X'), reg('LOJA-10', 'Loja', 'X')) < 0);
});

prueba('las tildes se ordenan como en español (Macará junto a Macara, antes que Mz)', () => {
  assert.ok(compararRutas(reg('1', 'Loja', 'Macará'), reg('1', 'Loja', 'Mz')) < 0);
});

prueba('es antisimétrico y consistente con los campos reales de rutas.json', () => {
  for (const a of rutas) {
    for (const b of rutas) {
      assert.equal(Math.sign(compararRutas(a, b)) + Math.sign(compararRutas(b, a)), 0);
    }
    assert.equal(compararRutas(a, a), 0);
  }
});

prueba('crearComparador rechaza campos que no existen en rutas.json', () => {
  assert.throws(() => crearComparador(['cooperativa', 'precio']), /no soportado/);
  assert.throws(() => crearComparador(['toString']), /no soportado/);
});

// ---------- 2. Pruebas por algoritmo ----------
for (const { nombre, fn } of algoritmos) {
  if (!fn) {
    pendientes++;
    console.log(`\n${nombre}: PENDIENTE (el módulo todavía no exporta la función; Issue ${nombre === 'QuickSort' ? '#9' : '#10'})`);
    continue;
  }
  console.log(`\n${nombre}`);

  prueba('ordena por múltiples criterios: cooperativa -> nombre -> id', () => {
    assert.deepEqual(ids(fn(crearRegistros(), compararRutas)), idsEsperados);
  });

  prueba('ordena los registros reales de rutas.json', () => {
    const resultado = fn(rutas, compararRutas);
    assert.equal(resultado.length, rutas.length);
    assert.ok(estaOrdenado(resultado, compararRutas));
    assert.ok(mismosRegistros(rutas, resultado));
    assert.equal(resultado[0].id, 'LOJA-10', 'Loja - Alamor debe ir primero');
    assert.equal(resultado[resultado.length - 1].id, 'LOJA-02', 'Loja - Zapotillo debe ir al final');
  });

  prueba('registros duplicados: no se pierden ni se alteran', () => {
    const entrada = [...crearRegistros(), ...crearRegistros()]; // cada registro aparece dos veces
    const resultado = fn(entrada, compararRutas);
    assert.equal(resultado.length, 14);
    assert.ok(estaOrdenado(resultado, compararRutas));
    assert.ok(mismosRegistros(entrada, resultado));
    assert.deepEqual(ids(resultado), idsEsperados.flatMap((id) => [id, id]));
  });

  prueba('muchos duplicados (500 registros con semilla fija)', () => {
    const entrada = crearRegistrosAleatorios(500, 11);
    const resultado = fn(entrada, compararRutas);
    assert.ok(estaOrdenado(resultado, compararRutas));
    assert.ok(mismosRegistros(entrada, resultado));
  });

  prueba('arreglo vacío -> arreglo vacío nuevo, sin errores', () => {
    const entrada = [];
    const resultado = fn(entrada, compararRutas);
    assert.deepEqual(resultado, []);
    assert.notEqual(resultado, entrada);
  });

  prueba('arreglo de un elemento', () => {
    const entrada = [reg('LOJA-01', 'Loja', 'Loja - Zapotillo')];
    const resultado = fn(entrada, compararRutas);
    assert.deepEqual(resultado, [reg('LOJA-01', 'Loja', 'Loja - Zapotillo')]);
    assert.notEqual(resultado, entrada);
  });

  prueba('ya ordenado y en orden inverso', () => {
    const ordenado = fn(crearRegistros(), compararRutas);
    const inverso = ordenado.slice().reverse();
    assert.deepEqual(ids(fn(ordenado, compararRutas)), idsEsperados);
    assert.deepEqual(ids(fn(inverso, compararRutas)), idsEsperados);
  });

  prueba('preserva el arreglo original y devuelve un arreglo nuevo', () => {
    const entrada = crearRegistros();
    const copiaProfunda = structuredClone(entrada);
    const resultado = fn(entrada, compararRutas);
    assert.deepEqual(entrada, copiaProfunda, 'el arreglo original cambió');
    assert.notEqual(resultado, entrada, 'debe devolver un arreglo nuevo');
    assert.ok(!mismoOrden(entrada, resultado), 'el original sigue desordenado');
  });

  prueba('funciona con un arreglo congelado (prueba extra de no mutación)', () => {
    const entrada = Object.freeze(crearRegistros());
    assert.deepEqual(ids(fn(entrada, compararRutas)), idsEsperados);
  });
}

function mismoOrden(a, b) {
  return a.length === b.length && a.every((r, i) => r === b[i]);
}

// ---------- 3. Coincidencia entre algoritmos ----------
const [qs, ms] = algoritmos;
if (qs.fn && ms.fn) {
  console.log('\nQuickSort vs MergeSort (mismo comparador)');

  prueba('producen exactamente el mismo orden con los datos de prueba', () => {
    assert.deepEqual(qs.fn(crearRegistros(), compararRutas), ms.fn(crearRegistros(), compararRutas));
  });

  prueba('producen exactamente el mismo orden con rutas.json', () => {
    assert.deepEqual(qs.fn(rutas, compararRutas), ms.fn(rutas, compararRutas));
  });

  prueba('producen el mismo orden con 1000 registros y duplicados (varias semillas)', () => {
    for (const semilla of [1, 7, 42]) {
      const entrada = crearRegistrosAleatorios(1000, semilla);
      assert.deepEqual(qs.fn(entrada, compararRutas), ms.fn(entrada, compararRutas));
    }
  });
} else {
  pendientes++;
  console.log('\nQuickSort vs MergeSort: PENDIENTE (requiere ambos módulos, Issues #9 y #10)');
}

// ---------- Resumen ----------
console.log(`\nResultado: ${correctas} correctas, ${fallos.length} fallidas, ${pendientes} bloque(s) pendiente(s)`);
if (fallos.length > 0) {
  console.error(fallos.join('\n'));
  process.exit(1);
}
console.log('Sort tests OK');