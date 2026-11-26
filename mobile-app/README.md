# App móvil — Planificador de Viajes UNL

App React Native + Expo (SDK 58, React Native 0.88) que consulta el backend Express del repositorio.

## Requisitos

- Node.js 22.13 o superior y npm.
- **Expo Go para SDK 58** en el teléfono (ver más abajo), o un emulador Android.
- El backend Express ejecutándose y accesible desde el teléfono.

## Instalación

```bash
cd mobile-app
npm install
npx expo install --check   # confirma que las versiones coinciden con el SDK 58
```

## 1. Ejecutar el backend

En una terminal, desde la raíz del repositorio:

```bash
npm install
npm run api
```

Al iniciar, el servidor muestra las URL a las que debe llegar el teléfono, por ejemplo
`Desde el teléfono (misma red): http://192.168.16.24:3001`. Abre esa URL + `/api/health`
**en el navegador del teléfono**: si no responde `{"ok":true}`, la app tampoco podrá conectarse
(revisa que estén en la misma red Wi-Fi y que el firewall permita el puerto 3001, por ejemplo
`sudo ufw allow 3001/tcp`).

## 2. Ejecutar la app con Expo Go

```bash
cd mobile-app
npm start
```

Escanea el QR con Expo Go. La app detecta sola la IP de la computadora que ejecuta Expo y usa
`http://ESA_IP:3001`; no necesitas `.env`. En la consola de Metro verás
`[api] Backend: http://... (origen: expo-host)`.

### Expo Go y el SDK 58

Expo Go solo abre proyectos de **su** versión de SDK. Este proyecto usa el SDK 58 (publicado el
15/10/2026) y la versión de Expo Go de la tienda tardó semanas en actualizarse. Si al escanear
aparece *"Project is incompatible with this version of Expo Go"*:

1. Revisa en Expo Go → *Settings* qué SDK soporta.
2. Si no es 58, instala la versión correcta: con el teléfono conectado por USB (depuración USB activa),
   ejecuta `npm start` y pulsa `a`; Expo CLI instala el Expo Go que corresponde. También puedes
   descargarla desde <https://expo.dev/go> eligiendo *SDK 58*.

### Cuándo usar `EXPO_PUBLIC_API_URL`

Solo si el backend corre en otra máquina, si usas `npx expo start --tunnel` (el túnel solo
transporta Metro, no el puerto 3001) o si la IP detectada no es la correcta:

```bash
EXPO_PUBLIC_API_URL=http://TU_IP_LOCAL:3001 npm start
```

Si la defines en un archivo `.env`, **tiene prioridad** sobre la detección automática; mantenla
actualizada cuando cambie tu red. `.env.example` la deja comentada a propósito.

## 3. Generar el APK

Perfiles de `eas.json`:

| Perfil | Resultado | Backend |
|---|---|---|
| `preview` | APK autónomo para instalar directamente | `EXPO_PUBLIC_API_URL` de `eas.json` (IP local `192.168.16.24`) |
| `production` | AAB para Play Store (no se instala directamente) | Debe definirse en el entorno `production` de EAS (HTTPS) |
| `development` | Development build (necesita `expo-dev-client` + Metro) | IP local |

```bash
cd mobile-app
npx eas-cli@latest build --platform android --profile preview
```

Antes de compilar `preview`:

1. Cambia `EXPO_PUBLIC_API_URL` en `eas.json` por la IP actual de tu computadora (la que imprime `npm run api`).
   La URL se incrusta en el APK al compilar: si cambia tu IP, hay que recompilar.
2. Configura la clave de Google Maps (ver abajo). Sin ella el APK abre y funciona, pero en lugar del
   mapa muestra un aviso: Google Maps cierra la app en Android si no encuentra la clave.
3. Al usar el APK, el backend debe estar encendido y el teléfono en la misma red.

`app.config.js` valida la configuración **en el servidor de EAS** y detiene el build con un mensaje
claro si:

- el perfil `development` se compila sin `expo-dev-client` (ese APK abriría en "Unable to load script");
- `preview` o `production` no tienen `EXPO_PUBLIC_API_URL`.

El cliente de desarrollo ya está incluido en las dependencias. Inicia Metro con `npx expo start --dev-client --lan`
y deja ese proceso activo mientras pruebas el APK; el teléfono debe estar en la misma red Wi-Fi que la computadora.

### Clave de Google Maps

En Google Cloud habilita *Maps SDK for Android* y crea una clave restringida al paquete
`com.js_valencia.planificadorviajesunl` y a la huella SHA-1 del keystore de EAS
(`npx eas-cli@latest credentials`). Regístrala en EAS para cada entorno que compiles:

```bash
npx eas-cli@latest env:create --name GOOGLE_MAPS_API_KEY --value TU_CLAVE --environment preview --visibility sensitive
```

Expo Go ya trae su propia clave; no hace falta para desarrollar.

### Producción

Un APK para usuarios reales no puede depender de la IP de tu computadora. Despliega el backend
(raíz del repo, comando `node src/main/view/servidor.js`, usa la variable `PORT`) en un servicio con
HTTPS y registra la URL:

```bash
npx eas-cli@latest env:create --name EXPO_PUBLIC_API_URL --value https://TU_API_PUBLICA --environment production --visibility plaintext
npx eas-cli@latest build --platform android --profile production
```

Para un APK instalable apuntando a esa API, usa `preview` con la URL pública en `eas.json`.

## Comprobaciones

```bash
npm run typecheck   # TypeScript
npm run lint        # ESLint
npm test            # URL de la API, fechas y cliente HTTP contra el backend real
npx expo-doctor     # dependencias y configuración (requiere internet)
```

## Estructura

| Archivo | Responsabilidad |
|---|---|
| `App.tsx` | Pantalla: formulario, resultados y mapa |
| `src/api.ts` | Punto de entrada de la API para la app (resuelve la URL e instancia el cliente) |
| `src/apiUrl.ts` | Decide la URL del backend según el entorno (función pura, con pruebas) |
| `src/http.ts` | Cliente HTTP: timeout, errores tipados y validación de respuestas |
| `src/fechas.ts` | Fechas y horas en hora de Ecuador (UTC-5), independientes de la zona del teléfono |
| `app.config.js` | HTTP en Android/iOS, clave de Maps y validaciones de build |
| `plugins/withAndroidCleartextTraffic.js` | Activa HTTP sin cifrar solo si la API usa `http://` |

## Solución de problemas

| Síntoma | Causa | Solución |
|---|---|---|
| Expo Go: *incompatible with this version* | Expo Go no es de SDK 58 | Instala Expo Go SDK 58 (ver arriba) |
| *No se pudo conectar con http://…:3001* | Backend apagado, otra red o firewall | `npm run api`, prueba `/api/health` desde el navegador del teléfono |
| *Expo se inició con --tunnel…* | El túnel no expone el puerto 3001 | Usa `EXPO_PUBLIC_API_URL` o inicia sin `--tunnel` |
| APK: *Unable to load script* | Se instaló el perfil `development` sin dev client | Usa `preview` o instala `expo-dev-client` |
| APK: *no tiene configurada la URL del backend* | Build sin `EXPO_PUBLIC_API_URL` | Defínela en `eas.json`/EAS y recompila |
| APK: *Mapa no disponible* | Build sin `GOOGLE_MAPS_API_KEY` | Configura la clave en EAS y recompila |
| Casi todas las consultas: *No existe una conexión válida* | Los datos solo tienen viajes de ida desde Loja y ninguno de Catamayo | Completar `src/main/data/rutas.json` |

## Funcionalidad

- Consulta terminales desde `/api/terminales` (con botón *Reintentar* si falla).
- Busca rutas con origen, destino, fecha, hora y criterio (validados antes de enviar).
- Consume `/api/ruta` y muestra horarios en hora de Ecuador, transbordos, duración y espera.
- Mapa con marcadores y recorrido (`react-native-maps`).
