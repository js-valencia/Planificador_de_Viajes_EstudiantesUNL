const fs = require('fs');
const path = require('path');

const resultadosPath = path.join(__dirname, 'results', 'benchmark_busqueda.json');

try {
    const dataRaw = fs.readFileSync(resultadosPath, 'utf8');
    const jsonParsed = JSON.parse(dataRaw);

    // Formateamos los datos para extraer solo el tiempo medio de búsquedas aleatorias
    const datosTabla = jsonParsed.tamanos.map(item => {
        // Accedemos a la categoría "exitosa-aleatorias"
        const secAleatoria = item.busqueda.secuencial.porCategoria['exitosa-aleatorias'];
        const binAleatoria = item.busqueda.binaria.porCategoria['exitosa-aleatorias'];

        return {
            'N° de Datos (n)': item.n,
            'Secuencial (ms)': secAleatoria ? secAleatoria.tiempoMedioMs.toFixed(4) : 'N/A',
            'Binaria (ms)': binAleatoria ? binAleatoria.tiempoMedioMs.toFixed(4) : 'N/A'
        };
    });

    console.log('\n======================================================');
    console.log('   TIEMPOS MEDIOS: BÚSQUEDA EXITOSA ALEATORIA');
    console.log('======================================================\n');
    
    console.table(datosTabla);

} catch (error) {
    console.error('Error al leer o procesar los datos:', error.message);
}