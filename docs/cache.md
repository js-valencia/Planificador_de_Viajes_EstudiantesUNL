# Caché de consultas de itinerarios

## Qué se guarda

| Nivel | Qué contiene | Clave | TTL por defecto | Máx. entradas |
|---|---|---|---|---|
| Resultados | Itinerario devuelto por `buscarRuta` (o `null` si no hay conexión) | `origen · destino · criterio · instante` | **5 min** (`CACHE_TTL_SEGUNDOS`) | 500 |
| Planificadores | Grafo de horarios + matrices Floyd-Warshall | Ventana de fechas (día consultado y día siguiente, hora de Ecuador) | **30 min** | 14 |

**Por qué estos dos.** Lo más caro es construir el grafo y calcular Floyd-Warshall (~12 ms + 30-55 ms por criterio en los datos actuales); ese nivel ya existía sin vencimiento y ahora lo tiene. Encima se añade el caché de resultados, que evita recorrer salidas × llegadas y armar el itinerario cuando la consulta se repite. No se cachean las respuestas de `/api/terminales` ni `/api/health` (no hay cálculo que evitar).

**Clave.** `instante` es `Date.parse(desde)` en milisegundos, de modo que `…T08:00:00-05:00` y `…T13:00:00Z` comparten entrada. No se redondea a minutos: la salida debe ser `>= desde` y `esperaInicialMin` depende del segundo exacto, así que redondear podría servir un resultado distinto del real. La app móvil y el cliente web envían siempre `HH:MM:00`, por lo que los aciertos entre usuarios son viables. Las claves se construyen con `JSON.stringify([...])`, sin riesgo de colisión por separadores.

**Qué no depende del reloj.** El resultado solo depende de los parámetros y de los datos, no de "ahora" (la fecha viene en la consulta). El TTL no protege la corrección respecto al tiempo; acota la antigüedad máxima si falla la detección de cambios y limita la memoria.

## Invalidación

1. **Automática por cambio de datos.** Antes de cada consulta se compara la huella de `src/main/data/rutas.json` (fecha de modificación + tamaño, dos `statSync`, microsegundos). Si cambió, se vacían **ambos** niveles y la consulta se recalcula con los datos nuevos.
2. **Si no se puede leer la huella** (archivo ausente o sin permisos) se invalida: ante la duda, no se sirve caché.
3. **Vencimiento.** Una entrada vencida nunca se devuelve; `get()` la elimina y cuenta un vencimiento.
4. **Manual.** `servicio.invalidar()` (módulo `consultasService`) para quien actualice los datos desde código. No hay endpoint de invalidación porque la API es de solo lectura (RNF-06).

## Cómo observarlo

- Cabecera `X-Cache: HIT | MISS` en `GET /api/ruta`.
- `GET /api/cache/stats`: aciertos, fallos, vencimientos, expulsiones, invalidaciones y tasa de aciertos de cada nivel.
- `node scripts/cache/benchmark_cache.js` → `scripts/resultados/cache/benchmark_cache.md`.

## Limitaciones

- **Memoria del proceso.** Cada instancia del servidor tiene su propio caché; no se comparte entre procesos y se pierde al reiniciar. Con varias instancias, cada una detecta el cambio de `rutas.json` por su cuenta.
- **Huella por mtime+tamaño.** Una edición que conserve ambos (p. ej. restaurar la fecha con `touch -r`) no se detecta; el TTL acota ese caso a 5 min en resultados y 30 min en planificadores. Si los datos pasan a una base de datos habrá que sustituir `versionDeDatos` por un número de versión o un evento de cambio.
- **Solo rutas.json.** `terminales.json` no invalida el caché (no interviene en el itinerario), y `servidor.js` lo lee una sola vez al arrancar para validar nombres: cambiarlo exige reiniciar, con o sin caché.
- **Objetos compartidos.** El itinerario cacheado es la misma referencia para todas las respuestas; el código no debe mutarlo (hoy solo se serializa con `res.json`).
- **Sin protección contra avalancha.** Al vencer una entrada popular, las consultas simultáneas la recalculan; el cálculo es síncrono y de microsegundos, así que no se justifica coordinarlas.
- **Cardinalidad.** El instante exacto forma parte de la clave; clientes que envíen segundos o milisegundos variables apenas producirán aciertos. El límite de 500 entradas acota la memoria.
- **Ganancia acotada.** El grafo ya se reutilizaba antes; el caché de resultados mejora sobre todo las consultas repetidas (ver benchmark). Los fallos (la primera consulta de cada criterio en una ventana de fechas) cuestan lo mismo que antes.

## Configuración

| Variable | Efecto | Defecto |
|---|---|---|
| `CACHE_TTL_SEGUNDOS` | Vida de un resultado en caché | 300 |
