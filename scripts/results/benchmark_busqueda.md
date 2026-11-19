# Benchmark búsqueda en archivos indexados (issue #18)

- Node v24.21.0 | win32 x64 | semilla 20261118
- 30 mediciones válidas por clave, 5 de calentamiento descartadas
- Acceso al archivo y búsqueda se miden por separado.

## A. Tiempo de acceso al archivo

| n | Tamaño (KB) | Lectura media (ms) | Parseo JSON medio (ms) | Total medio (ms) |
| --- | --- | --- | --- | --- |
| 1000 | 230.9 | 0.514 | 1.361 | 1.876 |
| 50000 | 11545.8 | 28.570 | 105.567 | 134.137 |
| 500000 | 115456.5 | 399.194 | 1685.177 | 2084.371 |

## B. Búsqueda: comparaciones y tiempo

### n = 1000

| Categoría | Sec. comparaciones | Bin. comparaciones | Sec. tiempo (ms) | Bin. tiempo (ms) | Razón tiempo sec/bin |
| --- | --- | --- | --- | --- | --- |
| exitosa-primera | 1.0 | 9.0 | 0.000224 | 0.004199 | 0.1x |
| exitosa-mitad | 501.0 | 9.0 | 0.129737 | 0.005483 | 23.7x |
| exitosa-ultima | 1000.0 | 10.0 | 0.237731 | 0.009880 | 24.1x |
| exitosa-aleatorias | 587.4 | 9.6 | 0.141521 | 0.007702 | 18.4x |
| fallida | 1000.0 | 9.7 | 0.183350 | 0.004167 | 44.0x |

### n = 50000

| Categoría | Sec. comparaciones | Bin. comparaciones | Sec. tiempo (ms) | Bin. tiempo (ms) | Razón tiempo sec/bin |
| --- | --- | --- | --- | --- | --- |
| exitosa-primera | 1.0 | 15.0 | 0.000317 | 0.006812 | 0.0x |
| exitosa-mitad | 25001.0 | 15.0 | 13.987536 | 0.012534 | 1116.0x |
| exitosa-ultima | 50000.0 | 16.0 | 20.173431 | 0.009065 | 2225.4x |
| exitosa-aleatorias | 29572.4 | 14.6 | 13.691339 | 0.008427 | 1624.6x |
| fallida | 50000.0 | 15.7 | 14.553851 | 0.004657 | 3124.9x |

### n = 500000

| Categoría | Sec. comparaciones | Bin. comparaciones | Sec. tiempo (ms) | Bin. tiempo (ms) | Razón tiempo sec/bin |
| --- | --- | --- | --- | --- | --- |
| exitosa-primera | 1.0 | 18.0 | 0.000253 | 0.010373 | 0.0x |
| exitosa-mitad | 250001.0 | 18.0 | 136.902480 | 0.010822 | 12650.7x |
| exitosa-ultima | 500000.0 | 19.0 | 217.455330 | 0.010241 | 21234.7x |
| exitosa-aleatorias | 262251.4 | 17.9 | 123.452297 | 0.010553 | 11698.4x |
| fallida | 500000.0 | 18.7 | 159.886300 | 0.005041 | 31718.6x |

