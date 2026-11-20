# Benchmark búsqueda en archivos indexados (issue #18)

- Node v24.21.0 | linux x64 | semilla 20261118
- 30 mediciones válidas por clave, 5 de calentamiento descartadas
- Acceso al archivo y búsqueda se miden por separado.

## A. Tiempo de acceso al archivo

| n | Tamaño (KB) | Lectura media (ms) | Parseo JSON medio (ms) | Total medio (ms) |
| --- | --- | --- | --- | --- |
| 1000 | 230.9 | 2.382 | 4.553 | 6.935 |
| 50000 | 11545.7 | 66.588 | 160.156 | 226.745 |
| 500000 | 115456.4 | 703.652 | 1626.562 | 2330.215 |

## B. Búsqueda: comparaciones y tiempo

### n = 1000

| Categoría | Sec. comparaciones | Bin. comparaciones | Sec. tiempo (ms) | Bin. tiempo (ms) | Razón tiempo sec/bin |
| --- | --- | --- | --- | --- | --- |
| exitosa-primera | 1.0 | 9.0 | 0.001142 | 0.004842 | 0.2x |
| exitosa-mitad | 501.0 | 9.0 | 0.407572 | 0.007100 | 57.4x |
| exitosa-ultima | 1000.0 | 10.0 | 0.439889 | 0.007822 | 56.2x |
| exitosa-aleatorias | 582.9 | 9.4 | 0.289474 | 0.006361 | 45.5x |
| fallida | 1000.0 | 9.7 | 0.349638 | 0.003528 | 99.1x |

### n = 50000

| Categoría | Sec. comparaciones | Bin. comparaciones | Sec. tiempo (ms) | Bin. tiempo (ms) | Razón tiempo sec/bin |
| --- | --- | --- | --- | --- | --- |
| exitosa-primera | 1.0 | 15.0 | 0.000485 | 0.004784 | 0.1x |
| exitosa-mitad | 25001.0 | 15.0 | 13.623035 | 0.012626 | 1078.9x |
| exitosa-ultima | 50000.0 | 16.0 | 21.709883 | 0.013515 | 1606.3x |
| exitosa-aleatorias | 29572.4 | 14.6 | 14.771795 | 0.011289 | 1308.6x |
| fallida | 50000.0 | 15.7 | 19.134001 | 0.007551 | 2533.9x |

### n = 500000

| Categoría | Sec. comparaciones | Bin. comparaciones | Sec. tiempo (ms) | Bin. tiempo (ms) | Razón tiempo sec/bin |
| --- | --- | --- | --- | --- | --- |
| exitosa-primera | 1.0 | 18.0 | 0.000542 | 0.005750 | 0.1x |
| exitosa-mitad | 250001.0 | 18.0 | 146.619963 | 0.009216 | 15908.6x |
| exitosa-ultima | 500000.0 | 19.0 | 211.799115 | 0.015171 | 13961.1x |
| exitosa-aleatorias | 262251.4 | 17.9 | 127.894465 | 0.011139 | 11481.8x |
| fallida | 500000.0 | 18.7 | 172.919944 | 0.006910 | 25024.3x |

