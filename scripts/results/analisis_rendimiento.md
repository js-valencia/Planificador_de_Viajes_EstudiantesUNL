# Análisis de Rendimiento: Búsqueda Secuencial vs Binaria

En base a los resultados obtenidos en el benchmark, se ha consolidado la información mediante un cuadro comparativo y un gráfico de curvas de rendimiento. A continuación, se presenta el análisis de los resultados.

## 1. Análisis de Escalabilidad

El gráfico demuestra claramente la diferencia de escalabilidad entre ambos algoritmos a medida que aumenta el volumen de datos (1,000, 50,000 y 500,000 registros):

*   **Búsqueda Secuencial ($O(n)$):** Como se observa en la curva ascendente, su tiempo de ejecución crece de forma lineal y proporcional al tamaño de los datos. Para 500,000 registros, el tiempo se eleva drásticamente superando los 120 ms. Su escalabilidad es pobre en grandes volúmenes de información.
*   **Búsqueda Binaria ($O(\log n)$):** La curva se mantiene prácticamente plana, demostrando una eficiencia excepcional. Incluso al buscar entre 500,000 registros, el tiempo de respuesta es de fracciones de milisegundo (alrededor de 0.010 ms). Su capacidad para escalar es óptima.

## 2. Análisis de Sostenibilidad

La elección del algoritmo tiene un impacto directo en la sostenibilidad del sistema a largo plazo:

*   **Consumo de Recursos:** La búsqueda secuencial obliga al procesador a realizar miles de iteraciones innecesarias, consumiendo más energía y memoria.
*   **Decisión Técnica:** Implementar la **Búsqueda Binaria** es la decisión más sostenible para el Planificador de Viajes. Aunque requiere que los datos estén previamente ordenados, el ahorro de tiempo de procesamiento y consumo en los servidores garantiza que la aplicación siga siendo rápida y eficiente, incluso si la base de datos de rutas y terminales crece exponencialmente en el futuro.