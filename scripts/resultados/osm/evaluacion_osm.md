# Evaluación de rutas basadas en OpenStreetMap (issue #4)

## 1. Objetivo y alcance

Evaluar si la red de calles y caminos de OpenStreetMap (OSM) sirve para calcular o visualizar recorridos entre las terminales del proyecto. Se probó un servicio de enrutamiento compatible con OSM, se comprobó si devuelve recorridos entre las terminales, se comparó el resultado con el trazado actual (`rutas.json`) y se documentaron sus límites. Además, se integró el trazado por carretera en la app móvil (sección 11).

## 2. Servicio probado

| Dato | Valor |
| --- | --- |
| Servicio | OSRM, servidor de demostración público (`https://router.project-osrm.org`) |
| Perfil | `driving` (vehículo liviano por calles y carreteras) |
| Datos de mapa | OpenStreetMap, licencia ODbL |
| Condiciones de uso | Uso razonable y no comercial, máximo 1 petición por segundo, `User-Agent` que identifique la aplicación, sin garantía de disponibilidad |

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

1. Almacenar las distancias y duraciones calculadas por OSRM para evitar consultas repetidas al servicio. Parcialmente hecho: `generar_geometrias.js` guarda `distanciaKm` y `duracionAutoMin` por tramo en `src/main/data/geometrias.json`, pero la app todavía no los usa.
2. Incorporar `distanciaKm` y `duracionAutoMin` como datos complementarios, sin modificar los horarios utilizados por el grafo. Pendiente.
3. Corregir las coordenadas de Sacapalca y Cangonama para mejorar la precisión de los recorridos. Pendiente.
4. Guardar las geometrías para permitir la visualización de los recorridos en un mapa. Hecho: ver sección 11.

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
| `scripts/osm/generar_geometrias.js` | Calcula con OSRM el trazado de cada tramo entre paradas consecutivas y lo guarda en `src/main/data/geometrias.json` |
| `scripts/osm/exportar_geometrias_app.js` | Simplifica los trazados y genera `mobile-app/src/data/geometriasOsm.json` |
| `mobile-app/src/trazadoOsm.ts` | Une los tramos de una ruta usando `paradasRuta` y devuelve los puntos a dibujar |
| `mobile-app/src/MapaOsm.tsx` | Mapa de OpenStreetMap con Leaflet dentro de un WebView |
| `scripts/resultados/osm/osrm_resultados.md` y `.json` | Distancia, duración y desvío por par |
| `scripts/resultados/osm/osrm_rutas.geojson` | Trazados para visualizar |
| `scripts/resultados/osm/comparacion_bus_auto.md` y `.json` | Comparación de tiempos |

Para reproducir, desde la raíz del proyecto:

```
node scripts/osm/prueba_osrm.js
node scripts/osm/comparar_con_horarios.js
node scripts/osm/generar_geometrias.js
node scripts/osm/exportar_geometrias_app.js
```

## 11. Integración en la app móvil

- **Qué se hizo:** los trazados por carretera se calculan una sola vez con OSRM (`scripts/osm/generar_geometrias.js`) para cada par de paradas consecutivas de `rutas.json`. Luego `scripts/osm/exportar_geometrias_app.js` los simplifica (de ~58.000 a ~10.800 puntos, 219 KB) y genera `mobile-app/src/data/geometriasOsm.json`.
- **Cómo se dibuja:** la app une los tramos con `paradasRuta` de cada tramo de `/api/ruta` (`mobile-app/src/trazadoOsm.ts`) y los muestra sobre un mapa de OpenStreetMap con Leaflet dentro de un WebView (`mobile-app/src/MapaOsm.tsx`). No se modificó la API. Si algún tramo no tiene trazado, la app dibuja la línea recta entre terminales como antes.
- **Qué es OSM y qué no:** el mapa base y la forma de la línea vienen de OpenStreetMap. Las paradas y los horarios siguen saliendo de `rutas.json`; los nodos de las calles no se usan como paradas.
- **Límites:**
  - El servidor demo de OSRM admite 1 petición por segundo y no es para producción.
  - Las teselas de `tile.openstreetmap.org` son para uso moderado.
  - El trazado es referencial, calculado para auto, no para la ruta exacta del bus.
  - El mapa necesita conexión a internet en el teléfono: Leaflet se carga desde `cdnjs.cloudflare.com` y las teselas desde `tile.openstreetmap.org`. Sin conexión, el mapa no se dibuja, aunque el itinerario sí se muestra.
  - La app depende del campo `paradasRuta` de cada tramo de `/api/ruta`; si se elimina o se renombra, el trazado deja de dibujarse.
- **Qué requeriría integrarlo en producción:** servidor propio de OSRM o GraphHopper, servidor propio de teselas, y volver a ejecutar los dos scripts de trazado cada vez que cambien las rutas o las paradas.
- **Atribución:** © colaboradores de OpenStreetMap (licencia ODbL), visible en el mapa.