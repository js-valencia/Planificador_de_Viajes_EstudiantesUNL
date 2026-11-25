# Comparación bus y auto: rutas.json contra OSRM (issue #4)

- Bus: minutos entre paradas de `rutas.json`. En la cooperativa Loja son estimados; en la cooperativa Catamayo, verificados.
- Auto: duración calculada por OSRM (perfil `driving`) con datos de OpenStreetMap, sin paradas ni esperas.
- Razón = minutos de bus / minutos en auto. Mayor que 1 significa que el bus tarda más.

## Tramos comparados

| Ruta | Tramo | Bus (min) | Auto (min) | Distancia (km) | Razón bus/auto | Tiempo de bus |
| --- | --- | --- | --- | --- | --- | --- |
| LOJA-01 | Loja - Chaguarpamba | 150 | 99.7 | 98.9 | 1.50 | estimado |
| LOJA-01 | Loja - Machala | 360 | 195.6 | 226.9 | 1.84 | estimado |
| LOJA-02 | Loja - Zapotillo | 270 | 197.8 | 214.3 | 1.36 | estimado |
| LOJA-03 | Loja - Catacocha | 135 | 90.5 | 85.6 | 1.49 | estimado |
| LOJA-03 | Loja - Macará | 225 | 152.2 | 173.9 | 1.48 | estimado |
| LOJA-04 | Loja - Cariamanga | 135 | 115.6 | 98.1 | 1.17 | estimado |
| LOJA-04 | Loja - Macará | 240 | 152.2 | 173.9 | 1.58 | estimado |
| LOJA-04 | Cariamanga - Macará | 105 | 72.7 | 77.7 | 1.44 | estimado |
| LOJA-05 | Loja - Macará | 210 | 152.2 | 173.9 | 1.38 | estimado |
| LOJA-06 | Loja - Cariamanga | 135 | 115.6 | 98.1 | 1.17 | estimado |
| LOJA-06 | Loja - Sozoranga | 195 | 157.8 | 143.4 | 1.24 | estimado |
| LOJA-07 | Loja - Cariamanga | 135 | 115.6 | 98.1 | 1.17 | estimado |
| LOJA-08 | Loja - Cariamanga | 120 | 115.6 | 98.1 | 1.04 | estimado |
| LOJA-09 | Loja - Catacocha | 135 | 90.5 | 85.6 | 1.49 | estimado |
| LOJA-10 | Loja - Alamor | 210 | 168.9 | 181.1 | 1.24 | estimado |
| LOJA-11 | Loja - Amaluza | 270 | 156.2 | 132.4 | 1.73 | estimado |
| CATAMAYO-01 | Loja - Catamayo | 40 | 48.8 | 28.1 | 0.82 | verificado |
| CATAMAYO-02 | Loja - Cangonama | 150 | 105.9 | 94.0 | 1.42 | verificado |
| CATAMAYO-03 | Loja - Lauro Guerrero | 150 | 120.9 | 107.9 | 1.24 | verificado |
| CATAMAYO-04 | Loja - Casanga | 130 | 108.3 | 109.3 | 1.20 | verificado |
| CATAMAYO-05 | Loja - Quilanga | 122 | 106.9 | 87.1 | 1.14 | verificado |
| CATAMAYO-06A | Loja - Sacapalca | 130 | 111.6 | 88.0 | 1.16 | verificado |
| CATAMAYO-06B | Loja - Chagaimina | 111 | 110.6 | 91.9 | 1.00 | verificado |
| CATAMAYO-07 | Loja - El Cisne | 64 | 81.4 | 62.1 | 0.79 | verificado |
| CATAMAYO-08 | Loja - Chaguarpamba | 85 | 99.7 | 98.9 | 0.85 | verificado |
| CATAMAYO-09 | Loja - Orianga | 149 | 146.2 | 153.2 | 1.02 | verificado |
| CATAMAYO-10 | Loja - Catacocha | 110 | 90.5 | 85.6 | 1.22 | verificado |

## Resumen

| Tiempo de bus | Tramos | Mediana de la razón | Tramos donde el bus es más rápido que el auto |
| --- | --- | --- | --- |
| estimado | 16 | 1.41 | 0 |
| verificado | 11 | 1.14 | 3 |
