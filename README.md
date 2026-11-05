 <div align="center">

# 🚌 Planificador de Viajes Estudiantes UNL

### Planificación inteligente de rutas intercantonales

**Encuentra la mejor conexión. Optimiza tu tiempo. Llega a tu destino.**

Aplicación web para la planificación de viajes intercantonales de los estudiantes de la Universidad Nacional de Loja, mediante estructuras de grafos, algoritmos de optimización y visualización geográfica interactiva.

![Estado](https://img.shields.io/badge/Estado-En%20desarrollo-orange?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-24.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white)
![Vue.js](https://img.shields.io/badge/Vue.js-3-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-Maps-199900?style=for-the-badge&logo=leaflet&logoColor=white)

[Descripción](#-descripción) · [Características](#-características) · [Tecnologías](#-tecnologías) · [Arquitectura](#️-arquitectura) · [Instalación](#-instalación-y-ejecución) · [API](#-api-rest)

</div>

---

## 📖 Descripción

Los estudiantes de la **Universidad Nacional de Loja (UNL)** necesitan desplazarse frecuentemente entre Loja y otros cantones de la provincia para asistir a clases o regresar a sus hogares.

La consulta de horarios publicados por distintas cooperativas puede dificultar la planificación de estos viajes, especialmente cuando es necesario combinar varios buses para llegar al destino.

El **Planificador de Viajes Estudiantes UNL** busca solucionar esta problemática mediante una aplicación web que centraliza la información de transporte, calcula itinerarios viables y permite visualizar las rutas obtenidas sobre un mapa interactivo.

### 🎯 Objetivo

Facilitar la planificación de viajes intercantonales mediante la generación de rutas viables, considerando los horarios de transporte, las conexiones disponibles y diferentes criterios de optimización.

## ✨ Características

### 🗺️ Visualización geográfica interactiva

- Mapa interactivo implementado con Leaflet.
- OpenStreetMap como proveedor de mapas base.
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

El frontend utiliza **Leaflet** para renderizar el mapa y **OpenStreetMap** como fuente de los mapas base.

Cuando el usuario consulta una ruta, el sistema obtiene el itinerario calculado por el backend y lo representa visualmente.

**Flujo de funcionamiento:**

1. Se cargan las terminales disponibles mediante `/api/terminales`.
2. El usuario selecciona el origen, destino y parámetros de búsqueda.
3. El frontend realiza una petición HTTP mediante `fetch` al endpoint `/api/ruta`.
4. El backend procesa la consulta y devuelve el itinerario.
5. El frontend representa el recorrido en el mapa, mostrando los tramos, tiempos, marcadores y colores por cooperativa.

---

## 🛠️ Tecnologías

| Tecnología | Utilización |
|---|---|
| JavaScript | Lenguaje principal del proyecto. |
| Node.js | Entorno de ejecución del backend. |
| Express | Servidor web y API REST. |
| Vue 3 | Gestión de la interfaz y estado del frontend mediante CDN. |
| Leaflet | Renderización y visualización del mapa interactivo. |
| OpenStreetMap | Datos cartográficos para el mapa base. |
| Fetch API | Comunicación entre frontend y backend. |
| HTML5 | Estructura de la interfaz web. |
| CSS3 | Estilos de la aplicación. |
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
| **Vista** | Interfaz web, visualización del mapa y comunicación con la API. |

### 🔄 Flujo general del sistema

```text
              👨‍🎓 USUARIO
                   |
                   v
       +------------------------+
       |       FRONTEND         |
       |                        |
       |  HTML + Vue 3 + CSS    |
       |                        |
       |  Leaflet + OpenStreetMap|
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
       |  terminales.json       |
       |  horarios.json         |
       +------------------------+
```

*Diagrama conceptual de la separación de responsabilidades.*

### 📁 Archivos principales

| Archivo | Descripción |
|---|---|
| `servidor.js` | Inicialización del servidor Express y exposición de los endpoints. |
| `planificadorService.js` | Servicio encargado de coordinar la planificación de itinerarios. |
| `terminales.json` | Información de las terminales utilizadas por el sistema. |
| `index.html` | Interfaz web, interacción con el usuario y visualización del mapa. |
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

### 5. Iniciar la aplicación

```bash
npm start
```

Abre la aplicación desde:

**http://localhost:3000**

### 🔄 Modo de desarrollo

```bash
npm run dev
```

### 💻 Demostración por consola

```bash
npm run demo
```

Este comando ejecuta la demostración de planificación directamente en la terminal.

---

## 📜 Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm start` | Inicia el servidor web. |
| `npm run dev` | Inicia el servidor con vigilancia de cambios. |
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
curl "http://localhost:3000/api/ruta?origen=Catamayo&destino=Cariamanga&desde=2026-11-02T06:30:00-05:00&criterio=tiempo"
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
| 🌐 Plataforma | Aplicación web. |
| 🗺️ Visualización | Mapa interactivo con Leaflet y OpenStreetMap. |
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
- [x] Integración de Vue 3 en la interfaz.
- [x] Integración de Leaflet y OpenStreetMap.
- [x] Comunicación entre frontend y backend mediante Fetch API.
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

Proyecto académico orientado a la aplicación de estructuras de datos, algoritmos y tecnologías web para resolver una problemática de movilidad de la comunidad universitaria.

---

<div align="center">

### 🚌 Menos incertidumbre. Mejores conexiones. Más tiempo para estudiar.

**Planificador de Viajes Estudiantes UNL**

Desarrollado con 💙 para la comunidad universitaria.

</div>