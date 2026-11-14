// Issue #11 - Criterios de comparación para registros de rutas (rutas.json).
// Contrato: comparador(a, b) -> negativo si a va antes, positivo si va después, 0 si son equivalentes.
// Es la MISMA función que reciben quickSort(arreglo, comparador) y mergeSort(arreglo, comparador).

// Intl.Collator se crea una sola vez: es mucho más rápido que localeCompare dentro de un ordenamiento.
// Textos en español (tildes y mayúsculas se ordenan como en un diccionario).
const colTexto = new Intl.Collator('es');
// Para el id, numeric:true hace que "LOJA-2" vaya antes que "LOJA-10".
const colId = new Intl.Collator('es', { numeric: true });

const COMPARADORES_DE_CAMPO = {
  cooperativa: (a, b) => colTexto.compare(a, b),
  nombre: (a, b) => colTexto.compare(a, b),
  id: (a, b) => colId.compare(a, b),
};

const texto = (valor) => (valor === undefined || valor === null ? '' : String(valor));

// Construye un comparador que evalúa los campos en el orden indicado (el primero tiene más prioridad).
function crearComparador(campos) {
  const desconocido = campos.find((campo) => !Object.hasOwn(COMPARADORES_DE_CAMPO, campo));
  if (desconocido) throw new Error(`Campo de comparación no soportado: ${desconocido}`);
  return (a, b) => {
    for (const campo of campos) {
      const resultado = COMPARADORES_DE_CAMPO[campo](texto(a[campo]), texto(b[campo]));
      if (resultado !== 0) return resultado;
    }
    return 0;
  };
}

// Criterio del Issue #11: cooperativa -> nombre -> id (desempate final).
const CRITERIOS_RUTAS = ['cooperativa', 'nombre', 'id'];
const compararRutas = crearComparador(CRITERIOS_RUTAS);

module.exports = { compararRutas, crearComparador, CRITERIOS_RUTAS };