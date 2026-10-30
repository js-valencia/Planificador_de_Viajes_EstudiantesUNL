<div align="center">

# 🚌 Planificador de Viajes Intercantonales

### 🎓 Universidad Nacional de Loja · UNL

**Encuentra la mejor conexión. Optimiza tu tiempo. Llega a tu destino.**

Una plataforma web diseñada para ayudar a los estudiantes universitarios a planificar sus viajes intercantonales desde la Terminal Terrestre Reina del Cisne, mediante la consulta centralizada de horarios y la optimización de rutas y transbordos.

<br>

![Estado del proyecto](https://img.shields.io/badge/Estado-En%20desarrollo-orange?style=for-the-badge)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-24.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Vue.js](https://img.shields.io/badge/Vue.js-3.5-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white)

<br>

[📖 Descripción](#-descripción) ·
[✨ Características](#-características-principales) ·
[⚙️ Tecnologías](#️-tecnologías) ·
[🧠 Algoritmos](#-planificación-y-optimización) ·
[🚀 Instalación](#-instalación) ·
[🎯 Alcance](#-alcance-del-proyecto)

</div>

---

## 📖 Descripción

Los estudiantes de la **Universidad Nacional de Loja** necesitan desplazarse frecuentemente entre Loja y otros cantones de la provincia para asistir a clases o regresar a sus hogares.

Sin embargo, consultar los horarios publicados por distintas cooperativas puede dificultar la planificación de un viaje. Cuando no existe una conexión directa, el estudiante debe combinar varios buses y comprobar que los tiempos de llegada y salida permitan realizar los transbordos.

El **Planificador de Viajes Intercantonales** nace para solucionar esta problemática mediante una plataforma web que centraliza la información de transporte y calcula itinerarios viables de acuerdo con las preferencias del usuario.

### 🎯 Objetivo

Diseñar una plataforma web que permita consultar y optimizar itinerarios intercantonales, considerando los horarios de salida, los tiempos de viaje, las esperas y las conexiones entre cooperativas.

### 💡 ¿Qué problema resolvemos?

| Problema | Solución propuesta |
|---|---|
| 🗂️ Horarios dispersos | Centralización de las frecuencias de transporte. |
| 🔄 Transbordos inviables | Validación de los horarios y tiempos mínimos de conexión. |
| ⏳ Esperas innecesarias | Comparación de itinerarios para reducir los tiempos de espera. |
| 🧭 Dificultad para comparar rutas | Generación de alternativas según distintos criterios de optimización. |
| 🌙 Viajes que cruzan la medianoche | Gestión de fechas y horas completas para mantener la coherencia de los itinerarios. |

---

## ✨ Características principales

### 🗺️ Planificación de itinerarios

- Selección del origen y destino.
- Consulta de conexiones disponibles según la hora de salida.
- Generación de posibles itinerarios.
- Visualización de los horarios, las terminales y los transbordos.
- Identificación de conexiones inexistentes o no válidas.

### 🔄 Validación de transbordos

El sistema comprueba que la llegada de un bus permita tomar el siguiente dentro de los tiempos establecidos.

De esta manera, se evita recomendar itinerarios con conexiones imposibles o con horarios incompatibles.

### ⚡ Optimización de rutas

El usuario podrá elegir el criterio que mejor se adapte a sus necesidades:

- ⏱️ **Menor tiempo de viaje:** prioriza llegar al destino lo antes posible.
- 💤 **Menor tiempo de espera:** busca reducir el tiempo acumulado entre conexiones.
- 🚌 **Menor cantidad de conexiones:** prioriza itinerarios con menos transbordos.

### 🔎 Consulta de frecuencias

- Filtrado por cooperativa.
- Búsqueda por origen y destino.
- Consulta de horarios disponibles.
- Acceso libre a la información, sin necesidad de iniciar sesión.

### 🛠️ Gestión de información

El administrador se encarga de cargar y mantener actualizados los datos de terminales, cantones, cooperativas, rutas y horarios.

La información puede incorporarse mediante archivos JSON o CSV.

---

## 🧠 Planificación y optimización

El proyecto contempla el uso de estructuras de grafos y algoritmos para representar los viajes y evaluar las conexiones entre diferentes servicios de transporte.

### 📊 Representación mediante grafos

El sistema representa los eventos de salida y llegada como nodos, mientras que las conexiones entre ellos se modelan mediante aristas con pesos asociados a los tiempos de viaje o espera.

Esta representación permite analizar la viabilidad de los transbordos y calcular rutas entre los puntos de origen y destino.

### 🔗 Ordenamiento topológico

Se contempla el ordenamiento topológico para procesar un grafo dirigido acíclico, respetando las dependencias temporales entre los eventos del itinerario.

### ⚡ Algoritmo de Floyd-Warshall

Se contempla el uso de **Floyd-Warshall** para calcular los tiempos mínimos entre pares de nodos y facilitar la evaluación de rutas.

### 🕒 Gestión temporal

Los horarios se gestionan mediante fechas y horas completas en la zona horaria de Ecuador.

Esto permite distinguir correctamente los eventos de un viaje que continúa después de la medianoche y validar que cada conexión sea temporalmente posible.

> **Nota:** los algoritmos y mecanismos descritos corresponden al diseño técnico del proyecto. Su implementación y disponibilidad efectiva dependen del estado actual del código.

---

## 🛠️ Tecnologías

La plataforma utiliza JavaScript en el entorno de servidor y en la interfaz web, con herramientas especializadas para construir, probar y mantener el sistema.

### 💻 Desarrollo

| Tecnología | Función |
|---|---|
| ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black) **JavaScript** | Lenguaje principal del proyecto. |
| ![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white) **Node.js 24.x** | Entorno de ejecución del servidor. |
| ![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white) **Express 5.x** | Desarrollo de la API REST. |
| ![Vue.js](https://img.shields.io/badge/Vue.js-4FC08D?logo=vuedotjs&logoColor=white) **Vue.js 3.5.x** | Construcción de la interfaz de usuario. |
| ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white) **Tailwind CSS 4.x** | Estilos y diseño adaptable. |

### 🧪 Calidad y herramientas

| Herramienta | Función |
|---|---|
| ![Jest](https://img.shields.io/badge/Jest-C21325?logo=jest&logoColor=white) **Jest** | Pruebas unitarias. |
| ![Postman](https://img.shields.io/badge/Postman-FF6C37?logo=postman&logoColor=white) **Postman** | Pruebas manuales de la API. |
| ![ESLint](https://img.shields.io/badge/ESLint-4B32C3?logo=eslint&logoColor=white) **ESLint** | Análisis estático y consistencia del código. |
| ![Git](https://img.shields.io/badge/Git-F05032?logo=git&logoColor=white) **Git** | Control de versiones. |
| ![GitHub](https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=white) **GitHub** | Repositorio y colaboración del equipo. |

---

## 🏗️ Arquitectura general

El diseño del sistema separa las responsabilidades principales para facilitar su mantenimiento y evolución.

```text
┌──────────────────────────────────────────┐
│             👨‍🎓 ESTUDIANTE               │
│                                          │
│       Consulta y planificación           │
└────────────────────┬─────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────┐
│              🎨 FRONTEND                 │
│                                          │
│             Vue.js + Tailwind             │
└────────────────────┬─────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────┐
│               ⚙️ BACKEND                 │
│                                          │
│              Node.js + Express            │
├──────────────────────────────────────────┤
│                                          │
│  🗺️ Grafo de conexiones                  │
│  🔗 Ordenamiento topológico              │
│  ⚡ Cálculo de rutas                      │
│  🕒 Validación de horarios               │
│  🔄 Gestión de transbordos               │
│                                          │
└────────────────────┬─────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────┐
│             📂 DATOS DE ENTRADA           │
│                                          │
│             Archivos JSON / CSV           │
│                                          │
│    Terminales · Rutas · Horarios          │
└──────────────────────────────────────────┘
```

*El diagrama representa la arquitectura lógica prevista para el sistema, no necesariamente la distribución exacta de los módulos implementados en el repositorio.*

---

## 🚀 Instalación

### 📋 Requisitos previos

Antes de ejecutar el proyecto, asegúrate de contar con:

- [Node.js](https://nodejs.org/) 24.x o una versión compatible con el proyecto.
- npm, incluido con Node.js.
- [Git](https://git-scm.com/).
- [Visual Studio Code](https://code.visualstudio.com/) u otro editor compatible.

### 1. Clonar el repositorio

```bash
git clone https://github.com/js-valencia/Planificador_de_Viajes_EstudiantesUNL.git
```

### 2. Entrar al proyecto

```bash
cd Planificador_de_Viajes_EstudiantesUNL
```

### 3. Cambiar a la rama de desarrollo

```bash
git switch feature/start-proyect
```

### 4. Instalar las dependencias

Ejecuta este paso en cada directorio que contenga su propio `package.json`:

```bash
npm install
```

### 5. Ejecutar el proyecto

Los comandos de inicio dependen de los scripts definidos en los archivos `package.json` del repositorio.

Para consultar los scripts disponibles:

```bash
npm run
```

A continuación, ejecuta el comando de desarrollo correspondiente al módulo que quieras iniciar.

> **Importante:** los comandos de instalación y ejecución deben ajustarse a la estructura real del repositorio. No se presupone que el frontend y el backend compartan un único `package.json`.

---

## 🧪 Pruebas

El proyecto contempla pruebas unitarias para verificar el comportamiento de los componentes encargados de gestionar los grafos y validar las conexiones entre los servicios de transporte.

Para ejecutar las pruebas, utiliza el script definido en el `package.json` correspondiente.

```bash
npm test
```

Si el proyecto todavía no tiene configurado ese script, revisa la sección `scripts` del archivo `package.json` antes de ejecutar el comando.

---

## 🎯 Alcance del proyecto

Para mantener un desarrollo controlado y evaluar la solución con información real, la primera etapa se concentra en un alcance delimitado.

| Aspecto | Alcance inicial |
|---|---|
| 🎓 Público objetivo | Comunidad estudiantil de la Universidad Nacional de Loja. |
| 📍 Punto de partida | Terminal Terrestre Reina del Cisne, Loja. |
| 🚌 Cooperativas | Loja y Catamayo. |
| 🌐 Plataforma | Aplicación web de consulta libre. |
| 🔄 Funcionalidad principal | Consulta, validación y optimización de itinerarios. |
| 📂 Carga de datos | Archivos JSON o CSV administrados por el responsable del sistema. |

La delimitación inicial permite evaluar la utilidad del planificador antes de considerar una ampliación a más cooperativas y destinos.

---

## 🔐 Acceso y gestión de datos

La consulta de itinerarios está diseñada para ser pública y no requiere autenticación.

Las operaciones de mantenimiento de la información corresponden al administrador, quien se encarga de cargar, actualizar o deshabilitar los datos de rutas y terminales.

El sistema debe separar las operaciones públicas de consulta de las operaciones de administración, evitando que usuarios externos modifiquen la información del transporte.

---

## 👥 Equipo de desarrollo

**Proyecto académico de la Universidad Nacional de Loja.**

Este proyecto se desarrolla como una iniciativa orientada a resolver una necesidad de movilidad de la comunidad universitaria mediante el uso de herramientas de desarrollo web, estructuras de datos y algoritmos de optimización.

Para incorporar los integrantes, roles y datos académicos, completa esta sección con la información confirmada del equipo.

---

## 🗺️ Estado del proyecto

El desarrollo se encuentra en evolución. Las funcionalidades descritas en este documento reflejan el alcance y el diseño planteados para el sistema; no todas deben considerarse implementadas hasta que se verifiquen en el código.

- [x] Definición del problema y del público objetivo.
- [x] Delimitación del alcance inicial.
- [x] Selección de las tecnologías de desarrollo.
- [ ] Consolidación de la carga y validación de horarios.
- [ ] Implementación y verificación del cálculo de itinerarios.
- [ ] Integración completa entre frontend y backend.
- [ ] Pruebas integrales con horarios de las cooperativas.
- [ ] Evaluación del tiempo ahorrado durante la planificación.

*Actualiza las casillas a medida que el equipo complete y verifique cada funcionalidad.*

---

<div align="center">

### 🚌 Menos incertidumbre. Mejores conexiones. Más tiempo para estudiar.

**Planificador de Viajes Intercantonales · Universidad Nacional de Loja**

Desarrollado con 💙 para la comunidad universitaria.

</div>
