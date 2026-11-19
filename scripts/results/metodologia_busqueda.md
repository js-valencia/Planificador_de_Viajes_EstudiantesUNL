# Datos y metodología: búsqueda secuencial vs binaria (issue #15)

- Node v24.21.0 | semilla 20261118 | criterio de orden: cooperativa -> nombre -> id (`compararRutas`)
- Reproducir: `npm run datos:busqueda` (genera y verifica) y luego el benchmark de búsqueda.

## 1. Conjuntos ordenados

Cada conjunto parte de las 11 rutas reales de `rutas.json`, repetidas con id único (LOJA-01-000001, ...), y se ordena con el MergeSort del proyecto (sin `.sort()`). Se verifica que el orden sea estricto (sin empates) y que `n` coincida. No se guardan los 500.000 registros en disco: se regeneran con la semilla y la huella (SHA-1 de los ids, 12 caracteres) confirma que son idénticos.

| n | Huella | Primer id | Último id | ⌊log2 n⌋+1 |
| --- | --- | --- | --- | --- |
| 1.000 | b319c75fc1f8 | LOJA-10 | LOJA-02-000090 | 10 |
| 50.000 | a05927b8ee6c | LOJA-10 | LOJA-02-004545 | 16 |
| 500.000 | 6be6d956f940 | LOJA-10 | LOJA-02-045454 | 19 |

## 2. Búsquedas exitosas y fallidas

Ambos algoritmos reciben **el mismo arreglo ordenado** y **la misma clave** (comparador `compararRutas`). Una comparación = una llamada al comparador.

| Tipo | Clave | Qué representa | Comparaciones esperadas (sec. / bin.) |
| --- | --- | --- | --- |
| Exitosa | primera posición | mejor caso secuencial | 1 / ≈ ⌊log2 n⌋ |
| Exitosa | posición n/2 | caso intermedio | ≈ n/2 / ≈ ⌊log2 n⌋ |
| Exitosa | última posición | peor caso secuencial | n / ≈ ⌊log2 n⌋ |
| Exitosa | 20 posiciones aleatorias (semilla) | caso promedio | ≈ n/2 / ≈ ⌊log2 n⌋ |
| Fallida | menor que todas (`AAA-00`) | no existe, cae antes del primero | n / ≈ ⌊log2 n⌋ |
| Fallida | intermedia (id de la mitad + `-x`) | no existe, cae entre dos registros | n / ≈ ⌊log2 n⌋ |
| Fallida | mayor que todas (`ZZZ-99`) | no existe, cae después del último | n / ≈ ⌊log2 n⌋ |

Antes de medir, el script comprueba con ambos algoritmos que cada clave exitosa está en el índice esperado y que ninguna fallida existe.

## 3. Repeticiones

| n | Ejecuciones por medición (secuencial) | Ejecuciones por medición (binaria) | Mediciones válidas por clave | Calentamiento (descartadas) |
| --- | --- | --- | --- | --- |
| 1.000 | 100 | 5000 | 30 | 5 |
| 50.000 | 5 | 5000 | 30 | 5 |
| 500.000 | 1 | 5000 | 30 | 5 |

Una búsqueda dura microsegundos (binaria) o milisegundos (secuencial en 500.000), así que una **medición** cronometra varias ejecuciones seguidas con `performance.now()` y divide entre ese número (`medirBusqueda`). Las ejecuciones por medición se reducen en los tamaños grandes del secuencial para que el benchmark termine en minutos.

## 4. Cómo se calculan los promedios

1. **Por clave:** de las 30 mediciones válidas se calculan media, mediana, desviación estándar, mínimo y máximo (ordenando las muestras con inserción, sin `.sort()`). No se descartan valores atípicos; la mediana sirve de control.
2. **Por categoría y tamaño:** el tiempo reportado es la **media de las medias por clave**; todas las claves pesan igual. Categorías: exitosa-primera, exitosa-mitad, exitosa-última, exitosa-aleatorias (promedio de las 20) y fallida (promedio de las 3 claves fallidas, más el detalle por clave).
3. **Comparaciones:** son deterministas (no varían entre repeticiones), se registran una vez por clave y se promedian igual por categoría.
4. **Tabla final:** por cada n (1.000 / 50.000 / 500.000) y algoritmo: tiempo medio (ms), desviación, comparaciones medias y la razón secuencial/binaria.
5. **Reproducibilidad:** semilla fija, mismo Node y misma máquina; se anotan versión de Node y plataforma en los resultados.
