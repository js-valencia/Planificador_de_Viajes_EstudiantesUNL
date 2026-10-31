<div align="center">

# 🚌 Planificador de Viajes Estudiantes UNL

### 📍 Planificación inteligente de rutas intercantonales

**Encuentra la mejor conexión. Reduce las esperas. Llega a tu destino.**

Aplicación web desarrollada para facilitar la planificación de viajes intercantonales de los estudiantes de la Universidad Nacional de Loja, mediante grafos, ordenamiento topológico y algoritmos de búsqueda de caminos mínimos.

<br>

![Estado](https://img.shields.io/badge/Estado-En%20desarrollo-orange?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-24.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/Licencia-Por%20definir-lightgrey?style=for-the-badge)

<br>

[📖 Descripción](#-descripción) ·
[✨ Características](#-características) ·
[🛠️ Tecnologías](#️-tecnologías) ·
[🏗️ Arquitectura](#️-arquitectura-del-proyecto) ·
[🚀 Instalación](#-instalación-y-ejecución) ·
[🌐 API](#-api-rest) ·
[🧠 Algoritmos](#-algoritmos-y-planificación)

</div>

---

## 📖 Descripción

Los estudiantes de la **Universidad Nacional de Loja (UNL)** necesitan desplazarse frecuentemente entre Loja y otros cantones de la provincia para asistir a clases o regresar a sus hogares.

La consulta de horarios publicados por diferentes cooperativas puede dificultar la planificación de estos viajes, especialmente cuando es necesario combinar varios buses para llegar al destino.

El **Planificador de Viajes Estudiantes UNL** propone una solución mediante una aplicación web que centraliza la consulta de rutas y permite calcular itinerarios considerando los horarios de salida, las conexiones disponibles y los tiempos de espera.

### 🎯 Objetivo

Facilitar la planificación de viajes intercantonales mediante la generación de rutas viables y la selección de itinerarios según diferentes criterios de optimización.

### 💡 ¿Qué problema resuelve?

| Problema | Solución |
|:--|:--|
| 🗂️ Horarios dispersos | Consulta centralizada de la información de transporte. |
| 🔄 Transbordos incompatibles | Validación de las conexiones entre los servicios. |
| ⏳ Esperas prolongadas | Comparación de itinerarios según los tiempos de espera. |
| 🧭 Dificultad para comparar rutas | Cálculo de alternativas según el criterio seleccionado. |
| 🌙 Viajes que cruzan la medianoche | Manejo de fechas y horas para mantener la coherencia temporal. |

---

## ✨ Características

### 🗺️ Planificación de viajes

- Selección del origen y destino.
- Consulta a partir de una fecha y hora de salida.
- Generación de posibles itinerarios.
- Visualización de las rutas calculadas.
- Identificación de conexiones no disponibles o incompatibles.

### ⚡ Optimización de itinerarios

El sistema contempla tres criterios para seleccionar una ruta:

| Criterio | Descripción |
|:--|:--|
| ⏱️ **Menor tiempo total** | Prioriza el menor tiempo transcurrido hasta llegar al destino. |
| 💤 **Menor tiempo de espera** | Busca reducir el tiempo acumulado entre conexiones. |
| 🚌 **Menos conexiones** | Prioriza los itinerarios con menos transbordos. |

### 🔗 Validación de transbordos

El sistema considera los horarios de llegada y salida para comprobar que las conexiones entre buses sean temporalmente posibles.

### 🌐 Aplicación web

- Interfaz web accesible desde el navegador.
- Servidor Express para entregar la página y atender las solicitudes de la API.
- Consulta de información mediante endpoints HTTP.
- Ejecución de una demostración alternativa desde la terminal.

---

## 🛠️ Tecnologías

Las siguientes tecnologías forman parte del entorno de desarrollo del proyecto.

<div align="center">

| Tecnología | Utilización |
|:--|:--|
| ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black) **JavaScript** | Lenguaje principal de programación. |
| ![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white) **Node.js** | Entorno de ejecución. |
| ![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white) **Express** | Servidor web y API REST. |
| ![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white) **HTML5** | Estructura de la interfaz. |
| ![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white) **CSS3** | Presentación y estilos. |
| ![Vue.js](https://img.shields.io/badge/Vue.js-4FC08D?logo=vuedotjs&logoColor=white) **Vue.js** | Interactividad mediante CDN. |
| ![Git](https://img.shields.io/badge/Git-F05032?logo=git&logoColor=white) **Git** | Control de versiones. |
| ![GitHub](https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=white) **GitHub** | Alojamiento y colaboración. |

</div>

---

## 🏗️ Arquitectura del proyecto

La aplicación utiliza una estructura basada en módulos JavaScript, separando los algoritmos de planificación de la capa web.

```text
Planificador_de_Viajes_EstudiantesUNL/
│
├── 📄 package.json
├── 📄 package-lock.json
├── 📄 .gitignore
├── 📄 README.md
│
└── 📂 src/
    │
    └── 📂 main/
        │
        ├── 📂 js/
        │   │
        │   ├── 📂 algorithms/
        │   │   ├── 📄 GrafoHorarios.js
        │   │   ├── 📄 floydWarshall.js
        │   │   └── 📄 ordenTopologico.js
        │   │
        │   ├── 📂 model/
        │   │   ├── 📄 horarios.json
        │   │   └── 📄 planificador.js
        │   │
        │   └── 📄 index.js
        │
        └── 📂 view/
            ├── 📄 index.html
            └── 📄 servidor.js
```

### 📂 Organización de los módulos

| Directorio o archivo | Responsabilidad |
|:--|:--|
| `algorithms/` | Contiene los módulos para trabajar con grafos, caminos mínimos y ordenamiento topológico. |
| `GrafoHorarios.js` | Representación y gestión del grafo de horarios. |
| `floydWarshall.js` | Algoritmo de Floyd-Warshall para caminos mínimos. |
| `ordenTopologico.js` | Operaciones relacionadas con el ordenamiento topológico. |
| `model/` | Información de horarios y lógica de planificación. |
| `horarios.json` | Datos de horarios utilizados por la aplicación. |
| `planificador.js` | Módulo de planificación de itinerarios. |
| `view/index.html` | Interfaz web de la aplicación. |
| `view/servidor.js` | Servidor Express y endpoints de la API. |
| `js/index.js` | Punto de entrada de la demostración de consola. |

> **Nota:** el árbol anterior representa la estructura documentada del proyecto. Los archivos adicionales pueden incorporarse a medida que evolucione el desarrollo.

---

## 🧠 Algoritmos y planificación

Uno de los componentes centrales del proyecto es el uso de estructuras de datos y algoritmos para representar y analizar las conexiones entre servicios de transporte.

### 1. 🕸️ Grafo de horarios

El sistema representa las conexiones entre eventos de transporte mediante un grafo. Los nodos representan eventos de salida o llegada y las aristas representan relaciones temporales o trayectos con pesos asociados.

Esta representación permite analizar las conexiones entre diferentes terminales y evaluar la viabilidad de los transbordos.

### 2. 🔗 Ordenamiento topológico

Permite establecer un orden compatible con las dependencias de un grafo dirigido acíclico.

En el contexto del proyecto, se relaciona con la organización temporal de los eventos de transporte.

### 3. ⚡ Floyd-Warshall

Algoritmo utilizado para calcular caminos mínimos entre pares de nodos de un grafo ponderado.

Su utilización permite evaluar alternativas y determinar tiempos mínimos según la representación y los pesos definidos en el sistema.

### 4. 🕒 Validación temporal

La planificación considera la fecha y hora de salida, los tiempos de viaje y las conexiones disponibles para evitar itinerarios incompatibles.

Esto es especialmente importante cuando un viaje continúa después de la medianoche.

---

## 🚀 Instalación y ejecución

### 📋 Requisitos previos

Antes de comenzar, asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) compatible con el proyecto.
- npm, incluido con Node.js.
- [Git](https://git-scm.com/).

### 1. Clonar el repositorio

```bash
git clone https://github.com/js-valencia/Planificador_de_Viajes_EstudiantesUNL.git
```

### 2. Acceder al proyecto

```bash
cd Planificador_de_Viajes_EstudiantesUNL
```

### 3. Cambiar a la rama de desarrollo

Si deseas trabajar específicamente con la rama inicial del proyecto:

```bash
git switch feature/start-proyect
```

### 4. Instalar las dependencias

```bash
npm install
```

Este comando instala las dependencias declaradas en `package.json`.

### 5. Iniciar la aplicación web

```bash
npm start
```

Una vez iniciado el servidor, abre el siguiente enlace en tu navegador:

**🌐 http://localhost:3000**

### 🔄 Modo de desarrollo

Para iniciar el servidor con vigilancia de cambios:

```bash
npm run dev
```

### 💻 Demostración por consola

Para ejecutar la demostración de planificación desde la terminal:

```bash
npm run demo
```

Este comando ejecuta el punto de entrada de consola definido en el proyecto.

---

## 📜 Scripts disponibles

Los siguientes comandos corresponden a los scripts definidos en el `package.json` del proyecto.

| Comando | Descripción |
|:--|:--|
| `npm start` | Inicia el servidor web. |
| `npm run dev` | Ejecuta el servidor con vigilancia de cambios. |
| `npm run demo` | Ejecuta la demostración de consola. |

La configuración de estos scripts se encuentra en `package.json`.

---

## 🌐 API REST

El servidor Express expone endpoints para consultar información relacionada con las terminales y la planificación de rutas.

### 📍 Consultar terminales

```http
GET /api/terminales
```

Permite obtener la información de las terminales disponibles en el sistema.

### 🗺️ Consultar una ruta

```http
GET /api/ruta?origen=...&destino=...&desde=...&criterio=...
```

**Parámetros de consulta:**

| Parámetro | Descripción |
|:--|:--|
| `origen` | Terminal o localidad de partida. |
| `destino` | Terminal o localidad de llegada. |
| `desde` | Fecha y hora desde la que se planifica el viaje. |
| `criterio` | Criterio de optimización solicitado. |

### 💡 Ejemplo de consulta

Con el servidor en ejecución, puedes probar una petición desde la terminal:

```bash
curl "http://localhost:3000/api/ruta?origen=Catamayo&destino=Cariamanga&desde=2026-11-02T06:30:00-05:00&criterio=tiempo"
```

> Los nombres de los parámetros y los valores aceptados deben coincidir con los definidos por la implementación actual de la API.

---

## 🧪 Pruebas

Las pruebas permiten verificar el comportamiento de los módulos y detectar errores en la planificación de itinerarios.

Antes de ejecutar pruebas automatizadas, comprueba si existe un script `test` en `package.json`.

Si está configurado, podrás ejecutar:

```bash
npm test
```

Si el proyecto no cuenta con este script, será necesario configurar primero el entorno de pruebas correspondiente.

---

## 🎯 Alcance del proyecto

La primera etapa del proyecto se concentra en una solución delimitada para evaluar su funcionamiento antes de ampliar sus capacidades.

| Aspecto | Descripción |
|:--|:--|
| 🎓 Público objetivo | Estudiantes de la Universidad Nacional de Loja. |
| 📍 Punto de partida | Terminal Terrestre Reina del Cisne, Loja. |
| 🚌 Cooperativas consideradas | Loja y Catamayo. |
| 🌐 Plataforma | Aplicación web. |
| 🧭 Función principal | Consulta y planificación de rutas intercantonales. |
| ⚙️ Enfoque técnico | Grafos y algoritmos de optimización. |
| 📂 Datos de horarios | Archivo JSON. |

---

## 🗺️ Estado del proyecto

El proyecto se encuentra en desarrollo. La siguiente lista permite visualizar las etapas previstas para su evolución.

- [x] Definición del problema y del objetivo general.
- [x] Organización inicial del proyecto.
- [x] Configuración del servidor Express.
- [x] Incorporación de módulos para los algoritmos de planificación.
- [ ] Verificación integral de los criterios de optimización.
- [ ] Validación de itinerarios con diferentes horarios.
- [ ] Ampliación de las pruebas automatizadas.
- [ ] Evaluación del funcionamiento con datos de transporte.

*Actualiza las casillas de acuerdo con las funcionalidades que estén implementadas y verificadas en el repositorio.*

---

## 👥 Equipo de desarrollo

**Universidad Nacional de Loja**  
Proyecto académico orientado a la aplicación de estructuras de datos, algoritmos y desarrollo web para la planificación de viajes intercantonales.

> Completa esta sección con los nombres de los integrantes y sus responsabilidades para reconocer las contribuciones del equipo.

---

<div align="center">

### 🚌 Menos incertidumbre. Mejores conexiones. Más tiempo para estudiar.

**Planificador de Viajes Estudiantes UNL**

Desarrollado con 💙 para la comunidad universitaria.

<br>

⭐ Si el proyecto te resulta interesante, ¡explora el repositorio y conoce su implementación!

</div>