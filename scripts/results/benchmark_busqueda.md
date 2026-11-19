# Benchmark búsqueda en archivos indexados (issue #18)

- Node v24.21.0 | win32 x64 | semilla 20261118
- 30 mediciones válidas por clave, 5 de calentamiento descartadas
- Acceso al archivo y búsqueda se miden por separado.

## A. Tiempo de acceso al archivo

| n | Tamaño (KB) | Lectura media (ms) | Parseo JSON medio (ms) | Total medio (ms) |
| --- | --- | --- | --- | --- |
| 1000 | 230.9 | 0.668 | 1.352 | 2.020 |
| 50000 | 11545.8 | 32.249 | 98.328 | 130.577 |
| 500000 | 115456.5 | 193.290 | 830.873 | 1024.163 |

## B. Búsqueda: comparaciones y tiempo

### n = 1000

| Categoría | Sec. comparaciones | Bin. comparaciones | Sec. tiempo (ms) | Bin. tiempo (ms) | Razón tiempo sec/bin |
| --- | --- | --- | --- | --- | --- |
| exitosa-primera | 1.0 | 9.0 | 0.000364 | 0.009348 | 0.0x |
| exitosa-mitad | 501.0 | 9.0 | 0.187059 | 0.009357 | 20.0x |
| exitosa-ultima | 1000.0 | 10.0 | 0.326691 | 0.010687 | 30.6x |
| exitosa-aleatorias | 587.4 | 9.6 | 0.264703 | 0.007827 | 33.8x |
| fallida | 1000.0 | 9.7 | 0.534362 | 0.002036 | 262.4x |

### n = 50000

| Categoría | Sec. comparaciones | Bin. comparaciones | Sec. tiempo (ms) | Bin. tiempo (ms) | Razón tiempo sec/bin |
| --- | --- | --- | --- | --- | --- |
| exitosa-primera | 1.0 | 15.0 | 0.000215 | 0.006778 | 0.0x |
| exitosa-mitad | 25001.0 | 15.0 | 29.296381 | 0.006688 | 4380.3x |
| exitosa-ultima | 50000.0 | 16.0 | 19.076689 | 0.007035 | 2711.5x |
| exitosa-aleatorias | 29572.4 | 14.6 | 10.528211 | 0.006283 | 1675.6x |
| fallida | 50000.0 | 15.7 | 9.260300 | 0.003439 | 2692.4x |

### n = 500000

| Categoría | Sec. comparaciones | Bin. comparaciones | Sec. tiempo (ms) | Bin. tiempo (ms) | Razón tiempo sec/bin |
| --- | --- | --- | --- | --- | --- |
| exitosa-primera | 1.0 | 18.0 | 0.000200 | 0.009236 | 0.0x |
| exitosa-mitad | 250001.0 | 18.0 | 72.240943 | 0.009316 | 7754.6x |
| exitosa-ultima | 500000.0 | 19.0 | 123.050907 | 0.007568 | 16259.4x |
| exitosa-aleatorias | 262251.4 | 17.9 | 73.599532 | 0.008208 | 8966.5x |
| fallida | 500000.0 | 18.7 | 103.686239 | 0.004072 | 25461.4x |

