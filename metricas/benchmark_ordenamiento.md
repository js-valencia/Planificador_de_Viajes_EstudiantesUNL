# Benchmark de ordenamiento: MergeSort vs QuickSort

- Dataset: src/main/data/rutas.json (11 rutas reales); criterio: cooperativa -> nombre -> id
- Node v24.21.0 | win32 x64 | semilla 20261114
- 15 mediciones por celda (+3 de calentamiento descartadas); estadística sin Array.prototype.sort
- Memoria: process.memoryUsage().heapUsed en KB, con global.gc() antes de cada medición
- Δ heap = heapUsed después − antes (incluye el arreglo resultado y los temporales aún no recolectados)

### Muestra antes y después (dataset real, 11 rutas; huella de entrada f805bc9ec60a)

| Pos. | Antes (id) | Después (id) | Ruta ordenada |
| --- | --- | --- | --- |
| 1 | LOJA-05 | LOJA-10 | Loja · Loja - Alamor |
| 2 | LOJA-01 | LOJA-11 | Loja · Loja - Amaluza |
| 3 | LOJA-03 | LOJA-07 | Loja · Loja - Cariamanga |
| 4 | LOJA-06 | LOJA-08 | Loja · Loja - Cariamanga (microbús) |
| 5 | LOJA-10 | LOJA-09 | Loja · Loja - Catacocha |
| 6 | LOJA-09 | LOJA-05 | Loja · Loja - Macará (microbuses) |
| 7 | LOJA-08 | LOJA-04 | Loja · Loja - Macará x Cariamanga |
| 8 | LOJA-11 | LOJA-03 | Loja · Loja - Macará x Catacocha |
| 9 | LOJA-07 | LOJA-01 | Loja · Loja - Machala normal x Chaguarpamba |
| 10 | LOJA-04 | LOJA-06 | Loja · Loja - Sozoranga x Cariamanga |
| 11 | LOJA-02 | LOJA-02 | Loja · Loja - Zapotillo |

MergeSort y QuickSort devuelven la misma secuencia de ids (verificado), y el resultado cumple el comparador.

### Tabla comparativa (entrada aleatoria)

| n | Algoritmo | Mediana (ms) | Media (ms) | Desv. (ms) | Mín (ms) | Máx (ms) | heapUsed antes (KB) | heapUsed después (KB) | Δ heap (KB) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 11 | MergeSort | 0.083 | 0.086 | 0.019 | 0.050 | 0.124 | 5074.9 | 5079.0 | 7.1 |
| 11 | QuickSort | 0.076 | 0.082 | 0.015 | 0.069 | 0.127 | 5101.5 | 5108.4 | 6.9 |
| 100 | MergeSort | 0.404 | 0.413 | 0.046 | 0.362 | 0.517 | 5184.6 | 5262.9 | 78.2 |
| 100 | QuickSort | 0.490 | 0.497 | 0.042 | 0.443 | 0.619 | 5194.8 | 5199.5 | 1.3 |
| 1000 | MergeSort | 5.587 | 5.725 | 0.518 | 4.847 | 6.884 | 5358.4 | 5374.5 | 16.1 |
| 1000 | QuickSort | 6.574 | 6.360 | 0.891 | 4.618 | 7.825 | 5375.5 | 5383.8 | 8.3 |
| 10000 | MergeSort | 69.987 | 70.662 | 12.255 | 51.150 | 96.492 | 6848.6 | 7005.4 | 156.8 |
| 10000 | QuickSort | 94.223 | 93.060 | 16.853 | 66.349 | 119.714 | 6931.1 | 7009.7 | 78.6 |
| 100000 | MergeSort | 933.499 | 945.814 | 83.424 | 838.636 | 1179.100 | 21487.0 | 23049.8 | 1562.7 |
| 100000 | QuickSort | 1319.430 | 1306.489 | 107.637 | 1027.026 | 1423.934 | 22272.0 | 23053.8 | 781.7 |

### Casos de entrada (n = 10000)

| Caso | Algoritmo | Mediana (ms) | Desv. (ms) | Δ heap (KB) |
| --- | --- | --- | --- | --- |
| aleatorio | MergeSort | 71.359 | 13.095 | 156.8 |
| aleatorio | QuickSort | 98.245 | 17.947 | 78.6 |
| ya ordenado | MergeSort | 38.642 | 7.686 | 156.8 |
| ya ordenado | QuickSort | 250.751 | 16.824 | 78.6 |
| inverso | MergeSort | 36.925 | 3.427 | 156.8 |
| inverso | QuickSort | 200.442 | 25.035 | 78.6 |

