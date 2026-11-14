// Issue #11 - Criterios de comparación para registros de rutas (rutas.json).
// comparador(a, b): negativo si a va antes, positivo si va después, 0 si son equivalentes.
// Es la MISMA función que reciben quickSort y mergeSort.

// Se crean una sola vez (más rápido que localeCompare). 'es' ordena como diccionario en español;
// numeric:true hace que "LOJA-2" vaya antes que "LOJA-10".
const colTexto = new Intl.Collator('es');
const colId = new Intl.Collator('es', { numeric: true });

// Campos reales de rutas.json que se pueden comparar.
const COMPARADORES_DE_CAMPO = {
  cooperativa: (a, b) => colTexto.compare(a, b),
  nombre: (a, b) => colTexto.compare(a, b),
  id: (a, b) => colId.compare(a, b),
};

// Si falta un campo se usa '' para no fallar con registros incompletos.
const texto = (valor) => (valor === undefined || valor === null ? '' : String(valor));

// Evalúa los campos en orden de prioridad: si uno desempata, ese es el resultado.
function crearComparador(campos) {
  // Object.hasOwn evita aceptar propiedades heredadas como 'toString'.
  const desconocido = campos.find((campo) => !Object.hasOwn(COMPARADORES_DE_CAMPO, campo));
  if (desconocido) throw new Error(`Campo de comparación no soportado: ${desconocido}`);

  return (a, b) => {
    for (const campo of campos) {
      const resultado = COMPARADORES_DE_CAMPO[campo](texto(a[campo]), texto(b[campo]));
      if (resultado !== 0) return resultado;
    }
    return 0; // todos los campos iguales: registros duplicados
  };
}

// Prioridad: cooperativa -> nombre -> id (desempate final).
const CRITERIOS_RUTAS = ['cooperativa', 'nombre', 'id'];
const compararRutas = crearComparador(CRITERIOS_RUTAS);

module.exports = { compararRutas, crearComparador, CRITERIOS_RUTAS };
