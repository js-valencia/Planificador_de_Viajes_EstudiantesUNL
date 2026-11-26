# Benchmark del caché de consultas

- Fecha: 2026-11-26T01:13:24.193Z · Node v22.23.5
- Carga: 2000 solicitudes sintéticas sobre 40 consultas distintas (80 % en las 10 más populares), misma semilla en ambos escenarios.
- 5 corridas por escenario, cada una en un proceso nuevo; se reporta la **mediana** de las corridas.
- Mide el servicio (`buscarRuta`), sin red ni Express.

| Métrica | Antes (sin caché de resultados) | Después (con caché, TTL 5 min) |
|---|---:|---:|
| Media por consulta (ms) | 0.101 | 0.071 |
| p50 (ms) | 0.014 | 0.006 |
| p95 (ms) | 0.118 | 0.012 |
| Máximo (ms) | 41.744 | 44.032 |
| Tiempo total de la carga (ms) | 201.177 | 142.481 |
| Primera consulta (arranque en frío, ms) | 41.744 | 42.350 |

Caché de resultados tras la carga: 1960 aciertos, 40 fallos (tasa de aciertos 98.0 %), 0 vencimientos, 0 expulsiones.

## Cómo leerlo

- "Antes" ya reutilizaba el grafo y las matrices Floyd-Warshall por ventana de fechas; lo que se añade es evitar el recorrido de salidas × llegadas y el armado del itinerario en consultas repetidas. Por eso el beneficio en la media es moderado y los máximos (primera consulta de cada criterio, que calcula la matriz) no cambian: el caché de resultados no acelera los fallos.
- La tasa de aciertos depende de la carga real. Con la carga sintética de arriba es alta porque se repiten pocas consultas; en producción habrá que verificarla con `GET /api/cache/stats`.
