 <div align="center">

# 🚌 Planificador de Viajes Estudiantes UNL

### App móvil para planificar rutas intercantonales

**Encuentra la mejor conexión. Optimiza tu tiempo. Llega a tu destino.**

Aplicación móvil para Android e iOS que ayuda a estudiantes de la Universidad Nacional de Loja a planificar viajes intercantonales. La app usa React Native y Expo; un backend Express calcula los itinerarios mediante estructuras de grafos y algoritmos de optimización.

![Estado](https://img.shields.io/badge/Estado-En%20desarrollo-orange?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-24.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-0.88-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Expo](https://img.shields.io/badge/Expo-58-000020?style=for-the-badge&logo=expo&logoColor=white)

[Descripción](#-descripción) · [Características](#-características) · [Tecnologías](#-tecnologías) · [Arquitectura](#️-arquitectura) · [Instalación](#-instalación-y-ejecución) · [API](#-api-rest)

</div>

---

## 📖 Descripción

Los estudiantes de la **Universidad Nacional de Loja (UNL)** necesitan desplazarse frecuentemente entre Loja y otros cantones de la provincia para asistir a clases o regresar a sus hogares.

La consulta de horarios publicados por distintas cooperativas puede dificultar la planificación de estos viajes, especialmente cuando es necesario combinar varios buses para llegar al destino.

El **Planificador de Viajes Estudiantes UNL** busca solucionar esta problemática mediante una app móvil para consultar terminales, encontrar itinerarios viables y ver el recorrido sobre un mapa. El backend centraliza los datos y realiza los cálculos de rutas.

### 🎯 Objetivo

Facilitar la planificación de viajes intercantonales mediante la generación de rutas viables, considerando los horarios de transporte, las conexiones disponibles y diferentes criterios de optimización.

## ✨ Características

### 🗺️ App móvil y visualización geográfica

- Aplicación para Android e iOS implementada con React Native y Expo.
- Mapa móvil implementado con `react-native-maps`.
- Marcadores para identificar el origen y destino.
- Representación gráfica de los itinerarios calculados.
- Visualización de los diferentes tramos del recorrido.
- Identificación de las cooperativas mediante colores diferenciados.

### 🚌 Planificación de itinerarios

- Selección del origen y destino.
- Consulta según fecha y hora de salida.
- Generación de posibles rutas.
- Visualización de horarios, tramos y tiempos de viaje.
- Validación de conexiones y transbordos.

### ⚡ Optimización de rutas

El usuario puede seleccionar diferentes criterios para encontrar un itinerario:

| Criterio | Descripción |
|---|---|
| ⏱️ Menor tiempo total | Prioriza el menor tiempo de viaje. |
| 💤 Menor tiempo de espera | Busca reducir las esperas entre conexiones. |
| 🚌 Menos conexiones | Prioriza los itinerarios con menos transbordos. |

### 🔎 Validación y experiencia de usuario

- Validación del formulario antes de realizar una búsqueda.
- Prevención de consultas con origen y destino iguales.
- Limpieza del mapa antes de mostrar un nuevo itinerario.
- Mensajes específicos cuando no existen rutas disponibles.
- Manejo de errores durante las solicitudes al servidor.

---

## 🗺️ Mapa interactivo

Uno de los componentes principales de la aplicación es la representación geográfica de los itinerarios.

La app móvil utiliza **React Native Maps** para mostrar terminales y dibujar el itinerario calculado.

Cuando el usuario consulta una ruta, el sistema obtiene el itinerario calculado por el backend y lo representa visualmente.

**Flujo de funcionamiento:**

1. Se cargan las terminales disponibles mediante `/api/terminales`.
2. El usuario selecciona el origen, destino y parámetros de búsqueda.
3. La app móvil realiza una petición HTTP mediante `fetch` al endpoint `/api/ruta`.
4. El backend procesa la consulta y devuelve el itinerario.
5. La app representa el recorrido en el mapa y muestra los tramos, horarios y tiempos.

---

## 🛠️ Tecnologías

| Tecnología | Utilización |
|---|---|
| JavaScript | Lenguaje principal del proyecto. |
| Node.js | Entorno de ejecución del backend. |
| Express | Backend y API REST. |
| React Native | Interfaz móvil multiplataforma. |
| Expo | Desarrollo y ejecución de la app en Android e iOS. |
| `react-native-maps` | Renderización del mapa y del recorrido. |
| Fetch API | Comunicación entre la app móvil y el backend. |
| Jest | Ejecución de pruebas automatizadas, si está configurado en el proyecto. |
| Git y GitHub | Control de versiones y colaboración. |

---

## 🏗️ Arquitectura

El proyecto utiliza una organización modular que separa las responsabilidades de cada componente para facilitar el mantenimiento, las pruebas y la evolución del sistema.

### 📂 Separación de responsabilidades

| Capa | Responsabilidad |
|---|---|
| **Datos** | Almacenamiento y acceso a la información de terminales y horarios. |
| **Dominio** | Estructuras de datos, grafos y lógica relacionada con la planificación. |
| **Servicios** | Coordinación de la lógica de planificación y procesamiento de las solicitudes. |
| **App móvil** | Interfaz React Native, visualización del mapa y comunicación con la API. |
| **API** | Endpoints Express para terminales y planificación de itinerarios. |

### 🔄 Flujo general del sistema

```text
              👨‍🎓 USUARIO
                   |
                   v
       +------------------------+
     |      APP MÓVIL        |
       |                        |
     | React Native + Expo    |
       |                        |
     |  react-native-maps      |
       +-----------+------------+
                   |
              Fetch API
                   |
                   v
       +------------------------+
       |       BACKEND          |
       |                        |
       |     Node.js + Express  |
       +-----------+------------+
                   |
                   v
       +------------------------+
       |       SERVICIOS        |
       |                        |
       |  planificadorService   |
       +-----------+------------+
                   |
                   v
       +------------------------+
       |        DOMINIO         |
       |                        |
       |  Grafos y algoritmos   |
       |  Validación de rutas   |
       +-----------+------------+
                   |
                   v
       +------------------------+
       |         DATOS          |
       |                        |
      |  rutas.json            |
      |  terminales.json       |
       +------------------------+
```

*Diagrama conceptual de la separación de responsabilidades.*

### 📁 Archivos principales

| Archivo | Descripción |
|---|---|
| `mobile-app/App.tsx` | Pantalla móvil de búsqueda, resultados y mapa. |
| `mobile-app/src/api.ts` | Comunicación de la app con el backend. |
| `servidor.js` | Inicialización del servidor Express y exposición de los endpoints. |
| `planificadorService.js` | Servicio encargado de coordinar la planificación de itinerarios. |
| `rutas.json` | Rutas y horarios base usados para generar frecuencias. |
| `terminales.json` | Información de las terminales utilizadas por el sistema. |
| `smoke.test.js` | Prueba de humo para verificar componentes fundamentales del sistema. |

---

## 🧠 Algoritmos y estructuras de datos

La planificación de viajes utiliza estructuras de grafos y algoritmos para representar las conexiones entre los servicios de transporte y calcular itinerarios.

### 🕸️ Grafo de horarios

Permite representar los eventos de salida y llegada, junto con las conexiones y tiempos asociados a los recorridos.

### 🔗 Ordenamiento topológico

Permite procesar las dependencias de un grafo dirigido acíclico, respetando el orden de los eventos.

### ⚡ Floyd-Warshall

Algoritmo de caminos mínimos utilizado para calcular los tiempos mínimos entre pares de nodos, según la representación y ponderación del grafo.

### ↔️ Lista doblemente enlazada

Cada ruta enlaza sus paradas con referencias al nodo anterior y siguiente durante la generación de frecuencias. El recorrido hacia adelante conserva el sentido publicado del bus; el enlace hacia atrás permite recorrer la estructura, pero no representa por sí solo un horario de regreso. Los cantones y nombres de ruta de [rutas.json](src/main/data/rutas.json) también se propagan a los tramos del itinerario. La estructura está implementada en [ListaDobleEnlazada.js](src/main/domain/datos/ListaDobleEnlazada.js).

### 🕒 Validación temporal

El sistema considera los horarios de llegada y salida para comprobar que los transbordos sean posibles y que los itinerarios respeten las restricciones temporales.

---

## 🚀 Instalación y ejecución

### 📋 Requisitos previos

- Node.js compatible con el proyecto.
- npm.
- Git.

### 1. Clonar el repositorio

```bash
git clone https://github.com/js-valencia/Planificador_de_Viajes_EstudiantesUNL.git
```

### 2. Acceder al directorio

```bash
cd Planificador_de_Viajes_EstudiantesUNL
```

### 3. Cambiar a la rama de desarrollo

```bash
git switch feature/start-proyect
```

### 4. Instalar dependencias

```bash
npm install
```

### 5. Instalar e iniciar la app móvil

```bash
npm run mobile:install
npm start
```

Abre el proyecto con Expo Go o con un emulador Android/iOS. `npm start` inicia Expo; el backend se ejecuta por separado.

En una segunda terminal, desde la raíz:

```bash
npm run api
```

La API queda disponible en `http://localhost:3001`.

Para un teléfono físico, averigua la IP local de tu computadora con `hostname -I` y usa esa IP en la URL de la API:

```bash
EXPO_PUBLIC_API_URL=http://TU_IP_LOCAL:3001 npm start
```

El teléfono y la computadora deben estar en la misma red.

Para iniciar Expo directamente en Android o iOS, usa `npm run mobile:android` o `npm run mobile:ios`.

### 🔄 Desarrollo

```bash
npm run dev
```

En otra terminal, `npm run api:dev` inicia el backend con recarga al cambiar archivos.

### 💻 Demostración por consola

```bash
npm run demo
```

Este comando ejecuta la demostración de planificación directamente en la terminal.

---

## 📜 Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm start` | Inicia Expo para la app móvil. |
| `npm run dev` | Inicia Expo en modo desarrollo. |
| `npm run mobile:install` | Instala dependencias de la app móvil. |
| `npm run mobile:android` | Inicia Expo para Android. |
| `npm run mobile:ios` | Inicia Expo para iOS. |
| `npm run mobile:lint` | Ejecuta ESLint en la app móvil. |
| `npm run mobile:typecheck` | Comprueba los tipos de TypeScript de la app. |
| `npm run api` | Inicia el backend Express en el puerto 3001. |
| `npm run api:dev` | Inicia el backend con vigilancia de cambios. |
| `npm run demo` | Ejecuta la demostración por consola. |

La configuración de los comandos se encuentra en `package.json`.

---

## 🌐 API REST

El servidor Express expone endpoints para consultar información de terminales y planificar itinerarios.

### 📍 Obtener terminales

```http
GET /api/terminales
```

Permite obtener las terminales disponibles para realizar consultas.

### 🗺️ Consultar itinerarios

```http
GET /api/ruta?origen=...&destino=...&desde=...&criterio=...
```

**Parámetros:**

| Parámetro | Descripción |
|---|---|
| `origen` | Terminal o localidad de partida. |
| `destino` | Terminal o localidad de llegada. |
| `desde` | Fecha y hora de salida. |
| `criterio` | Criterio de optimización seleccionado. |

### Ejemplo de petición

```bash
curl "http://localhost:3001/api/ruta?origen=Catamayo&destino=Cariamanga&desde=2026-11-02T06:30:00-05:00&criterio=tiempo"
```

---

## 🧪 Pruebas

El proyecto incorpora una prueba de humo denominada `smoke.test.js`, orientada a verificar el funcionamiento básico de los componentes fundamentales de la planificación.

### Verificaciones realizadas

- [x] Carga de terminales.
- [x] Construcción del grafo.
- [x] Encontrar una ruta válida.

Estas comprobaciones permiten detectar fallos básicos en la carga de información y en la generación de itinerarios.

Para ejecutar las pruebas automatizadas, utiliza el comando configurado en el `package.json` correspondiente.

---

## 🎯 Alcance del proyecto

La primera etapa del sistema se concentra en una solución delimitada para evaluar su funcionamiento.

| Aspecto | Alcance |
|---|---|
| 🎓 Público objetivo | Estudiantes de la Universidad Nacional de Loja. |
| 📍 Punto de partida | Terminal Terrestre Reina del Cisne, Loja. |
| 🚌 Cooperativas | Loja y Catamayo. |
| 📱 Plataforma | Aplicación móvil para Android e iOS con Expo. |
| 🗺️ Visualización | Mapa con `react-native-maps`. |
| ⚙️ Procesamiento | Node.js y Express. |
| 📂 Datos | Archivos JSON. |

---

## 🗺️ Estado del proyecto

El proyecto se encuentra en desarrollo continuo.

- [x] Definición del problema y objetivos.
- [x] Configuración inicial del proyecto Node.js.
- [x] Implementación del servidor Express.
- [x] Organización modular del backend.
- [x] Servicio de planificación de itinerarios.
- [x] Primera versión de la app React Native con Expo.
- [x] Mapa móvil y comunicación con el backend mediante Fetch API.
- [x] Validaciones del formulario de búsqueda.
- [x] Visualización geográfica de los itinerarios.
- [x] Incorporación de prueba de humo.
- [ ] Ampliación de las pruebas automatizadas.
- [ ] Validación integral con horarios reales de transporte.
- [ ] Evaluación del rendimiento de las consultas.

*El estado debe actualizarse conforme se verifique la implementación de nuevas funcionalidades.*

---

## 👥 Equipo de desarrollo

**Universidad Nacional de Loja**

Proyecto académico orientado a la aplicación de estructuras de datos, algoritmos y tecnologías móviles para resolver una problemática de movilidad de la comunidad universitaria.

---

<div align="center">

### 🚌 Menos incertidumbre. Mejores conexiones. Más tiempo para estudiar.

**Planificador de Viajes Estudiantes UNL**

Desarrollado con 💙 para la comunidad universitaria.

</div>

@freezetag