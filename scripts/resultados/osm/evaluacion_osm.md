# Evaluación de rutas basadas en OpenStreetMap (issue #4)

## 1. Objetivo y alcance

Evaluar si la red de calles y caminos de OpenStreetMap (OSM) sirve para calcular o visualizar recorridos entre las terminales del proyecto. Se probó un servicio de enrutamiento compatible con OSM, se comprobó si devuelve recorridos entre las terminales, se comparó el resultado con el trazado actual (`rutas.json`) y se documentaron sus límites.

No se probó GraphHopper. La evaluación se limitó a OSRM.

## 2. Servicio probado

| Dato | Valor |
| --- | --- |
| Servicio | OSRM, servidor de demostración público (`https://router.project-osrm.org`) |
| Perfil | `driving` (vehículo liviano por calles y carreteras) |
| Datos de mapa | OpenStreetMap, licencia ODbL |
| Condiciones de uso | Uso razonable y no comercial, máximo 1 petición por segundo, `User-Agent` que identifique la aplicación, sin garantía de disponibilidad |

Referencias: [demo server](https://github.com/Project-OSRM/osrm-backend/wiki/Demo-server) y [política de uso](https://github.com/Project-OSRM/osrm-backend/wiki/Api-usage-policy).

## 3. Método

1. Se tomaron las coordenadas (`lat`, `lng`) de las 19 terminales de `src/main/data/terminales.json`. OSRM recibe las coordenadas como `longitud,latitud`, por lo que el script las invierte.
2. `scripts/osm/prueba_osrm.js` consulta 21 pares: Loja hacia las otras 18 terminales, más Catamayo-Catacocha, Cariamanga-Macará y Macará-Zapotillo. Espera 1,1 segundos entre peticiones.
3. Por cada par se guarda la distancia, la duración, el trazado y el desvío entre la coordenada de la terminal y la vía a la que OSRM la asoció.
4. `scripts/osm/comparar_con_horarios.js` compara los minutos de bus de `rutas.json` con la duración en auto de OSRM.

## 4. Resultados

OSRM devolvió ruta para los **21 pares** (21 con ruta, 0 con error). La distancia va de 28,1 km (Loja-Catamayo) a 226,9 km (Loja-Machala). El detalle completo está en `scripts/resultados/osm/osrm_resultados.md`, y los trazados, en `osrm_rutas.geojson` (se pueden ver en geojson.io).

### Calidad de las coordenadas de las terminales

La mayoría de las terminales queda a menos de 40 m de una vía. Estas son las excepciones:

| Terminal | Desvío a la vía más cercana | Observación |
| --- | --- | --- |
| Sacapalca | 391 m | La coordenada no cae sobre una vía |
| Cangonama | 273 m | La coordenada no cae sobre una vía |
| Casanga | 73 m | Vía sin nombre en OSM |
| Loja | 24 m | Vía sin nombre en OSM |

Además, para Sozoranga, Machala, Casanga y Sacapalca la vía asociada no tiene nombre en OSM. Varias coordenadas de `terminales.json` son el centro del poblado y no una terminal real, por lo que el desvío es esperable.

## 5. Comparación con el trazado actual

El sistema actual no maneja distancias ni geometrías. Trabaja con minutos de salida y llegada entre terminales. Por eso la comparación se hizo sobre la duración: minutos de bus en `rutas.json` frente a minutos en auto de OSRM, en 27 tramos. Razón = minutos de bus / minutos en auto.

| Tiempo de bus en `rutas.json` | Tramos | Mediana de la razón | Tramos donde el bus es más rápido que el auto |
| --- | --- | --- | --- |
| Estimado (cooperativa Loja) | 16 | 1,41 | 0 |
| Verificado (cooperativa Catamayo) | 11 | 1,14 | 3 |

Observaciones:

- El bus tarda más que el auto en general, lo que es esperable porque hace paradas.
- En tres tramos verificados el bus es más rápido que la estimación de OSRM: Loja-Catamayo (40 contra 48,8 min), Loja-El Cisne (64 contra 81,4 min) y Loja-Chaguarpamba por Catamayo (85 contra 99,7 min). La duración de OSRM sale de velocidades asignadas por tipo de vía, por lo que no es un valor máximo confiable.
- Un mismo destino tiene tiempos distintos según la ruta. Loja-Chaguarpamba figura con 150 min en `LOJA-01` (estimado) y con 85 min en `CATAMAYO-08` (verificado). Loja-Catacocha figura con 135 min en `LOJA-03` y `LOJA-09` (estimados) y con 110 min en `CATAMAYO-10` (verificado). Puede deberse a que son rutas distintas, pero los valores estimados de la cooperativa Loja parecen altos y conviene revisarlos cuando se consigan los reales.
- OSRM elige el camino más rápido y no el que sigue el bus. En `LOJA-04` (Loja-Macará por Cariamanga) el bus tarda 240 min. OSRM calcula 152,2 min por el camino directo y 188,3 min si se pasa por Cariamanga (115,6 + 72,7).

Detalle por tramo: `scripts/resultados/osm/comparacion_bus_auto.md`.

## 6. Límites

- OSRM calcula rutas para vehículos en calles. No conoce cooperativas, líneas, paradas ni horarios.
- La duración no incluye paradas, esperas ni transbordos.
- Las duraciones son estimadas por tipo de vía, sin tráfico ni velocidades reales de los buses.
- El servidor de demostración limita las peticiones, no garantiza disponibilidad ni actualización de datos, y su uso debe ser no comercial.
- La calidad depende de cómo esté mapeada la zona: hay vías sin nombre y coordenadas que no caen sobre una vía.
- La ruta calculada puede no coincidir con la que realmente recorre un bus.

## 7. Cambios necesarios para integrarlo

1. Calcular las distancias y duraciones una sola vez y guardarlas en un archivo, sin consultar el servicio en cada búsqueda del planificador.
2. Agregar `distanciaKm` y `duracionAutoMin` a cada tramo como dato adicional. El grafo seguiría usando los minutos del horario.
3. Corregir las coordenadas con desvío alto (Sacapalca y Cangonama) para que caigan sobre una vía.
4. Si se necesita independencia del servicio externo o más peticiones, ejecutar OSRM en un servidor propio con un extracto de OSM de la zona.
5. Si se quiere mostrar el recorrido en el mapa, guardar la geometría de cada tramo (formato GeoJSON, como en `osrm_rutas.geojson`).
6. Usar la comparación con OSRM como control de razonabilidad de los tiempos estimados, no como reemplazo del horario.

## 8. Nodos de calles frente a paradas y horarios

Los nodos y caminos de OSM representan calles, y el grafo del proyecto representa terminales con horarios de salida y llegada. No son lo mismo y no se mezclan:

- Los nodos de calles nunca entran al grafo de `GrafoHorarios.js`.
- Cada terminal se asocia a la vía más cercana solo para calcular distancia y duración, y el desvío se registra para detectar coordenadas dudosas.
- Una ruta de OSRM no implica que exista un bus ni un horario en ese tramo. Eso solo lo definen las rutas y salidas de `rutas.json`.

## 9. Conclusión

OSRM con datos de OpenStreetMap devuelve recorridos entre todas las terminales del proyecto y permite obtener distancias y trazados que hoy el sistema no tiene. No reemplaza los horarios ni la lógica de conexiones, porque no conoce las líneas de bus. Se recomienda usarlo como dato complementario precalculado, y no como parte del cálculo de itinerarios.

## 10. Archivos y reproducción

| Archivo | Contenido |
| --- | --- |
| `scripts/osm/prueba_osrm.js` | Consulta a OSRM y generación de resultados |
| `scripts/osm/comparar_con_horarios.js` | Comparación entre bus y auto |
| `scripts/resultados/osm/osrm_resultados.md` y `.json` | Distancia, duración y desvío por par |
| `scripts/resultados/osm/osrm_rutas.geojson` | Trazados para visualizar |
| `scripts/resultados/osm/comparacion_bus_auto.md` y `.json` | Comparación de tiempos |

Para reproducir, desde la raíz del proyecto:

```
node scripts/osm/prueba_osrm.js
node scripts/osm/comparar_con_horarios.js
```

Datos de mapa: © colaboradores de OpenStreetMap (ODbL). Enrutamiento: OSRM.