# Benchmark de ordenamiento: MergeSort vs QuickSort

- Dataset: src/main/data/rutas.json (11 rutas reales); criterio: cooperativa -> nombre -> id
- Node v24.21.0 | linux x64 | semilla 20261114
- 15 mediciones por celda (+3 de calentamiento descartadas); estadística sin Array.prototype.sort
- Memoria: process.memoryUsage().heapUsed en KB, SIN --expose-gc (valores más ruidosos; usar npm run benchmark:sort)
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
| 11 | MergeSort | 0.048 | 0.054 | 0.013 | 0.038 | 0.086 | 5303.1 | 5307.2 | 4.1 |
| 11 | QuickSort | 0.039 | 0.044 | 0.009 | 0.036 | 0.070 | 5460.9 | 5460.7 | 6.9 |
| 100 | MergeSort | 0.361 | 0.411 | 0.126 | 0.337 | 0.811 | 5683.7 | 5683.4 | 78.2 |
| 100 | QuickSort | 0.433 | 0.438 | 0.019 | 0.421 | 0.494 | 6116.0 | 6115.7 | 1.3 |
| 1000 | MergeSort | 8.418 | 8.178 | 1.414 | 5.495 | 10.457 | 6013.0 | 6029.2 | 16.1 |
| 1000 | QuickSort | 6.937 | 7.265 | 0.723 | 6.425 | 9.287 | 6262.0 | 6270.3 | 8.3 |
| 10000 | MergeSort | 113.822 | 117.987 | 19.063 | 91.535 | 156.388 | 8634.0 | 8633.7 | 176.4 |
| 10000 | QuickSort | 137.800 | 136.584 | 10.496 | 113.249 | 154.862 | 10349.9 | 10428.5 | 78.6 |
| 100000 | MergeSort | 1659.928 | 1661.603 | 246.156 | 1304.481 | 2132.124 | 38485.7 | 31838.4 | 1563.0 |
| 100000 | QuickSort | 1812.723 | 1670.344 | 550.000 | 921.149 | 2504.263 | 29240.9 | 29240.6 | 781.0 |

### Casos de entrada (n = 10000)

| Caso | Algoritmo | Mediana (ms) | Desv. (ms) | Δ heap (KB) |
| --- | --- | --- | --- | --- |
| aleatorio | MergeSort | 55.462 | 13.979 | 176.8 |
| aleatorio | QuickSort | 65.803 | 3.025 | 78.6 |
| ya ordenado | MergeSort | 50.492 | 14.396 | 176.4 |
| ya ordenado | QuickSort | 250.307 | 95.867 | 78.6 |
| inverso | MergeSort | 42.371 | 11.269 | 176.4 |
| inverso | QuickSort | 270.235 | 71.450 | 78.6 |

