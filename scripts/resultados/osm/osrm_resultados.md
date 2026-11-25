# Evaluación OSM: rutas con OSRM entre terminales (issue #4)

- Servicio: OSRM (https://router.project-osrm.org), perfil `driving`
- Fecha de la prueba: 2026-11-25T06:28:40.853Z | Node v24.21.0
- Pares probados: 21 (21 con ruta, 0 con error)
- Datos de mapa: © colaboradores de OpenStreetMap (ODbL). Enrutamiento: OSRM.

## Resultados

| Origen | Destino | Distancia (km) | Duración en auto (min) | Desvío origen (m) | Desvío destino (m) | Vía origen | Vía destino |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Loja | Catamayo | 28.1 | 48.8 | 24 | 11 | (sin nombre) | Avenida Catamayo |
| Loja | Chaguarpamba | 98.9 | 99.7 | 24 | 4 | (sin nombre) | La Unión |
| Loja | Catacocha | 85.6 | 90.5 | 24 | 2 | (sin nombre) | Universitaria |
| Loja | Cariamanga | 98.1 | 115.6 | 24 | 37 | (sin nombre) | Avenida Del Ejército |
| Loja | Sozoranga | 143.4 | 157.8 | 24 | 13 | (sin nombre) | (sin nombre) |
| Loja | Macará | 173.9 | 152.2 | 24 | 12 | (sin nombre) | Juvenal Jaramillo |
| Loja | Zapotillo | 214.3 | 197.8 | 24 | 12 | (sin nombre) | Avenida Quito |
| Loja | Alamor | 181.1 | 168.9 | 24 | 10 | (sin nombre) | Avenida Eugenio Espejo |
| Loja | Amaluza | 132.4 | 156.2 | 24 | 5 | (sin nombre) | Francisco Chigua |
| Loja | Machala | 226.9 | 195.6 | 24 | 3 | (sin nombre) | (sin nombre) |
| Loja | Cangonama | 94.0 | 105.9 | 24 | 273 | (sin nombre) | 29 de Mayo |
| Loja | Quilanga | 87.1 | 106.9 | 24 | 27 | (sin nombre) | Bolivar |
| Loja | Lauro Guerrero | 107.9 | 120.9 | 24 | 10 | (sin nombre) | J. M. Zárate |
| Loja | Casanga | 109.3 | 108.3 | 24 | 73 | (sin nombre) | (sin nombre) |
| Loja | Sacapalca | 88.0 | 111.6 | 24 | 391 | (sin nombre) | (sin nombre) |
| Loja | Chagaimina | 91.9 | 110.6 | 24 | 29 | (sin nombre) | Changaimina - Sacapalca |
| Loja | El Cisne | 62.1 | 81.4 | 24 | 17 | (sin nombre) | Angel Polivio Vega Mora |
| Loja | Orianga | 153.2 | 146.2 | 24 | 13 | (sin nombre) | 14 de Septiembre |
| Catamayo | Catacocha | 57.5 | 41.9 | 11 | 2 | Avenida Catamayo | Universitaria |
| Cariamanga | Macará | 77.7 | 72.7 | 37 | 12 | Avenida Del Ejército | Juvenal Jaramillo |
| Macará | Zapotillo | 59.8 | 60.5 | 12 | 12 | Juvenal Jaramillo | Avenida Quito |

## Cómo leer la tabla

- La duración es la de un vehículo liviano por calles y carreteras. No incluye paradas, esperas ni horarios de las cooperativas.
- "Desvío" es la distancia entre la coordenada de la terminal y el punto de la vía más cercano usado por OSRM. Un desvío grande indica que la coordenada no cae sobre una calle.
