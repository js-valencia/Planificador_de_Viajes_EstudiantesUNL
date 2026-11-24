# App móvil — Planificador de Viajes UNL

Primera versión móvil construida con React Native y Expo para consultar el backend existente.

## Requisitos

- Node.js 20 o superior
- npm
- Expo Go en el teléfono, o Android Studio / emulador Android
- El backend Express ejecutándose

## Instalación

Desde la raíz del proyecto principal:

```bash
cd mobile-app
npm install
```

## Ejecutar el backend

En una terminal desde la raíz del repositorio:

```bash
npm start
```

El backend queda disponible en `http://localhost:3001`.

## Ejecutar la app

En otra terminal:

```bash
cd mobile-app
npm start
```

Escanea el código QR con Expo Go. También puedes ejecutar:

```bash
npm run android
npm run ios
npm run web
```

### Conexión desde teléfono físico

Android/iOS no pueden usar `localhost` para llegar a tu computadora. Descubre la IP local de tu equipo:

```bash
hostname -I
```

Luego inicia Expo indicando la URL del backend:

```bash
EXPO_PUBLIC_API_URL=http://TU_IP_LOCAL:3001 npm start
```

Ejemplo: `EXPO_PUBLIC_API_URL=http://192.168.1.20:3001 npm start`

El teléfono y la computadora deben estar en la misma red y el puerto `3001` debe estar permitido por el firewall.

## Funcionalidad

- Consulta terminales desde `/api/terminales`.
- Busca rutas con origen, destino, fecha, hora y criterio.
- Consume `/api/ruta`.
- Muestra carga, errores y ausencia de rutas.
- Presenta horarios, transbordos, duración, espera y mapa con marcadores y recorrido.
