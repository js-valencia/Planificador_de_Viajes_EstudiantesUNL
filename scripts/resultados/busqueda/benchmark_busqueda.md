# Benchmark búsqueda en archivos indexados (issue #18)

- Node v24.21.0 | linux x64 | semilla 20261118
- 30 mediciones válidas por clave, 5 de calentamiento descartadas
- Acceso al archivo y búsqueda se miden por separado.

## A. Tiempo de acceso al archivo

| n | Tamaño (KB) | Lectura media (ms) | Parseo JSON medio (ms) | Total medio (ms) |
| --- | --- | --- | --- | --- |
| 1000 | 230.9 | 0.288 | 0.740 | 1.028 |
| 50000 | 11545.7 | 13.159 | 37.575 | 50.733 |
| 500000 | 115456.4 | 132.750 | 445.315 | 578.064 |

## B. Búsqueda: comparaciones y tiempo

### n = 1000

| Categoría | Sec. comparaciones | Bin. comparaciones | Sec. tiempo (ms) | Bin. tiempo (ms) | Razón tiempo sec/bin |
| --- | --- | --- | --- | --- | --- |
| exitosa-primera | 1.0 | 9.0 | 0.000157 | 0.001062 | 0.1x |
| exitosa-mitad | 501.0 | 9.0 | 0.063372 | 0.001813 | 35.0x |
| exitosa-ultima | 1000.0 | 10.0 | 0.112014 | 0.001905 | 58.8x |
| exitosa-aleatorias | 582.9 | 9.4 | 0.067567 | 0.001848 | 36.6x |
| fallida | 1000.0 | 9.7 | 0.077842 | 0.001027 | 75.8x |

### n = 50000

| Categoría | Sec. comparaciones | Bin. comparaciones | Sec. tiempo (ms) | Bin. tiempo (ms) | Razón tiempo sec/bin |
| --- | --- | --- | --- | --- | --- |
| exitosa-primera | 1.0 | 15.0 | 0.000103 | 0.001982 | 0.1x |
| exitosa-mitad | 25001.0 | 15.0 | 3.453286 | 0.003209 | 1076.2x |
| exitosa-ultima | 50000.0 | 16.0 | 5.606173 | 0.003534 | 1586.5x |
| exitosa-aleatorias | 29572.4 | 14.6 | 3.740549 | 0.003106 | 1204.2x |
| fallida | 50000.0 | 15.7 | 4.034865 | 0.001741 | 2317.9x |

### n = 500000

| Categoría | Sec. comparaciones | Bin. comparaciones | Sec. tiempo (ms) | Bin. tiempo (ms) | Razón tiempo sec/bin |
| --- | --- | --- | --- | --- | --- |
| exitosa-primera | 1.0 | 18.0 | 0.000111 | 0.002195 | 0.1x |
| exitosa-mitad | 250001.0 | 18.0 | 32.197754 | 0.003921 | 8211.1x |
| exitosa-ultima | 500000.0 | 19.0 | 59.299202 | 0.004009 | 14790.8x |
| exitosa-aleatorias | 262251.4 | 17.9 | 33.493333 | 0.003910 | 8567.1x |
| fallida | 500000.0 | 18.7 | 40.198151 | 0.002040 | 19708.1x |

